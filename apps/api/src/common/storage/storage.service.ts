import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { R2StorageProvider } from './r2-storage.provider';

/**
 * Storage provider interface for extensibility (R2, S3, GCS, local filesystem)
 */
export interface StorageProvider {
  save(buffer: Buffer, fileKey: string, contentType?: string): Promise<void>;
  getStream(fileKey: string): Readable;
  delete(fileKey: string): Promise<void>;
  exists(fileKey: string): Promise<boolean>;
}

/**
 * Local filesystem storage provider.
 * Files are stored under UPLOAD_LOCAL_PATH environment variable.
 * Used as fallback when cloud storage is not configured.
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async save(
    buffer: Buffer,
    fileKey: string,
    _contentType?: string,
  ): Promise<void> {
    const absolutePath = path.join(this.basePath, fileKey);
    const dir = path.dirname(absolutePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(absolutePath, buffer);
    this.logger.log(`File saved locally: ${fileKey}`);
  }

  getStream(fileKey: string): Readable {
    const absolutePath = path.join(this.basePath, fileKey);
    return fs.createReadStream(absolutePath);
  }

  async delete(fileKey: string): Promise<void> {
    const absolutePath = path.join(this.basePath, fileKey);
    try {
      await fs.promises.unlink(absolutePath);
      this.logger.log(`File deleted: ${fileKey}`);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // File already doesn't exist, that's fine
    }
  }

  async exists(fileKey: string): Promise<boolean> {
    const absolutePath = path.join(this.basePath, fileKey);
    try {
      await fs.promises.access(absolutePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Upload target result containing file key and paths.
 */
export interface UploadTarget {
  /** Unique key for this file (stored in DB, used to retrieve file) */
  fileKey: string;
  /** Absolute path on filesystem where file should be saved */
  absolutePath: string;
}

/**
 * Allowed upload folders for access control.
 */
export type UploadFolder =
  | 'deposits'
  | 'teacher-docs'
  | 'disputes'
  | 'profile-photos'
  | 'intro-videos'
  | 'dispute-evidence';

/**
 * Allowed MIME types for uploads.
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/webm',
];

/**
 * Maximum file size in bytes (5MB).
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Storage type enum for provider selection
 */
export type StorageType = 'r2' | 'local';

