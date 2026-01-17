import { Injectable } from '@nestjs/common';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  CreateRatingDto,
} from '@sidra/shared';
import { BookingCreationService } from './booking-creation.service';
import { BookingPaymentService } from './booking-payment.service';
import { BookingCancellationService } from './booking-cancellation.service';
import { BookingRescheduleService } from './booking-reschedule.service';
import { BookingCompletionService } from './booking-completion.service';
import { BookingSystemSettingsService } from './booking-system-settings.service';
import { BookingQueryService } from './booking-query.service';
import { BookingUpdateService } from './booking-update.service';
import { BookingRatingService } from './booking-rating.service';
import { BookingMeetingService } from './booking-meeting.service';

@Injectable()
export class BookingService {
  constructor(
    private bookingCreationService: BookingCreationService,
    private bookingPaymentService: BookingPaymentService,
    private bookingCancellationService: BookingCancellationService,
    private bookingRescheduleService: BookingRescheduleService,
    private bookingSystemSettingsService: BookingSystemSettingsService,
    private bookingCompletionService: BookingCompletionService,
    private bookingQueryService: BookingQueryService,
    private bookingUpdateService: BookingUpdateService,
    private bookingRatingService: BookingRatingService,
    private bookingMeetingService: BookingMeetingService,
  ) {}

  private redactUserPII(user: any) {
    if (!user) return user;
    const { email, phoneNumber, ...rest } = user;
    return rest;
  }

  /**
   * Create a booking request (Parent or Student).
   *
   * Validates role-specific fields (parent `childId` vs student), timezone, timing, and slot availability.
   */
  async createRequest(user: any, dto: CreateBookingDto) {
    const booking = await this.bookingCreationService.createRequest(user, dto);
    return this.transformBooking(booking);
  }

  /**
   * Teacher approves a booking
   * CRITICAL FIX: Now atomically locks funds in escrow (PAYMENT_LOCK)
   * Transitions: PENDING_TEACHER_APPROVAL → SCHEDULED (skipping WAITING_FOR_PAYMENT for MVP)
   */
  async approveRequest(teacherUserId: string, bookingId: string) {
    const settings = await this.getSystemSettings();
    const updatedBooking = await this.bookingCreationService.approveRequest(
      teacherUserId,
      bookingId,
      settings,
    );
    return this.transformBooking(updatedBooking);
  }

  /**
   * Teacher rejects a booking request.
   *
   * Expected transition: `PENDING_TEACHER_APPROVAL → REJECTED_BY_TEACHER`.
   */
  async rejectRequest(
    teacherUserId: string,
    bookingId: string,
    dto: UpdateBookingStatusDto,
  ) {
    const updatedBooking = await this.bookingCreationService.rejectRequest(
      teacherUserId,
      bookingId,
      dto,
    );
    return this.transformBooking(updatedBooking);
  }

  /**
   * Get teacher incoming booking requests (pending approval).
   */
  async getTeacherRequests(teacherUserId: string) {
    return this.bookingQueryService.getTeacherRequests(teacherUserId);
  }

  /**
   * Get count of teacher incoming booking requests (pending approval).
   */
  async getTeacherRequestsCount(teacherUserId: string): Promise<number> {
    return this.bookingQueryService.getTeacherRequestsCount(teacherUserId);
  }

  /**
   * Get teacher bookings (all statuses) for teacher sessions UI.
   */
  async getTeacherSessions(teacherUserId: string) {
    return this.bookingQueryService.getTeacherSessions(teacherUserId);
  }

  /**
   * Get all teacher bookings (paginated) for teacher requests/bookings UI.
   */
  async getAllTeacherBookings(
    teacherUserId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    return this.bookingQueryService.getAllTeacherBookings(
      teacherUserId,
      page,
      limit,
    );
  }
  /**
   * Get parent bookings (paginated) for parent bookings UI.
   */
  async getParentBookings(
    parentUserId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    return this.bookingQueryService.getParentBookings(
      parentUserId,
      page,
      limit,
    );
  }

  /**
   * Get student bookings for student bookings UI.
   */
  async getStudentBookings(studentUserId: string) {
    return this.bookingQueryService.getStudentBookings(studentUserId);
  }

