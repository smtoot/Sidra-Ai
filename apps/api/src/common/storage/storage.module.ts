import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

/**
 * StorageModule - Provides file storage capabilities.
 * 
 * Global module so StorageService can be injected anywhere.
 * Currently uses local filesystem storage.
 * Designed for easy switch to S3 in future (replace provider).
 */
@Global()
@Module({
    controllers: [StorageController],
    providers: [StorageService],
    exports: [StorageService],
})
export class StorageModule { }
