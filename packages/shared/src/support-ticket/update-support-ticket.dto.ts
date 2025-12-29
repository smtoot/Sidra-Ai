import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TicketStatus } from './ticket-status.enum';
import { TicketPriority } from './ticket-priority.enum';
import { EscalationLevel } from './escalation-level.enum';

/**
 * Admin-only update DTO
 * Regular users cannot update ticket fields directly
 */
export class UpdateSupportTicketDto {
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsEnum(EscalationLevel)
  @IsOptional()
  escalationLevel?: EscalationLevel;

  @IsString()
  @MaxLength(5000, { message: 'Resolution note must be at most 5000 characters' })
  @IsOptional()
  resolutionNote?: string;
}