  /**
   * Get a single booking by ID (session detail page).
   *
   * Enforces access based on role: teacher/owner/admin.
   */
  async getBookingById(userId: string, userRole: string, bookingId: string) {
    return this.bookingQueryService.getBookingById(userId, userRole, bookingId);
  }

  /**
   * Teacher updates private notes (prep notes and summary) for a booking.
   */
  async updateTeacherNotes(
    teacherUserId: string,
    bookingId: string,
    dto: { teacherPrepNotes?: string; teacherSummary?: string },
  ) {
    const updated = await this.bookingUpdateService.updateTeacherNotes(
      teacherUserId,
      bookingId,
      dto,
    );
    return this.transformBooking(updated);
  }

  /**
   * Teacher updates the per-session meeting link.
   *
   * Validates that the URL is `https://` and within a safe length bound.
   */
  async updateMeetingLink(
    teacherUserId: string,
    bookingId: string,
    dto: { meetingLink: string },
  ) {
    const updated = await this.bookingUpdateService.updateMeetingLink(
      teacherUserId,
      bookingId,
      dto,
    );
    return this.transformBooking(updated);
  }

  private transformBooking(booking: any) {
    if (!booking) return null;

    // Transform relations to match frontend expected structure (camelCase)
    const transformed = {
      ...booking,
      teacherProfile: booking.teacher_profiles
        ? {
            ...booking.teacher_profiles,
            user: this.redactUserPII(booking.teacher_profiles.users),
          }
        : undefined,
      bookedByUser: this.redactUserPII(
        booking.users_bookings_bookedByUserIdTousers,
      ),
      studentUser: booking.users_bookings_studentUserIdTousers
        ? {
            ...this.redactUserPII(booking.users_bookings_studentUserIdTousers),
            studentProfile: booking.users_bookings_studentUserIdTousers
              .student_profiles
              ? {
                  ...booking.users_bookings_studentUserIdTousers
                    .student_profiles,
                  curriculum:
                    booking.users_bookings_studentUserIdTousers.student_profiles
                      .curricula,
                }
              : undefined,
          }
        : undefined,
      child: booking.children
        ? {
            ...booking.children,
            curriculum: booking.children.curricula,
          }
        : undefined,
      subject: booking.subjects,
      jitsiEnabled: !!booking.jitsiEnabled, // Force boolean
    };
    return transformed;
  }

  // --- Phase 2C: Payment Integration ---

  /**
   * Parent pays for approved booking (WAITING_FOR_PAYMENT → SCHEDULED)
   * Handles both single sessions and package purchases
   */
  async payForBooking(parentUserId: string, bookingId: string) {
    const updatedBooking = await this.bookingPaymentService.payForBooking(
      parentUserId,
      bookingId,
    );
    return this.transformBooking(updatedBooking);
  }

  /**
   * Mark session as completed (SCHEDULED → COMPLETED)
   * Releases funds to teacher (minus commission)
   * NOTE: In MVP, this is called by Admin. In Phase 3, this would be automated.
   */
  async markCompleted(bookingId: string) {
    const updated =
      await this.bookingCompletionService.markCompleted(bookingId);
    return this.transformBooking(updated);
  }

  async completeSession(teacherUserId: string, bookingId: string, dto?: any) {
    const updatedBooking = await this.bookingCompletionService.completeSession(
      teacherUserId,
      bookingId,
      dto,
    );
    return this.transformBooking(updatedBooking);
  }

  /**
   * Parent/Student confirms session early (before auto-release)
   * P1-1 FIX: Atomic transaction with conditional update for race safety
   */
  async confirmSessionEarly(
    userId: string,
    bookingId: string,
    rating?: number,
    userRole: string = 'STUDENT',
  ) {
    const updatedBooking =
      await this.bookingCompletionService.confirmSessionEarly(
        userId,
        bookingId,
        rating,
        userRole,
      );
    return this.transformBooking(updatedBooking);
  }

  /**
   * Submit a rating for a completed booking
   * Uses transaction to atomically:
   * 1. Create the rating
   * 2. Update teacher's averageRating and totalReviews
   */
  async rateBooking(userId: string, bookingId: string, dto: CreateRatingDto) {
    return this.bookingRatingService.rateBooking(userId, bookingId, dto);
  }

