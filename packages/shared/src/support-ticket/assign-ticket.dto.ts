import { IsString, IsUUID } from 'class-validator';

/**
 * DTO for assigning a ticket to a support agent
 */
export class AssignTicketDto {
  @IsUUID()
  @IsString()
  assignedToId!: string; // User ID of support agent
}
