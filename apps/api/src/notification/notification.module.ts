import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailOutboxWorker } from './email-outbox.worker';
import { EmailPreviewService } from './email-preview.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, EmailOutboxWorker, EmailPreviewService],
  exports: [NotificationService, EmailOutboxWorker, EmailPreviewService],
})
export class NotificationModule {}
