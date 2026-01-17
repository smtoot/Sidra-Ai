# Booking Service Refactor Plan (Issue #18)

## Goal

Split the oversized `apps/api/src/booking/booking.service.ts` into smaller, focused services while keeping API behavior stable and minimizing risk.

## Approach (Low-Risk Migration)

- Keep `BookingService` as a **facade** initially (controller stays unchanged).
- Extract one service at a time and delegate from the facade.
- Move **pure helpers** (constants, validators, mappers) to shared modules used by all booking services.
- Only after all delegates are in place: update controllers (optional) and remove the old facade (Issue #25).

## Target Services

- `BookingCreationService` (create/approve/reject/slot validation)
- `BookingPaymentService` (pay/lock/release/settlements)
- `BookingCancellationService` (cancel/estimate/refund rules)
- `BookingRescheduleService` (request/approve/decline/admin reschedule)
- `BookingCompletionService` (complete/confirm/rate/dispute/auto-complete)
- `BookingQueryService` (read/query endpoints)

## Method Mapping (Facade → Service)

### Creation

- `createRequest` → `BookingCreationService.createRequest`
- `approveRequest` → `BookingCreationService.approveRequest`
- `rejectRequest` → `BookingCreationService.rejectRequest`
- Slot validation helpers (e.g., availability checks) → `BookingCreationService`

### Payment

- `payForBooking` → `BookingPaymentService.payForBooking`
- Payment/escrow helpers (e.g., lock/release) → `BookingPaymentService`
- Meeting-link reminders that depend on payment status (if any) → keep in `BookingPaymentService` or a scheduler-specific service

### Completion / Dispute / Rating

- `completeSession` → `BookingCompletionService.completeSession`
- `confirmSessionEarly` → `BookingCompletionService.confirmSessionEarly`
- `markCompleted` → `BookingCompletionService.markCompleted`
- `rateBooking` → `BookingCompletionService.rateBooking`
- `raiseDispute` → `BookingCompletionService.raiseDispute`
- `autoCompleteScheduledSessions` → `BookingCompletionService.autoCompleteScheduledSessions`

### Cancellation

- `getCancellationEstimate` → `BookingCancellationService.getCancellationEstimate`
- `cancelBooking` → `BookingCancellationService.cancelBooking`
- Refund calculation helpers → `BookingCancellationService`

### Reschedule

- `reschedulePackageSession` → `BookingRescheduleService.reschedulePackageSession`
- `requestReschedule` → `BookingRescheduleService.requestReschedule`
- `approveRescheduleRequest` → `BookingRescheduleService.approveRescheduleRequest`
- `declineRescheduleRequest` → `BookingRescheduleService.declineRescheduleRequest`
- `adminReschedule` → `BookingRescheduleService.adminReschedule`

### Query / Read

- `getBookingById` → `BookingQueryService.getBookingById`
- `getTeacherRequests`/`getTeacherRequestsCount` → `BookingQueryService`
- `getTeacherSessions`/`getAllTeacherBookings` → `BookingQueryService`
- `getParentBookings`/`getStudentBookings` → `BookingQueryService`
- `getMeetingEvents` → `BookingQueryService.getMeetingEvents`

## Shared Dependencies & Utilities

Keep these as shared dependencies injected into the extracted services (avoid duplicated DB access logic):

- `PrismaService`
- `NotificationService`
- `WalletService`
- `PackageService` / `DemoService`
- `SystemSettingsService` (or keep a `getSystemSettings()` helper in a dedicated settings service)
- Shared helpers/constants:
  - `apps/api/src/booking/booking.constants.ts`
  - `apps/api/src/booking/booking-policy.constants.ts`
  - `apps/api/src/booking/booking-error-messages.ts`
  - `apps/api/src/booking/booking-status-validator.service.ts`
  - `transformBooking` + mapping helpers (consider a `BookingMapper`/`BookingTransformer`)

## Implementation Steps

1. Create new service classes (module-scoped providers) with the same method signatures as the facade.
2. Move logic + private helpers into the target service; keep the facade delegating.
3. Ensure transactions remain intact (do not split a single transaction across services).
4. Update imports/injection wiring in the booking module.
5. Run:
   - `npm --workspace apps/api test`
   - `npm --workspace apps/api run test:e2e` (mocked)
6. Repeat per extracted service until facade is thin.

## Validation Checklist

- No controller signature changes during extraction.
- No new DB queries per request (avoid accidental N+1).
- Notifications remain PII-safe (see `docs/flows/booking-business-rules.md`).
- All existing unit tests + mocked e2e tests pass.

