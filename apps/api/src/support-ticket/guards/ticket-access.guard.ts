import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard to check if user has access to a specific ticket
 * Used on routes that include :ticketId parameter
 */
@Injectable()
export class TicketAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ticketId = request.params.ticketId || request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!ticketId) {
      throw new ForbiddenException('Ticket ID not provided');
    }

    // Fetch ticket
    const ticket = await this.prisma.support_tickets.findUnique({
      where: { id: ticketId },
      include: {
        ticket_access_controls: {
          where: {
            userId: user.userId,
            canView: true,
            revokedAt: null,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'].includes(
      user.role,
    );

    // Admins can access all tickets
    if (isAdmin) {
      return true;
    }

    // Check if user is creator
    if (ticket.createdByUserId === user.userId) {
      return true;
    }

    // Check if user is assigned
    if (ticket.assignedToId === user.userId) {
      return true;
    }

    // Check access control
    if (ticket.ticket_access_controls.length > 0) {
      return true;
    }

    throw new ForbiddenException('You do not have access to this ticket');
  }
}
