import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailOutboxWorker } from './email-outbox.worker';

@Module({
    imports: [PrismaModule],
    controllers: [NotificationController],
    providers: [NotificationService, EmailOutboxWorker],
    exports: [NotificationService],
})
export class NotificationModule { }
