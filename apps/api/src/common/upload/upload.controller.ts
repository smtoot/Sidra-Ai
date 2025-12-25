import { Controller, Post, Get, UseGuards, UseInterceptors, UploadedFile, Query, BadRequestException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UploadService } from './upload.service';
import type { Response } from 'express';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Query('folder') folder?: string
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Validate folder parameter
        const validFolders = ['teacher-docs', 'profile-photos', 'dispute-evidence', 'intro-videos', 'deposits'];
        if (!folder || !validFolders.includes(folder)) {
            throw new BadRequestException(
                `Invalid folder. Must be one of: ${validFolders.join(', ')}`
            );
        }

        const result = await this.uploadService.uploadFile(
            file,
            folder as any
        );

        return {
            success: true,
            fileKey: result.key,
            fileUrl: result.url,
            message: 'File uploaded successfully',
        };
    }

    @Get('file')
    async getFile(
        @Query('key') key: string,
        @Res() res: Response
    ) {
        if (!key) {
            throw new BadRequestException('File key is required');
        }

        const result = await this.uploadService.getFile(key);

        if (typeof result === 'string') {
            // S3 signed URL - redirect
            return res.redirect(result);
        } else {
            // Local file - stream it
            res.setHeader('Content-Type', result.contentType);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.send(result.buffer);
        }
    }
}

