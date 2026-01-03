import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
  Req,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Public } from '../../auth/public.decorator';
import { UploadService } from './upload.service';
import { StorageService } from '../storage/storage.service';
import type { Request, Response } from 'express';

/**
 * UploadController - Legacy upload endpoint.
 *
 * Note: Prefer using /storage endpoints for new implementations.
 * This controller is maintained for backwards compatibility.
 *
 * Security:
 * - All uploads require authentication
 * - File access is validated by ownership or admin role
 * - Public folders (profile-photos, intro-videos) can be accessed without auth
 */
@Controller('upload')
@UseGuards(ThrottlerGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(
    private readonly uploadService: UploadService,
    private readonly storageService: StorageService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 uploads per minute
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB (for videos)
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
    @Req() req?: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate folder parameter
    const validFolders = [
      'teacher-docs',
      'profile-photos',
      'dispute-evidence',
      'intro-videos',
      'deposits',
    ];
    if (!folder || !validFolders.includes(folder)) {
      throw new BadRequestException(
        `Invalid folder. Must be one of: ${validFolders.join(', ')}`,
      );
    }

    // Get user ID from request
    const userId = (req?.user as any)?.userId || 'anonymous';

    const result = await this.uploadService.uploadFile(
      file,
      folder as any,
      userId,
    );

    return {
      success: true,
      fileKey: result.key,
      fileUrl: result.url,
      message: 'File uploaded successfully',
    };
  }

  /**
   * Get file with proper access control.
   *
   * - Public folders (profile-photos, intro-videos): No auth required
   * - Private folders: Requires ownership or admin role
   */
  @Get('file')
  @Public() // Allow unauthenticated access - internal logic handles folder-based access control
  async getFile(
    @Query('key') key: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!key) {
      throw new BadRequestException('File key is required');
    }

    // Extract user info from Authorization header if present
    let userId: string | undefined;
    let userRole: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.jwtService.verify(token);
        userId = payload.sub;
        userRole = payload.role;
      } catch {
        // Token invalid or expired - treat as unauthenticated
      }
    }

    // Check if this is a public folder
    const folder = key.split('/')[0];
    const publicFolders = ['profile-photos', 'intro-videos'];
    const isPublicFile = publicFolders.includes(folder);

    // For private files, validate ownership or admin access
    if (!isPublicFile) {
      const fileOwnerId = this.storageService.extractUserIdFromKey(key);
      const isOwner = fileOwnerId === userId;
      const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE', 'SUPPORT'];
      const isAdmin = adminRoles.includes(userRole as string);

      if (!isOwner && !isAdmin) {
        this.logger.warn(
          `Unauthorized file access attempt: ${key} by user ${userId || 'anonymous'}`,
        );
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
    }

    // Check if file exists
    const exists = await this.uploadService.fileExists(key);
    if (!exists) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    // Get the file URL and redirect to it
    const url = await this.uploadService.getFileUrl(key);
    return res.redirect(url);
  }
}
