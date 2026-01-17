# Booking Business Rules

This document summarizes the business rules enforced by the API for booking creation, payment, completion, disputes, cancellations, and rescheduling.

## Roles

- `PARENT` / `STUDENT`: can create and manage their own bookings.
- `TEACHER`: can approve/reject, update meeting links, complete sessions, and request reschedules (package sessions).
- `ADMIN`: can view/manage bookings and may perform manual actions (e.g., legacy completion, cancellations).

## Booking Creation

- Only `PARENT` or `STUDENT` can create booking requests.
- Parents must provide `childId`; students cannot provide `childId`.
- Booking time must be in the future.
- Teacher cannot be on vacation (booking blocked while `teacher_profiles.isOnVacation` is true).
- Self-booking is forbidden.
- If `timezone` is provided, it must be a valid IANA timezone (server-validated).

## Meeting Links

- Session-specific meeting link updates require a valid `https://` URL and a reasonable maximum length.
- Teachers can set a per-session `meetingLink` via booking APIs; invalid URL formats are rejected.

## Payment

- Payment transition is `WAITING_FOR_PAYMENT → SCHEDULED`.
- For single sessions, wallet locking and status update are done atomically (transaction).
- For package purchases, the booking may carry a `pendingTierId` and payment triggers package purchase + redemption creation.

## Session Completion & Confirmation

- Teachers complete sessions: `SCHEDULED → PENDING_CONFIRMATION`.
- Completion cannot happen before the session starts.
- Completion is rejected if it happens more than `BookingConstants.MAX_COMPLETION_GRACE_HOURS` after session end.
- Confirmation can be performed by the booking owner (or admin override):
  - `PENDING_CONFIRMATION → COMPLETED`
  - Funds are released to the teacher (wallet for single sessions; package escrow release for package sessions).

## Disputes

- Only the booking owner can raise disputes.
- Disputes are allowed only for `SCHEDULED` or `PENDING_CONFIRMATION`.
- Raising a dispute transitions the booking to `DISPUTED` and records a `disputes` row.

## Cancellation

- Cancellable statuses: `PENDING_TEACHER_APPROVAL`, `WAITING_FOR_PAYMENT`, `SCHEDULED`.
- A `SCHEDULED` booking cannot be cancelled after its start time.
- For paid `SCHEDULED` bookings, refunds follow the teacher policy + system policy config; wallet settlement is performed in the same transaction as the status update.
- Cancellation uses conditional updates to prevent races; if status changed concurrently, the API returns a conflict.

## Package Rescheduling

- Package sessions can be rescheduled by the student/parent (`reschedulePackageSession`) within configured windows and maximum counts.
- Teachers can request a reschedule for package sessions (`requestReschedule`) within configured windows.
- Students/parents can approve or decline reschedule requests.

## Source of Truth

- Status transitions: `apps/api/src/booking/booking-policy.constants.ts`
- Constants: `apps/api/src/booking/booking.constants.ts`
- Core logic: `apps/api/src/booking/booking.service.ts`

