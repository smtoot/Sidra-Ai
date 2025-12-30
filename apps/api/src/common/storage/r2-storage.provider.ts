import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { StorageProvider } from './storage.service';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string; // Optional public URL for public bucket access
}

/**
 * Cloudflare R2 Storage Provider
 *
 * Uses S3-compatible API with R2-specific endpoint.
 * Supports both private (signed URLs) and public access modes.
 */
@Injectable()
export class R2StorageProvider implements StorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl?: string;

  // Folders that should be publicly accessible (no signed URLs needed)
  private readonly PUBLIC_FOLDERS = ['profile-photos', 'intro-videos'];

  constructor(config: R2Config) {
    this.bucketName = config.bucketName;
    this.publicUrl = config.publicUrl;

    // R2 uses S3-compatible endpoint: https://<accountId>.r2.cloudflarestorage.com
    const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;

    this.s3Client = new S3Client({
      region: 'auto', // R2 uses 'auto' for region
      endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    this.logger.log(
      `R2 Storage Provider initialized for bucket: ${this.bucketName}`,
    );
  }

  /**
   * Save a file buffer to R2
   * @param buffer - File content
   * @param fileKey - The storage key (path) for the file
   * @param contentType - MIME type of the file
   */
  async save(
    buffer: Buffer,
    fileKey: string,
    contentType?: string,
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      });

      await this.s3Client.send(command);
      this.logger.log(`File saved to R2: ${fileKey}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to save file to R2: ${error.message}`,
        error.stack,
      );
      throw new Error(`R2 upload failed: ${error.message}`);
    }
  }

  /**
   * Get a readable stream for a file from R2
   * @param fileKey - The storage key (path) of the file
   */
  getStream(fileKey: string): Readable {
    // For R2, we need to fetch the object and return its body as a stream
    // This is an async operation, so we create a passthrough stream
    const { PassThrough } = require('stream');
    const passThrough = new PassThrough();

    this.getStreamAsync(fileKey, passThrough).catch((error) => {
      this.logger.error(`Failed to stream file from R2: ${error.message}`);
      passThrough.destroy(error);
    });

    return passThrough;
  }

  private async getStreamAsync(
    fileKey: string,
    passThrough: any,
  ): Promise<void> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    const response = await this.s3Client.send(command);
    const body = response.Body as Readable;

    if (body) {
      body.pipe(passThrough);
    } else {
      passThrough.end();
    }
  }

  /**
   * Delete a file from R2
   * @param fileKey - The storage key (path) of the file
   */
  async delete(fileKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted from R2: ${fileKey}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to delete file from R2: ${error.message}`,
        error.stack,
      );
      throw new Error(`R2 delete failed: ${error.message}`);
    }
  }

  /**
   * Check if a file exists in R2
   * @param fileKey - The storage key (path) of the file
   */
  async exists(fileKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get a URL for accessing a file
   * - For public folders: returns direct public URL
   * - For private folders: returns signed URL with expiration
   *
   * @param fileKey - The storage key (path) of the file
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  async getUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
    const folder = fileKey.split('/')[0];

    // For public folders with public URL configured, return direct URL
    if (this.publicUrl && this.PUBLIC_FOLDERS.includes(folder)) {
      return `${this.publicUrl}/${fileKey}`;
    }

    // For private folders, generate signed URL
    return this.getSignedUrl(fileKey, expiresIn);
  }

  /**
   * Generate a presigned URL for private file access
   * @param fileKey - The storage key (path) of the file
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  async getSignedUrl(
    fileKey: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate a presigned URL for uploading (direct upload from frontend)
   * @param fileKey - The storage key (path) for the file
   * @param contentType - MIME type of the file
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  async getUploadUrl(
    fileKey: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Check if a folder should be publicly accessible
   */
  isPublicFolder(folder: string): boolean {
    return this.PUBLIC_FOLDERS.includes(folder);
  }
}