  /**
   * Raise a dispute for a booking (student/parent)
   *
   * Validates input and eligibility, creates a dispute record, transitions the booking to `DISPUTED`,
   * and notifies admins about the new dispute.
   */
  async raiseDispute(
    userId: string,
    bookingId: string,
    dto: { type: string; description: string; evidence?: string[] },
  ) {
    return this.bookingCompletionService.raiseDispute(userId, bookingId, dto);
  }

  /**
   * Get system settings (with defaults)
   *
   * Reads the singleton `system_settings` row and creates it with defaults if it does not exist.
   */
  async getSystemSettings() {
    return this.bookingSystemSettingsService.getSystemSettings();
  }

  // =========================
  // CANCELLATION FLOW
  // =========================

  /**
   * Get cancellation estimate (read-only, for UI preview)
   */
  async getCancellationEstimate(
    userId: string,
    userRole: string,
    bookingId: string,
  ) {
    return this.bookingCancellationService.getCancellationEstimate(
      userId,
      userRole,
      bookingId,
    );
  }

  /**
   * Cancel booking (unified endpoint - role determines logic)
   */
  async cancelBooking(
    userId: string,
    userRole: string,
    bookingId: string,
    reason?: string,
  ) {
    return this.bookingCancellationService.cancelBooking(
      userId,
      userRole,
      bookingId,
      reason,
    );
  }

  // =====================================================
  // PACKAGE SESSION RESCHEDULE (Reschedule-Only Model)
  // =====================================================

  /**
   * Student/Parent directly reschedules a package session.
   * Enforces: status=SCHEDULED, time window, max reschedules, availability.
   */
  async reschedulePackageSession(
    userId: string,
    userRole: string,
    bookingId: string,
    newStartTime: Date,
    newEndTime: Date,
  ) {
    return this.bookingRescheduleService.reschedulePackageSession(
      userId,
      userRole,
      bookingId,
      newStartTime,
      newEndTime,
    );
  }

  /**
   * Teacher submits a reschedule request (requires student approval).
   */
  async requestReschedule(
    teacherUserId: string,
    bookingId: string,
    reason: string,
    proposedStartTime?: Date,
    proposedEndTime?: Date,
  ) {
    return this.bookingRescheduleService.requestReschedule(
      teacherUserId,
      bookingId,
      reason,
      proposedStartTime,
      proposedEndTime,
    );
  }

  /**
   * Student/Parent approves a reschedule request.
   * Lazy expiration: Check if expired before processing.
   */
  async approveRescheduleRequest(
    userId: string,
    userRole: string,
    requestId: string,
    newStartTime: Date,
    newEndTime: Date,
  ) {
    return this.bookingRescheduleService.approveRescheduleRequest(
      userId,
      userRole,
      requestId,
      newStartTime,
      newEndTime,
    );
  }

  /**
   * Student/Parent declines a reschedule request.
   * Booking remains unchanged. Teacher must attend original time.
   */
  async declineRescheduleRequest(
    userId: string,
    requestId: string,
    reason?: string,
  ) {
    return this.bookingRescheduleService.declineRescheduleRequest(
      userId,
      requestId,
      reason,
    );
  }
  /**
   * Admin-forced reschedule.
   * Checks availability but bypasses policy windows.
   */
  async adminReschedule(bookingId: string, newStartTime: Date) {
    return this.bookingRescheduleService.adminReschedule(
      bookingId,
      newStartTime,
    );
  }

  // =====================================================
  // MEETING EVENTS (P1-1)
  // =====================================================

  /**
   * Log a meeting event (join, leave, start, end)
   */
  async logMeetingEvent(
    userId: string,
    bookingId: string,
    eventType:
      | 'PARTICIPANT_JOINED'
      | 'PARTICIPANT_LEFT'
      | 'MEETING_STARTED'
      | 'MEETING_ENDED',
    metadata?: Record<string, any>,
  ) {
    return this.bookingMeetingService.logMeetingEvent(
      userId,
      bookingId,
      eventType,
      metadata,
    );
  }

  /**
   * Get meeting events for a booking (for admin viewing)
   */
  async getMeetingEvents(bookingId: string) {
    return this.bookingMeetingService.getMeetingEvents(bookingId);
  }
}
