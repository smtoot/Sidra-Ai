import { Module } from '@nestjs/common';
import { SupportTicketController } from './support-ticket.controller';
import { AdminSupportTicketController } from './admin-support-ticket.controller';
import { SupportTicketService } from './support-ticket.service';
import { TicketMessageService } from './ticket-message.service';
import { TicketAccessGuard } from './guards/ticket-access.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { ReadableIdService } from '../common/readable-id.service';
import { PermissionService } from '../auth/permission.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [SupportTicketController, AdminSupportTicketController],
  providers: [
    SupportTicketService,
    TicketMessageService,
    TicketAccessGuard,
    ReadableIdService,
    PermissionService,
  ],
  exports: [SupportTicketService, TicketMessageService],
})
export class SupportTicketModule {}
