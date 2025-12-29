import { api } from '../api';

// Enums matching backend
export type TicketCategory = 'ACADEMIC' | 'SESSION' | 'FINANCIAL' | 'TECHNICAL' | 'BEHAVIORAL' | 'GENERAL';
export type TicketType = 'SUPPORT' | 'DISPUTE';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'WAITING_FOR_SUPPORT' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export type EscalationLevel = 'L1' | 'L2' | 'L3';

// Minimal user info
export interface TicketUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber?: string;
  role?: string;
}

// Create ticket request
export interface CreateSupportTicketRequest {
  category: TicketCategory;
  subject: string;
  description: string;
  evidence?: string[];
  linkedBookingId?: string;
  linkedTeacherId?: string;
  linkedStudentId?: string;
  priority?: TicketPriority;
}

// Ticket list item (minimal info)
export interface SupportTicket {
  id: string;
  readableId: string;
  category: TicketCategory;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  subject: string;
  escalationLevel: EscalationLevel;
  slaBreach: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  createdBy: TicketUser;
  assignedTo?: TicketUser | null;
}

// Ticket detail (full info)
export interface SupportTicketDetail extends SupportTicket {
  description: string;
  evidence: string[];
  slaDeadline: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  resolutionNote: string | null;
  linkedBookingId: string | null;
  linkedTeacherId: string | null;
  linkedStudentId: string | null;
  disputeId: string | null;
  resolvedBy?: TicketUser | null;
  messages: TicketMessage[];
  statusHistory: TicketStatusHistory[];
}

// Ticket message
export interface TicketMessage {
  id: string;
  content: string;
  attachments: string[];
  isInternal: boolean;
  isSystemGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  author: TicketUser;
}

// Status history entry
export interface TicketStatusHistory {
  id: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus;
  reason: string | null;
  createdAt: string;
  changedBy: TicketUser;
}

// Create message request
export interface CreateMessageRequest {
  content: string;
  attachments?: string[];
}

// Update ticket request (admin only)
export interface UpdateSupportTicketRequest {
  status?: TicketStatus;
  priority?: TicketPriority;
  escalationLevel?: EscalationLevel;
  resolutionNote?: string;
}

// Assign ticket request (admin only)
export interface AssignTicketRequest {
  assignedToId: string;
}

// ================ USER API FUNCTIONS ================

/**
 * Create a new support ticket
 */
export async function createSupportTicket(data: CreateSupportTicketRequest): Promise<SupportTicketDetail> {
  const response = await api.post('/support-tickets', data);
  return response.data;
}

/**
 * Get all tickets for current user
 * Regular users see only their tickets, admins see all
 */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  const response = await api.get('/support-tickets');
  return response.data;
}

/**
 * Get a specific ticket by ID
 */
export async function getSupportTicket(ticketId: string): Promise<SupportTicketDetail> {
  const response = await api.get(`/support-tickets/${ticketId}`);
  return response.data;
}

/**
 * Close a ticket
 */
export async function closeSupportTicket(ticketId: string): Promise<SupportTicketDetail> {
  const response = await api.patch(`/support-tickets/${ticketId}/close`);
  return response.data;
}

/**
 * Reopen a ticket (SUPPORT type only)
 */
export async function reopenSupportTicket(ticketId: string): Promise<SupportTicketDetail> {
  const response = await api.patch(`/support-tickets/${ticketId}/reopen`);
  return response.data;
}

/**
 * Add a message to a ticket
 */
export async function addTicketMessage(ticketId: string, data: CreateMessageRequest): Promise<TicketMessage> {
  const response = await api.post(`/support-tickets/${ticketId}/messages`, data);
  return response.data;
}

/**
 * Get all messages for a ticket
 */
export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const response = await api.get(`/support-tickets/${ticketId}/messages`);
  return response.data;
}

// ================ ADMIN API FUNCTIONS ================

/**
 * Get all tickets (admin view)
 */
export async function getAdminSupportTickets(): Promise<SupportTicket[]> {
  const response = await api.get('/admin/support-tickets');
  return response.data;
}

/**
 * Get a specific ticket (admin view)
 */
export async function getAdminSupportTicket(ticketId: string): Promise<SupportTicketDetail> {
  const response = await api.get(`/admin/support-tickets/${ticketId}`);
  return response.data;
}

/**
 * Update ticket (admin only)
 */
export async function updateSupportTicket(ticketId: string, data: UpdateSupportTicketRequest): Promise<SupportTicketDetail> {
  const response = await api.patch(`/admin/support-tickets/${ticketId}`, data);
  return response.data;
}

/**
 * Assign ticket to support agent (admin only)
 */
export async function assignSupportTicket(ticketId: string, data: AssignTicketRequest): Promise<SupportTicketDetail> {
  const response = await api.patch(`/admin/support-tickets/${ticketId}/assign`, data);
  return response.data;
}

/**
 * Escalate ticket to higher level (admin only)
 */
export async function escalateSupportTicket(ticketId: string): Promise<SupportTicketDetail> {
  const response = await api.patch(`/admin/support-tickets/${ticketId}/escalate`);
  return response.data;
}

/**
 * Add internal note to ticket (admin only)
 */
export async function addInternalNote(ticketId: string, data: CreateMessageRequest): Promise<TicketMessage> {
  const response = await api.post(`/admin/support-tickets/${ticketId}/internal-messages`, data);
  return response.data;
}
