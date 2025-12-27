import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET'),
            }),
        }),
    ],
    controllers: [StorageController],
    providers: [StorageService],
    exports: [StorageService],
})
export class StorageModule { }