/**
 * StorageService - Abstract storage layer for file uploads.
 *
 * Design decisions:
 * - fileKey is the unique identifier stored in DB (e.g., "deposits/user123/1702900000000-receipt.jpg")
 * - Provider priority: R2 (Cloudflare) → Local filesystem
 * - Public folders (profile-photos, intro-videos) can be accessed directly via CDN
 * - Private folders require signed URLs or authenticated endpoints
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly basePath: string;
  private readonly provider: StorageProvider;
  private readonly r2Provider?: R2StorageProvider;
  private readonly storageType: StorageType;

  // Folders that should be publicly accessible
  private readonly PUBLIC_FOLDERS = ['profile-photos', 'intro-videos'];

  constructor(private configService: ConfigService) {
    // Default to ./uploads in project root if not set
    this.basePath =
      this.configService.get<string>('UPLOAD_LOCAL_PATH') ||
      path.join(process.cwd(), 'uploads');

    // Check for R2 configuration
    const r2AccountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const r2AccessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const r2SecretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    const r2BucketName = this.configService.get<string>('R2_BUCKET_NAME');
    const r2PublicUrl = this.configService.get<string>('R2_PUBLIC_URL');

    if (r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2BucketName) {
      // Use Cloudflare R2
      this.r2Provider = new R2StorageProvider({
        accountId: r2AccountId,
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
        bucketName: r2BucketName,
        publicUrl: r2PublicUrl,
      });
      this.provider = this.r2Provider;
      this.storageType = 'r2';
      this.logger.log(
        `Storage initialized with Cloudflare R2 (bucket: ${r2BucketName})`,
      );
    } else {
      // Fallback to local storage
      this.provider = new LocalStorageProvider(this.basePath);
      this.storageType = 'local';
      fs.mkdirSync(this.basePath, { recursive: true });
      this.logger.warn('R2 not configured - using local file storage');
      this.logger.log(`Local storage initialized at: ${this.basePath}`);
    }
  }

  /**
   * Generate upload target for a new file.
   * The fileKey is generated by the backend, not controlled by frontend.
   */
  generateUploadTarget(
    originalFileName: string,
    folder: UploadFolder,
    userId: string,
  ): UploadTarget {
    const sanitizedName = this.sanitizeFileName(originalFileName);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileKey = `${folder}/${userId}/${timestamp}-${randomString}-${sanitizedName}`;
    const absolutePath = path.join(this.basePath, fileKey);

    return { fileKey, absolutePath };
  }

  /**
   * Validate file before upload.
   * Throws error if validation fails.
   */
  validateFile(buffer: Buffer, mimeType: string): void {
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(
        `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
  }

  /**
   * Save file buffer to storage.
   * @param buffer - File content
   * @param fileKey - The storage key for the file
   * @param contentType - MIME type of the file
   */
  async saveFile(
    buffer: Buffer,
    fileKey: string,
    contentType?: string,
  ): Promise<void> {
    const normalizedKey = this.normalizeFileKey(fileKey);
    await this.provider.save(buffer, normalizedKey, contentType);
  }

  /**
   * Get readable stream for a file by its key.
   */
  getFileStream(fileKey: string): Readable {
    const normalizedKey = this.normalizeFileKey(fileKey);
    return this.provider.getStream(normalizedKey);
  }

  /**
   * Delete a file by its key.
   */
  async deleteFile(fileKey: string): Promise<void> {
    const normalizedKey = this.normalizeFileKey(fileKey);
    await this.provider.delete(normalizedKey);
  }

  /**
   * Check if a file exists by its key.
   */
  async fileExists(fileKey: string): Promise<boolean> {
    const normalizedKey = this.normalizeFileKey(fileKey);
    return this.provider.exists(normalizedKey);
  }

  /**
   * Get URL for accessing a file.
   * - For R2 public folders: returns direct CDN URL
   * - For R2 private folders: returns signed URL
   * - For local storage: returns API endpoint path
   *
   * @param fileKey - The storage key of the file
   * @param expiresIn - Expiration time in seconds for signed URLs (default: 1 hour)
   */
  async getFileUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
    if (this.r2Provider) {
      return this.r2Provider.getUrl(fileKey, expiresIn);
    }

    // For local storage, return the API endpoint
    return `/storage/file?key=${encodeURIComponent(fileKey)}`;
  }

  /**
   * Get a presigned URL for direct upload from frontend (R2 only).
   * For local storage, returns null - use the standard upload endpoint instead.
   *
   * @param fileKey - The storage key for the file
   * @param contentType - MIME type of the file
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  async getUploadUrl(
    fileKey: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string | null> {
    if (this.r2Provider) {
      return this.r2Provider.getUploadUrl(fileKey, contentType, expiresIn);
    }
    return null;
  }

  /**
   * Check if using cloud storage (R2)
   */
  isCloudStorage(): boolean {
    return this.storageType === 'r2';
  }

  /**
   * Get the current storage type
   */
  getStorageType(): StorageType {
    return this.storageType;
  }

  /**
   * Check if a folder is publicly accessible
   */
  isPublicFolder(folder: string): boolean {
    return this.PUBLIC_FOLDERS.includes(folder);
  }

  /**
   * Extract user ID from file key for ownership validation.
   * Key format: folder/userId/timestamp-filename
   */
  extractUserIdFromKey(fileKey: string): string | null {
    const parts = fileKey.split('/');
    if (parts.length >= 2) {
      return parts[1];
    }
    return null;
  }

  /**
   * Normalize file key to prevent path traversal attacks
   */
  private normalizeFileKey(fileKey: string): string {
    return path.normalize(fileKey).replace(/^(\.\.(\/|\\|$))+/, '');
  }

  /**
   * Sanitize filename to prevent path traversal and special characters.
   */
  private sanitizeFileName(fileName: string): string {
    // Remove path separators, special chars, keep alphanumeric, dots, dashes, underscores
    return fileName
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/\.{2,}/g, '.') // No double dots
      .substring(0, 100); // Limit length
  }

  /**
   * Get content type based on file extension.
   */
  getContentType(fileKey: string): string {
    const ext = path.extname(fileKey).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
