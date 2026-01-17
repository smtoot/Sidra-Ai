/**
 * Booking Policy Constants
 *
 * These constants control reschedule behavior for package sessions.
 * Architecture allows future migration to DB-based admin configuration.
 */

/**
 * P1 FIX: Booking Status State Machine
 * Defines valid status transitions to prevent invalid state changes.
 * Key: Current status, Value: Array of valid next statuses
 */
export const BOOKING_STATUS_TRANSITIONS: Record<string, string[]> = {
  // Initial state: Teacher needs to approve
  PENDING_TEACHER_APPROVAL: [
    'WAITING_FOR_PAYMENT', // Teacher approved but insufficient balance
    'SCHEDULED', // Teacher approved and payment locked
    'REJECTED_BY_TEACHER', // Teacher declined
    'CANCELLED_BY_PARENT', // Parent cancelled before approval
    'EXPIRED', // Request timed out (24h)
  ],

  // Awaiting payment after teacher approval
  WAITING_FOR_PAYMENT: [
    'SCHEDULED', // Payment successful
    'CANCELLED_BY_PARENT', // Parent cancelled
    'EXPIRED', // Payment deadline passed
  ],

  // Payment under review (optional state)
  PAYMENT_REVIEW: [
    'SCHEDULED', // Payment verified
    'WAITING_FOR_PAYMENT', // Payment rejected
    'CANCELLED_BY_ADMIN', // Admin cancelled
  ],

  // Session is scheduled and paid
  SCHEDULED: [
    'PENDING_CONFIRMATION', // Session completed, awaiting confirmation
    'COMPLETED', // Admin manual completion (legacy endpoint)
    'CANCELLED_BY_PARENT', // Parent cancelled (with refund policy)
    'CANCELLED_BY_TEACHER', // Teacher cancelled (full refund)
    'CANCELLED_BY_ADMIN', // Admin intervention
    'DISPUTED', // Issue raised before session
  ],

  // Session done, awaiting confirmation or auto-release
  PENDING_CONFIRMATION: [
    'COMPLETED', // Student confirmed or auto-release
    'DISPUTED', // Student raised dispute
    'CANCELLED_BY_ADMIN', // Admin intervention (rare)
  ],

  // Terminal states - no transitions allowed
  COMPLETED: [],
  DISPUTED: [
    'COMPLETED', // Dispute resolved in favor of teacher
    'REFUNDED', // Dispute resolved in favor of student
    'PARTIALLY_REFUNDED', // Split decision
  ],
  REFUNDED: [],
  PARTIALLY_REFUNDED: [],
  REJECTED_BY_TEACHER: [],
  CANCELLED_BY_PARENT: [],
  CANCELLED_BY_TEACHER: [],
  CANCELLED_BY_ADMIN: [],
  EXPIRED: [],
};

/**
 * Validate if a status transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string,
): boolean {
  const allowedTransitions = BOOKING_STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions) {
    // Unknown current status - reject
    return false;
  }
  return allowedTransitions.includes(newStatus);
}

/**
 * Get allowed next statuses for a given status
 */
export function getAllowedTransitions(currentStatus: string): string[] {
  return BOOKING_STATUS_TRANSITIONS[currentStatus] || [];
}

export const BOOKING_POLICY = {
  /**
   * Minimum hours before session start that a student/parent can reschedule
   */
  studentRescheduleWindowHours: 6,

  /**
   * Maximum number of times a student/parent can reschedule a package session
   */
  studentMaxReschedules: 2,

  /**
   * Minimum hours before session start that a teacher can submit a reschedule request
   */
  teacherRescheduleRequestWindowHours: 12,

  /**
   * Maximum reschedule requests a teacher can make PER BOOKING (not global)
   */
  teacherMaxRescheduleRequests: 1,

  /**
   * Hours before a pending reschedule request expires (treated as DECLINED)
   */
  studentResponseTimeoutHours: 24,

  /**
   * Allowed booking statuses for reschedule
   */
  rescheduleAllowedStatuses: ['SCHEDULED'] as const,

  /**
   * Forbidden booking statuses for reschedule
   */
  rescheduleForbiddenStatuses: [
    'PENDING_CONFIRMATION',
    'COMPLETED',
    'CANCELLED',
    'DISPUTED',
  ] as const,
} as const;

export type BookingPolicy = typeof BOOKING_POLICY;
