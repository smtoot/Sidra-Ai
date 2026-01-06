import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketAccessGuard } from './guards/ticket-access.guard';
import { SupportTicketService } from './support-ticket.service';
import { TicketMessageService } from './ticket-message.service';
import {
  CreateSupportTicketDto,
  CreateMessageDto,
  SupportTicketDto,
  SupportTicketDetailDto,
  TicketMessageDto,
} from '@sidra/shared';

@Controller('support-tickets')
@UseGuards(JwtAuthGuard)
export class SupportTicketController {
  constructor(
    private readonly ticketService: SupportTicketService,
    private readonly messageService: TicketMessageService,
  ) {}

  /**
   * Create a new support ticket
   * Available to all authenticated users
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: any,
    @Body() createTicketDto: CreateSupportTicketDto,
  ): Promise<SupportTicketDetailDto> {
    return this.ticketService.create(req.user.userId, createTicketDto);
  }

  /**
   * Get all tickets for current user
   * - Regular users see only their tickets
   * - Admins see all tickets
   */
  @Get()
  async findAll(@Request() req: any): Promise<SupportTicketDto[]> {
    return this.ticketService.findAllForUser(req.user.userId, req.user.role);
  }

  /**
   * Get a specific ticket by ID
   */
  @Get(':ticketId')
  @UseGuards(TicketAccessGuard)
  async findOne(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
  ): Promise<SupportTicketDetailDto> {
    return this.ticketService.findOne(ticketId, req.user.userId, req.user.role);
  }

  /**
   * Close a ticket
   * Available to ticket creator and admins
   */
  @Patch(':ticketId/close')
  @UseGuards(TicketAccessGuard)
  @HttpCode(HttpStatus.OK)
  async close(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
  ): Promise<SupportTicketDetailDto> {
    return this.ticketService.close(ticketId, req.user.userId, req.user.role);
  }

  /**
   * Reopen a ticket
   * Available to ticket creator and admins
   * Only works for SUPPORT type tickets (not DISPUTE)
   */
  @Patch(':ticketId/reopen')
  @UseGuards(TicketAccessGuard)
  @HttpCode(HttpStatus.OK)
  async reopen(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
  ): Promise<SupportTicketDetailDto> {
    return this.ticketService.reopen(ticketId, req.user.userId, req.user.role);
  }

  /**
   * Add a message to a ticket
   */
  @Post(':ticketId/messages')
  @UseGuards(TicketAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  async addMessage(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<TicketMessageDto> {
    return this.messageService.addMessage(
      ticketId,
      req.user.userId,
      req.user.role,
      createMessageDto,
    );
  }

  /**
   * Get all messages for a ticket
   */
  @Get(':ticketId/messages')
  @UseGuards(TicketAccessGuard)
  async getMessages(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
  ): Promise<TicketMessageDto[]> {
    return this.messageService.findAllForTicket(
      ticketId,
      req.user.userId,
      req.user.role,
    );
  }
}
