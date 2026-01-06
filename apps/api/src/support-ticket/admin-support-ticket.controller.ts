import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { SupportTicketService } from './support-ticket.service';
import { TicketMessageService } from './ticket-message.service';
import { PERMISSIONS } from '../auth/permissions.constants';
import {
  UpdateSupportTicketDto,
  AssignTicketDto,
  CreateMessageDto,
  SupportTicketDto,
  SupportTicketDetailDto,
  TicketMessageDto,
} from '@sidra/shared';

@Controller('admin/support-tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminSupportTicketController {
  constructor(
    private readonly ticketService: SupportTicketService,
    private readonly messageService: TicketMessageService,
  ) {}

  /**
   * Get all tickets (admin view)
   */
  @Get()
  @RequirePermissions(PERMISSIONS.TICKETS_VIEW)
  async findAll(@Request() req: any): Promise<SupportTicketDto[]> {
    return this.ticketService.findAllForUser(req.user.userId, req.user.role);
  }

  /**
   * Get all tickets for a specific user
   */
  @Get('users/:userId')
  @RequirePermissions(PERMISSIONS.TICKETS_VIEW)
  async findByUser(
    @Param('userId') userId: string,
  ): Promise<SupportTicketDto[]> {
    return this.ticketService.findTicketsByUserId(userId);
  }

  /**
   * Get a specific ticket
   */
  @Get(':ticketId')
  @RequirePermissions(PERMISSIONS.TICKETS_VIEW)
  async findOne(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
  ): Promise<SupportTicketDetailDto> {
    return this.ticketService.findOne(ticketId, req.user.userId, req.user.role);
  }

  /**
   * Update ticket (status, priority, escalation, resolution)
   */
  @Patch(':ticketId')
  @RequirePermissions(PERMISSIONS.TICKETS_RESOLVE)
  @HttpCode(HttpStatus.OK)
  async update(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
    @Body() updateTicketDto: UpdateSupportTicketDto,
  ): Promise<SupportTicketDetailDto> {
    return this.ticketService.update(
      ticketId,
      req.user.userId,
      updateTicketDto,
    );
  }

  /**
   * Assign ticket to support agent
   */
  @Patch(':ticketId/assign')
  @RequirePermissions(PERMISSIONS.TICKETS_ASSIGN)
  @HttpCode(HttpStatus.OK)
  async assign(
    @Param('ticketId') ticketId: string,
    @Body() assignTicketDto: AssignTicketDto,
  ): Promise<SupportTicketDetailDto> {
    return this.ticketService.assign(ticketId, assignTicketDto);
  }

  /**
   * Escalate ticket to higher level
   */
  @Patch(':ticketId/escalate')
  @RequirePermissions(PERMISSIONS.TICKETS_ESCALATE)
  @HttpCode(HttpStatus.OK)
  async escalate(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
  ): Promise<SupportTicketDetailDto> {
    // Get current ticket to determine new escalation level
    const ticket = await this.ticketService.findOne(
      ticketId,
      req.user.userId,
      req.user.role,
    );

    let newLevel;
    switch (ticket.escalationLevel) {
      case 'L1':
        newLevel = 'L2';
        break;
      case 'L2':
        newLevel = 'L3';
        break;
      case 'L3':
        // Already at highest level
        return ticket;
    }

    return this.ticketService.update(ticketId, req.user.userId, {
      escalationLevel: newLevel as any,
    });
  }

  /**
   * Add internal note to ticket (only visible to support staff)
   */
  @Post(':ticketId/internal-messages')
  @RequirePermissions(PERMISSIONS.TICKETS_VIEW)
  @HttpCode(HttpStatus.CREATED)
  async addInternalMessage(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<TicketMessageDto> {
    return this.messageService.addInternalMessage(
      ticketId,
      req.user.userId,
      createMessageDto,
    );
  }
}
