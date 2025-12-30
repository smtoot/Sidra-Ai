/**
 * Booking Policy Constants
 *
 * These constants control reschedule behavior for package sessions.
 * Architecture allows future migration to DB-based admin configuration.
 */

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
