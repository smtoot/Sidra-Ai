import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReadableIdService } from '../common/readable-id.service';
import { NotificationService } from '../notification/notification.service';
import {
  CreateSupportTicketDto,
  UpdateSupportTicketDto,
  AssignTicketDto,
  SupportTicketDto,
  SupportTicketDetailDto,
  TicketStatus,
  TicketType,
  TicketPriority,
  EscalationLevel,
  UserRole,
} from '@sidra/shared';

@Injectable()
export class SupportTicketService {
  private readonly logger = new Logger(SupportTicketService.name);

  constructor(
    private prisma: PrismaService,
    private readableIdService: ReadableIdService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Create a new support ticket
   */
  async create(
    userId: string,
    dto: CreateSupportTicketDto,
  ): Promise<SupportTicketDetailDto> {
    // Generate readable ID
    const readableId = await this.readableIdService.generateTicketId();

    // Determine priority (default to NORMAL if not set)
    const priority = dto.priority || TicketPriority.NORMAL;

    // Calculate SLA deadline based on priority
    const slaDeadline = this.calculateSLADeadline(priority);

    // Create ticket
    const ticket = await this.prisma.support_tickets.create({
      data: {
        id: crypto.randomUUID(),
        readableId,
        createdByUserId: userId,
        category: dto.category,
        type: TicketType.SUPPORT,
        priority,
        status: TicketStatus.OPEN,
        subject: dto.subject,
        description: dto.description,
        evidence: dto.evidence || [],
        linkedBookingId: dto.linkedBookingId,
        linkedTeacherId: dto.linkedTeacherId,
        linkedStudentId: dto.linkedStudentId,
        escalationLevel: EscalationLevel.L1,
        slaDeadline,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        users_support_tickets_createdByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
        users_support_tickets_assignedToIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        users_support_tickets_resolvedByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        ticket_messages: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        ticket_status_history: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Create initial status history entry
    await this.prisma.ticket_status_history.create({
      data: {
        ticketId: ticket.id,
        fromStatus: null,
        toStatus: TicketStatus.OPEN,
        changedByUserId: userId,
        reason: 'Ticket created',
      },
    });

    // Create access control for creator
    await this.prisma.ticket_access_controls.create({
      data: {
        ticketId: ticket.id,
        userId,
        canView: true,
        canReply: true,
        canClose: true,
        canReopen: true,
      },
    });

    // Notify all support staff about new ticket
    await this.notifyAdminsAboutNewTicket(ticket);

    return this.mapToDetailDto(ticket);
  }

  /**
   * Notify admin/support staff about new support ticket
   */
  private async notifyAdminsAboutNewTicket(ticket: any): Promise<void> {
    try {
      // Get all admin/support users
      const admins = await this.prisma.users.findMany({
        where: {
          role: { in: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'] },
          isActive: true,
        },
        select: { id: true },
      });

      const creatorName = ticket.createdBy?.firstName
        ? `${ticket.createdBy.firstName} ${ticket.createdBy.lastName || ''}`.trim()
        : 'مستخدم';

      // Send notification to each admin
      for (const admin of admins) {
        await this.notificationService.notifyUser({
          userId: admin.id,
          type: 'ADMIN_ALERT',
          title: `طلب مساعدة جديد: ${ticket.readableId}`,
          message: `طلب جديد من ${creatorName}: ${ticket.subject}`,
          link: `/admin/support-tickets/${ticket.id}`,
          metadata: {
            ticketId: ticket.id,
            readableId: ticket.readableId,
            priority: ticket.priority,
            category: ticket.category,
          },
          dedupeKey: `NEW_TICKET:${ticket.id}`,
        });
      }

      this.logger.log(
        `Notified ${admins.length} admins about new ticket ${ticket.readableId}`,
      );
    } catch (error) {
      // Don't fail ticket creation if notification fails
      this.logger.error(
        'Failed to send admin notifications for new ticket',
        error,
      );
    }
  }

  /**
   * Find all tickets for a user (creator or assigned)
   */
  async findAllForUser(
    userId: string,
    userRole: UserRole,
  ): Promise<SupportTicketDto[]> {
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(
      userRole,
    );

    const tickets = await this.prisma.support_tickets.findMany({
      where: isAdmin
        ? {} // Admins can see all tickets
        : {
            OR: [
              { createdByUserId: userId },
              { assignedToId: userId },
              { ticket_access_controls: { some: { userId, canView: true } } },
            ],
          },
      include: {
        users_support_tickets_createdByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
        users_support_tickets_assignedToIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { slaBreach: 'desc' }, // SLA breaches first
        { priority: 'desc' },
        { lastActivityAt: 'desc' },
      ],
    });

    return tickets.map((ticket) => this.mapToDto(ticket));
  }

  /**
   * Find one ticket by ID
   */
  async findOne(
    ticketId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<SupportTicketDetailDto> {
    const ticket = await this.prisma.support_tickets.findUnique({
      where: { id: ticketId },
      include: {
        users_support_tickets_createdByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
        users_support_tickets_assignedToIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        users_support_tickets_resolvedByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        ticket_messages: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        ticket_status_history: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Check access
    await this.verifyAccess(ticket, userId, userRole);

    return this.mapToDetailDto(ticket);
  }

  /**
   * Update ticket (admin only)
   */
  async update(
    ticketId: string,
    userId: string,
    dto: UpdateSupportTicketDto,
  ): Promise<SupportTicketDetailDto> {
    const ticket = await this.prisma.support_tickets.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Track status changes for history
    const oldStatus = ticket.status;
    const newStatus = dto.status || oldStatus;

    // Update ticket
    const updated = await this.prisma.support_tickets.update({
      where: { id: ticketId },
      data: {
        status: dto.status,
        priority: dto.priority,
        escalationLevel: dto.escalationLevel,
        resolutionNote: dto.resolutionNote,
        resolvedAt:
          newStatus === TicketStatus.RESOLVED &&
          oldStatus !== TicketStatus.RESOLVED
            ? new Date()
            : ticket.resolvedAt,
        resolvedByUserId:
          newStatus === TicketStatus.RESOLVED &&
          oldStatus !== TicketStatus.RESOLVED
            ? userId
            : ticket.resolvedByUserId,
        closedAt:
          newStatus === TicketStatus.CLOSED && oldStatus !== TicketStatus.CLOSED
            ? new Date()
            : ticket.closedAt,
        lastActivityAt: new Date(),
      },
      include: {
        users_support_tickets_createdByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
        users_support_tickets_assignedToIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        users_support_tickets_resolvedByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        ticket_messages: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        ticket_status_history: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Record status change
    if (oldStatus !== newStatus) {
      await this.prisma.ticket_status_history.create({
        data: {
          ticketId,
          fromStatus: oldStatus,
          toStatus: newStatus,
          changedByUserId: userId,
          reason: dto.resolutionNote || 'Status updated',
        },
      });
    }

    return this.mapToDetailDto(updated);
  }

  /**
   * Assign ticket to support agent
   */
  async assign(
    ticketId: string,
    dto: AssignTicketDto,
  ): Promise<SupportTicketDetailDto> {
    const ticket = await this.prisma.support_tickets.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Verify assignee exists and is an admin
    const assignee = await this.prisma.users.findUnique({
      where: { id: dto.assignedToId },
    });

    if (!assignee) {
      throw new NotFoundException(`User ${dto.assignedToId} not found`);
    }

    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(
      assignee.role,
    );
    if (!isAdmin) {
      throw new BadRequestException('Can only assign tickets to support staff');
    }

    // Update ticket
    const updated = await this.prisma.support_tickets.update({
      where: { id: ticketId },
      data: {
        assignedToId: dto.assignedToId,
        status:
          ticket.status === TicketStatus.OPEN
            ? TicketStatus.IN_PROGRESS
            : ticket.status,
        lastActivityAt: new Date(),
      },
      include: {
        users_support_tickets_createdByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
        users_support_tickets_assignedToIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        users_support_tickets_resolvedByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        ticket_messages: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        ticket_status_history: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Create access control for assignee
    await this.prisma.ticket_access_controls.upsert({
      where: {
        ticketId_userId: {
          ticketId,
          userId: dto.assignedToId,
        },
      },
      create: {
        ticketId,
        userId: dto.assignedToId,
        canView: true,
        canReply: true,
        canClose: true,
        canReopen: true,
      },
      update: {
        canView: true,
        canReply: true,
        canClose: true,
        canReopen: true,
      },
    });

    return this.mapToDetailDto(updated);
  }

  /**
   * Close ticket
   */
  async close(
    ticketId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<SupportTicketDetailDto> {
    const ticket = await this.prisma.support_tickets.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Verify access
    await this.verifyAccess(ticket, userId, userRole);

    // Update ticket
    const updated = await this.prisma.support_tickets.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
        lastActivityAt: new Date(),
      },
      include: {
        users_support_tickets_createdByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
        users_support_tickets_assignedToIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        users_support_tickets_resolvedByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        ticket_messages: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        ticket_status_history: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Record status change
    await this.prisma.ticket_status_history.create({
      data: {
        ticketId,
        fromStatus: ticket.status,
        toStatus: TicketStatus.CLOSED,
        changedByUserId: userId,
        reason: 'Ticket closed',
      },
    });

    return this.mapToDetailDto(updated);
  }

  /**
   * Reopen ticket (only for SUPPORT type tickets)
   */
  async reopen(
    ticketId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<SupportTicketDetailDto> {
    const ticket = await this.prisma.support_tickets.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // Only SUPPORT type tickets can be reopened
    if (ticket.type === TicketType.DISPUTE) {
      throw new BadRequestException('Dispute tickets cannot be reopened');
    }

    // Verify access
    await this.verifyAccess(ticket, userId, userRole);

    // Update ticket
    const updated = await this.prisma.support_tickets.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.OPEN,
        closedAt: null,
        lastActivityAt: new Date(),
      },
      include: {
        users_support_tickets_createdByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
        users_support_tickets_assignedToIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        users_support_tickets_resolvedByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        ticket_messages: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        ticket_status_history: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Record status change
    await this.prisma.ticket_status_history.create({
      data: {
        ticketId,
        fromStatus: ticket.status,
        toStatus: TicketStatus.OPEN,
        changedByUserId: userId,
        reason: 'Ticket reopened',
      },
    });

    return this.mapToDetailDto(updated);
  }

  /**
   * Calculate SLA deadline based on priority
   * TODO: These values are placeholders - will be decided later
   */
  private calculateSLADeadline(priority: TicketPriority): Date {
    const now = new Date();
    let hours = 24; // Default

    switch (priority) {
      case TicketPriority.CRITICAL:
        hours = 2;
        break;
      case TicketPriority.HIGH:
        hours = 12;
        break;
      case TicketPriority.NORMAL:
        hours = 24;
        break;
      case TicketPriority.LOW:
        hours = 72;
        break;
    }

    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  /**
   * Verify user has access to ticket
   */
  private async verifyAccess(
    ticket: any,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(
      userRole,
    );

    // Admins can access all tickets
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
    const access = await this.prisma.ticket_access_controls.findUnique({
      where: {
        ticketId_userId: {
          ticketId: ticket.id,
          userId,
        },
      },
    });

    if (access && access.canView && !access.revokedAt) {
      return;
    }

    throw new ForbiddenException('You do not have access to this ticket');
  }

  /**
   * Map Prisma model to DTO
   */
  private mapToDto(ticket: any): SupportTicketDto {
    return {
      id: ticket.id,
      readableId: ticket.readableId,
      category: ticket.category,
      type: ticket.type,
      status: ticket.status,
      priority: ticket.priority,
      subject: ticket.subject,
      escalationLevel: ticket.escalationLevel,
      slaBreach: ticket.slaBreach,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      lastActivityAt: ticket.lastActivityAt,
      createdBy: ticket.users_support_tickets_createdByUserIdTousers,
      assignedTo: ticket.users_support_tickets_assignedToIdTousers,
    };
  }

  /**
   * Map Prisma model to detailed DTO
   */
  private mapToDetailDto(ticket: any): SupportTicketDetailDto {
    return {
      ...this.mapToDto(ticket),
      description: ticket.description,
      evidence: ticket.evidence,
      slaDeadline: ticket.slaDeadline,
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
      resolutionNote: ticket.resolutionNote,
      linkedBookingId: ticket.linkedBookingId,
      linkedTeacherId: ticket.linkedTeacherId,
      linkedStudentId: ticket.linkedStudentId,
      disputeId: ticket.disputeId,
      resolvedBy: ticket.users_support_tickets_resolvedByUserIdTousers,
      messages: ticket.ticket_messages || [],
      statusHistory: ticket.ticket_status_history || [],
    };
  }
}
