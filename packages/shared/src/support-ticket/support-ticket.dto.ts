import { TicketCategory } from './ticket-category.enum';
import { TicketType } from './ticket-type.enum';
import { TicketStatus } from './ticket-status.enum';
import { TicketPriority } from './ticket-priority.enum';
import { EscalationLevel } from './escalation-level.enum';

/**
 * Minimal ticket information for list views
 */
export interface SupportTicketDto {
  id: string;
  readableId: string;
  category: TicketCategory;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  subject: string;
  escalationLevel: EscalationLevel;
  slaBreach: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;

  // Minimal user info
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string;
    role: string;
  };

  assignedTo?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

/**
 * Detailed ticket information with all related data
 */
export interface SupportTicketDetailDto extends SupportTicketDto {
  description: string;
  evidence: string[];
  slaDeadline: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  resolutionNote: string | null;

  // Linked context
  linkedBookingId: string | null;
  linkedTeacherId: string | null;
  linkedStudentId: string | null;
  disputeId: string | null;

  resolvedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;

  // Related data
  messages: TicketMessageDto[];
  statusHistory: TicketStatusHistoryDto[];
}

/**
 * Ticket message
 */
export interface TicketMessageDto {
  id: string;
  content: string;
  attachments: string[];
  isInternal: boolean;
  isSystemGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;

  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
}

/**
 * Ticket status history entry
 */
export interface TicketStatusHistoryDto {
  id: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus;
  reason: string | null;
  createdAt: Date;

  changedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}
