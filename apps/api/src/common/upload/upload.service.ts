import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);
    private readonly s3Client: S3Client | null = null;
    private readonly bucketName: string;
    private readonly region: string;
    private readonly useS3: boolean;
    private readonly localUploadDir: string;

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

    constructor(private configService: ConfigService) {
        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
        this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
        this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'sidra-uploads';

        this.useS3 = !!(accessKeyId && secretAccessKey);

        if (this.useS3 && accessKeyId && secretAccessKey) {
            this.s3Client = new S3Client({
                region: this.region,
                credentials: {
                    accessKeyId: accessKeyId,
                    secretAccessKey: secretAccessKey,
                },
            });
            this.logger.log(`S3 Upload service configured for bucket: ${this.bucketName}`);
        } else {
            this.logger.warn('AWS S3 not configured - using local file storage instead');
        }

        // Setup local upload directory
        this.localUploadDir = path.join(process.cwd(), 'uploads');
        if (!this.useS3) {
            this.ensureLocalDirs();
        }
    }

    /**
     * Ensure local upload directories exist
     */
    private ensureLocalDirs(): void {
        const folders = ['teacher-docs', 'profile-photos', 'dispute-evidence', 'intro-videos', 'deposits'];
        for (const folder of folders) {
            const dirPath = path.join(this.localUploadDir, folder);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                this.logger.log(`Created local upload directory: ${dirPath}`);
            }
        }
    }

    /**
     * Upload a file (S3 or local storage)
     * Returns the file key
     */
    async uploadFile(
        file: Express.Multer.File,
        folder: 'teacher-docs' | 'profile-photos' | 'dispute-evidence' | 'intro-videos' | 'deposits'
    ): Promise<{ key: string; url: string }> {
        // Validate file type
        this.validateFileType(file);

        // Validate file size
        this.validateFileSize(file);

        // Generate unique key
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const ext = this.getFileExtension(file.originalname);
        const key = `${folder}/${timestamp}-${randomString}${ext}`;

        if (this.useS3 && this.s3Client) {
            return this.uploadToS3(file, key);
        } else {
            return this.uploadToLocal(file, key);
        }
    }

    /**
     * Upload to S3
     */
    private async uploadToS3(file: Express.Multer.File, key: string): Promise<{ key: string; url: string }> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            });

            await this.s3Client!.send(command);

            // Generate signed URL (valid for 1 hour)
            const url = await this.getSignedUrl(key, 3600);

            this.logger.log(`File uploaded to S3: ${key}`);
            return { key, url };
        } catch (error: any) {
            this.logger.error(`S3 upload failed: ${error.message}`, error.stack);
            throw new BadRequestException('File upload failed');
        }
    }

    /**
     * Upload to local storage
     */
    private async uploadToLocal(file: Express.Multer.File, key: string): Promise<{ key: string; url: string }> {
        try {
            const filePath = path.join(this.localUploadDir, key);

            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write file
            fs.writeFileSync(filePath, file.buffer);

            this.logger.log(`File uploaded locally: ${key}`);
            return { key, url: `/upload/file?key=${encodeURIComponent(key)}` };
        } catch (error: any) {
            this.logger.error(`Local upload failed: ${error.message}`, error.stack);
            throw new BadRequestException('File upload failed');
        }
    }

    /**
     * Get file (S3 signed URL or local file buffer)
     */
    async getFile(key: string): Promise<{ buffer: Buffer; contentType: string } | string> {
        if (this.useS3 && this.s3Client) {
            // Return signed URL for S3
            return this.getSignedUrl(key, 3600);
        } else {
            // Return local file
            return this.getLocalFile(key);
        }
    }

    /**
     * Get local file
     */
    private async getLocalFile(key: string): Promise<{ buffer: Buffer; contentType: string }> {
        const filePath = path.join(this.localUploadDir, key);

        if (!fs.existsSync(filePath)) {
            throw new BadRequestException('File not found');
        }

        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(key).toLowerCase();

        // Determine content type from extension
        let contentType = 'application/octet-stream';
        for (const [mime, exts] of Object.entries(this.ALLOWED_TYPES)) {
            if ((exts as string[]).includes(ext)) {
                contentType = mime;
                break;
            }
        }

        return { buffer, contentType };
    }

    /**
     * Get a signed URL for viewing a file (S3 only)
     */
    async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        if (!this.useS3 || !this.s3Client) {
            throw new BadRequestException('S3 not configured');
        }

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        return getSignedUrl(this.s3Client, command, { expiresIn });
    }

    /**
     * Check if using local storage
     */
    isLocalStorage(): boolean {
        return !this.useS3;
    }

    /**
     * Validate file type against allowlist
     */
    private validateFileType(file: Express.Multer.File): void {
        const allowed = this.ALLOWED_TYPES[file.mimetype as keyof typeof this.ALLOWED_TYPES];
        if (!allowed) {
            throw new BadRequestException(
                `File type not allowed: ${file.mimetype}. Allowed types: ${Object.keys(this.ALLOWED_TYPES).join(', ')}`
            );
        }

        // Double-check extension matches MIME type
        const ext = this.getFileExtension(file.originalname);
        if (!allowed.includes(ext.toLowerCase())) {
            throw new BadRequestException(`File extension ${ext} does not match MIME type ${file.mimetype}`);
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

