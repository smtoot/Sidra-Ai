import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMessageDto,
  TicketMessageDto,
  UserRole,
  TicketStatus,
} from '@sidra/shared';

@Injectable()
export class TicketMessageService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add a message to a ticket
   */
  async addMessage(
    ticketId: string,
    userId: string,
    userRole: UserRole,
    dto: CreateMessageDto,
  ): Promise<TicketMessageDto> {
    // Verify ticket exists
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Verify access
    await this.verifyAccess(ticketId, userId, userRole);

    // Check if ticket is closed
    if (ticket.status === TicketStatus.CLOSED) {
      throw new ForbiddenException('Cannot add messages to closed tickets');
    }

    // Create message
    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: userId,
        content: dto.content,
        attachments: dto.attachments || [],
        isInternal: false,
        isSystemGenerated: false,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Update ticket's lastActivityAt
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastActivityAt: new Date(),
        // Auto-transition from WAITING_FOR_CUSTOMER to WAITING_FOR_SUPPORT when customer replies
        status: this.shouldUpdateStatus(ticket.status as TicketStatus, userRole)
          ? TicketStatus.WAITING_FOR_SUPPORT
          : ticket.status,
      },
    });

    return this.mapToDto(message);
  }

  /**
   * Get all messages for a ticket
   */
  async findAllForTicket(
    ticketId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<TicketMessageDto[]> {
    // Verify access
    await this.verifyAccess(ticketId, userId, userRole);

    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(
      userRole,
    );

    const messages = await this.prisma.ticketMessage.findMany({
      where: {
        ticketId,
        // Filter out internal messages for non-admin users
        isInternal: isAdmin ? undefined : false,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((msg) => this.mapToDto(msg));
  }

  /**
   * Add internal message (admin only)
   */
  async addInternalMessage(
    ticketId: string,
    userId: string,
    dto: CreateMessageDto,
  ): Promise<TicketMessageDto> {
    // Verify ticket exists
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Create internal message
    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: userId,
        content: dto.content,
        attachments: dto.attachments || [],
        isInternal: true,
        isSystemGenerated: false,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Update ticket's lastActivityAt
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastActivityAt: new Date(),
      },
    });

    return this.mapToDto(message);
  }

  /**
   * Add system-generated message
   */
  async addSystemMessage(ticketId: string, content: string): Promise<void> {
    // Get system user (first SUPER_ADMIN)
    const systemUser = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (!systemUser) {
      // If no admin exists, skip system message
      return;
    }

    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: systemUser.id,
        content,
        attachments: [],
        isInternal: false,
        isSystemGenerated: true,
      },
    });

    // Update ticket's lastActivityAt
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastActivityAt: new Date(),
      },
    });
  }

  /**
   * Determine if status should be updated when user adds message
   */
  private shouldUpdateStatus(
    currentStatus: TicketStatus,
    userRole: UserRole,
  ): boolean {
    const isCustomer = ![
      'SUPER_ADMIN',
      'ADMIN',
      'MODERATOR',
      'SUPPORT',
    ].includes(userRole);
    return isCustomer && currentStatus === TicketStatus.WAITING_FOR_CUSTOMER;
  }

  /**
   * Verify user has access to ticket
   */
  private async verifyAccess(
    ticketId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(
      userRole,
    );

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        accessControls: {
          where: {
            userId,
            canReply: true,
            revokedAt: null,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Admins can always reply
    if (isAdmin) {
      return;
    }

    // Check if user is creator
    if (ticket.createdByUserId === userId) {
      return;
    }

    // Check if user is assigned
    if (ticket.assignedToId === userId) {
      return;
    }

    // Check access control
    if (ticket.accessControls.length > 0) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to reply to this ticket',
    );
  }

  /**
   * Map Prisma model to DTO
   */
  private mapToDto(message: any): TicketMessageDto {
    return {
      id: message.id,
      content: message.content,
      attachments: message.attachments,
      isInternal: message.isInternal,
      isSystemGenerated: message.isSystemGenerated,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      author: message.author,
    };
  }
}
