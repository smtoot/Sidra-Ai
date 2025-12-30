import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { StorageService, UploadFolder } from '../storage/storage.service';
import { validateMagicBytes, detectDangerousContent } from './file-validator';

/**
 * UploadService - Handles file upload validation and delegates storage to StorageService.
 *
 * This service provides:
 * - File type validation (MIME type allowlist)
 * - File size validation (based on file type)
 * - Extension verification
 *
 * Storage is handled by StorageService which supports:
 * - Cloudflare R2 (primary)
 * - Local filesystem (fallback)
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  // Allowlist of file types and their MIME types
  private readonly ALLOWED_TYPES = {
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    // Documents
    'application/pdf': ['.pdf'],
    // Video
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
  };

  // Max file sizes (in bytes)
  private readonly MAX_FILE_SIZE = {
    image: 5 * 1024 * 1024, // 5MB for images
    document: 10 * 1024 * 1024, // 10MB for PDFs
    video: 50 * 1024 * 1024, // 50MB for videos
  };

  constructor(private readonly storageService: StorageService) {
    this.logger.log(
      `UploadService initialized (storage: ${this.storageService.getStorageType()})`,
    );
  }

  /**
   * Upload a file to storage (R2 or local)
   * Returns the file key and URL
   *
   * @param file - Multer file object
   * @param folder - Target folder
   * @param userId - User ID for file ownership (optional, defaults to 'anonymous')
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: UploadFolder,
    userId: string = 'anonymous',
  ): Promise<{ key: string; url: string }> {
    // Check for dangerous content first (executables, scripts, etc.)
    const dangerousContent = detectDangerousContent(file.buffer);
    if (dangerousContent) {
      this.logger.warn(`Dangerous file upload blocked: ${dangerousContent}`);
      throw new BadRequestException(
        `Dangerous file type detected: ${dangerousContent}`,
      );
    }

    // Validate file type (MIME type allowlist)
    this.validateFileType(file);

    // Validate magic bytes match claimed MIME type
    validateMagicBytes(file.buffer, file.mimetype);

    // Validate file size
    this.validateFileSize(file);

    try {
      // Generate file key
      const { fileKey } = this.storageService.generateUploadTarget(
        file.originalname,
        folder,
        userId,
      );

      // Save file to storage
      await this.storageService.saveFile(file.buffer, fileKey, file.mimetype);

      // Get URL for the file
      const url = await this.storageService.getFileUrl(fileKey);

      this.logger.log(`File uploaded: ${fileKey}`);
      return { key: fileKey, url };
    } catch (error: any) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      throw new BadRequestException('File upload failed');
    }
  }

  /**
   * Get file URL (for R2: signed/public URL, for local: API endpoint)
   */
  async getFileUrl(key: string): Promise<string> {
    return this.storageService.getFileUrl(key);
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    return this.storageService.fileExists(key);
  }

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<void> {
    return this.storageService.deleteFile(key);
  }

  /**
   * Check if using cloud storage (R2)
   */
  isCloudStorage(): boolean {
    return this.storageService.isCloudStorage();
  }

  /**
   * Check if using local storage
   */
  isLocalStorage(): boolean {
    return !this.storageService.isCloudStorage();
  }

  /**
   * Validate file type against allowlist
   */
  private validateFileType(file: Express.Multer.File): void {
    const allowed =
      this.ALLOWED_TYPES[file.mimetype as keyof typeof this.ALLOWED_TYPES];
    if (!allowed) {
      throw new BadRequestException(
        `File type not allowed: ${file.mimetype}. Allowed types: ${Object.keys(this.ALLOWED_TYPES).join(', ')}`,
      );
    }

    // Double-check extension matches MIME type
    const ext = this.getFileExtension(file.originalname);
    if (!allowed.includes(ext.toLowerCase())) {
      throw new BadRequestException(
        `File extension ${ext} does not match MIME type ${file.mimetype}`,
      );
    }
  }

  /**
   * Validate file size based on type
   */
  private validateFileSize(file: Express.Multer.File): void {
    let maxSize: number;

    if (file.mimetype.startsWith('image/')) {
      maxSize = this.MAX_FILE_SIZE.image;
    } else if (file.mimetype.startsWith('video/')) {
      maxSize = this.MAX_FILE_SIZE.video;
    } else if (file.mimetype === 'application/pdf') {
      maxSize = this.MAX_FILE_SIZE.document;
    } else {
      maxSize = this.MAX_FILE_SIZE.document; // Default
    }

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(`File too large. Max size: ${maxSizeMB}MB`);
    }
  }

  /**
   * Extract file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.'));
  }
}
