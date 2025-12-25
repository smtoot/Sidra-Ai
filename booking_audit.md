# Audit: Single Session Booking Lifecycle

**Date:** 2025-12-24
**Scope:** Single Session (No packages, No demo)
**Auditor:** Senior Product/Backend Architect

## A) Booking State Machine

| State | Allowed Transitions | Triggered By | Preconditions | Postconditions |
| :--- | :--- | :--- | :--- | :--- |
| **CREATED** (Virtual) | `PENDING_TEACHER_APPROVAL` | Parent/Student | `createRequest` called. Valid teacher/subject. Slot available. | Booking created in DB. |
| **PENDING_TEACHER_APPROVAL** | `SCHEDULED` | Teacher | `approveRequest` called. Parent has sufficient balance. | Funds locked (Escrow). |
| | `WAITING_FOR_PAYMENT` | Teacher | `approveRequest` called. Parent has *insufficient* balance. | `paymentDeadline` set. |
| | `REJECTED_BY_TEACHER` | Teacher | `rejectRequest` called. | Notification sent. |
| | `CANCELLED_BY_PARENT` | Parent/Student | `cancelBooking` called. | 100% Refund (No funds locked yet). |
| | `EXPIRED` | System (Cron) | Created > 24h ago. | Notification sent. |
| **WAITING_FOR_PAYMENT** | `SCHEDULED` | Parent/Student | `payForBooking` called. Balance sufficient. | Funds locked (Escrow). `paymentDeadline` cleared. |
| | `CANCELLED_BY_PARENT` | Parent/Student | `cancelBooking` called. | 100% Refund (No funds locked yet). |
| | `EXPIRED` | System (Cron) | `paymentDeadline` passed. | Notification sent. |
| **SCHEDULED** | `PENDING_CONFIRMATION` | Teacher | `completeSession` called. | `disputeWindowOpensAt` set. |
| | `CANCELLED_BY_PARENT` | Parent/Student | `cancelBooking` called. | Refund `x%` based on policy. remaining `y%` to teacher. |
| | `CANCELLED_BY_ADMIN` | Teacher/Admin | `cancelBooking` called. (Teacher triggers "Admin" cancel). | 100% Refund. |
| | `DISPUTED` | Parent/Student | `raiseDispute` called. | Admin alerted. |
| **PENDING_CONFIRMATION** | `COMPLETED` | Student/Parent | `confirmSessionEarly` called. | Funds released to teacher. |
| | `COMPLETED` | System (Cron) | `disputeWindowClosesAt` passed AND no dispute. | Funds released to teacher. |
| | `DISPUTED` | Parent/Student | `raiseDispute` called. | Admin alerted. |
| **COMPLETED** | `DISPUTED` | Parent/Student | `raiseDispute` called (if allowed post-completion? Code implies only Pending/Scheduled). | *Verification needed if logic allows post-complete dispute.* |
| **DISPUTED** | `RESOLVED_...` | Admin | Admin resolves dispute. | Funds split/refunded/released. |
| **EXPIRED** | *Terminal* | - | - | - |
| **CANCELLED_...** | *Terminal* | - | - | - |

## B) Booking Flow Narrative

1.  **Request**: Parent (for Child) or Student selects a Teacher, Subject, and Time Slot. The system checks availability (Weekly + Exceptions + Existing Bookings).
    *   *Linking*: If Parent, `childId` is required. Booking is linked to Parent (System User) and Child (Profile).
2.  **Approval**: Teacher receives notification.
    *   *Scenario A (Rich)*: Parent has funds. Teacher approves. System locks funds immediately. Booking -> `SCHEDULED`.
    *   *Scenario B (Poor)*: Parent lacks funds. Teacher approves. Booking -> `WAITING_FOR_PAYMENT`. Parent notified to top-up and pay by deadline.
3.  **Scheduling**: Session occurs off-platform (Zoom/Meet).
4.  **Completion**:
    *   Teacher marks session as "Finished" in dashboard (`completeSession`).
    *   Booking -> `PENDING_CONFIRMATION`.
    *   Dispute window (48h) starts.
5.  **Release**:
    *   *Fast Track*: Student clicks "Confirm Session". Funds released immediately. Booking -> `COMPLETED`.
    *   *Slow Track*: 48h passes without dispute. System auto-releases. Booking -> `COMPLETED`.
6.  **Dispute (Sad Path)**: Student raises issue during `PENDING_CONFIRMATION`. Booking -> `DISPUTED`. Admin intervenes.

## C) Critical Invariants

1.  **Price Integrity**: `booking.price` MUST ALWAYS match `TeacherSubject.pricePerHour` at the time of creation. (Currently VIOLATED - see P0).
2.  **Fund Locking**: If status is `SCHEDULED` or `PENDING_CONFIRMATION`, `PendingBalance` MUST be >= `booking.price`.
3.  **One Active Session**: A Teacher cannot be in two `SCHEDULED` bookings overlapping in time. (Enforced by `validateSlotAvailability`).
4.  **Immutability**:
    *   `price`, `commissionRate` cannot change after Creation.
    *   `teacherId`, `studentId`, `subjectId` cannot change after Creation.
5.  **State Progression**: A booking cannot go back from `COMPLETED` to `SCHEDULED`.

## D) Attack & Evil Scenarios

1.  **The "One Cent" Attack**:
    *   Attacker calls `createRequest` API directly with `price: 0.01`.
    *   System creates booking. Teacher sees request (price might be hidden or overlooked).
    *   Teacher approves. Attacker gets premium session for free.
    *   *Fix*: Validate price on backend.

2.  **The "Ghost" Teacher**:
    *   Teacher conducts session but forgets to click "Complete".
    *   Booking stays `SCHEDULED` forever.
    *   Funds remain locked in Parent's `PendingBalance` indefinitely.
    *   Parent cannot re-book that slot or use funds.

3.  **The "Flash" Cancel**:
    *   Teacher has `FLEXIBLE` policy.
    *   Parent waits until 1 minute before session starts.
    *   Parent cancels.
    *   System refunds 50%.
    *   Teacher prepared for class but gets half pay and empty slot.
    *   *Recommendation*: Enforce "No refund" window (e.g., 2h before).

4.  **The "Race" to Pay**:
    *   Parent has funds for 1 booking. Makes 2 requests.
    *   Both Teachers approve at exact same millisecond.
    *   Transactions might race?
    *   *Mitigation*: `lockFundsForBooking` uses `wallet.update` atomic decrement. One will fail with "Insufficient balance". (Safe).

5.  **The "Double" Confirmation**:
    *   Student clicks "Confirm" and Auto-Release job runs at same time.
    *   `confirmSessionEarly` checks `if (status !== 'PENDING_CONFIRMATION')`.
    *   `processAutoReleases` checks `where: { status: 'PENDING_CONFIRMATION' }`.
    *   DB Transaction isolation needed. If both read PENDING simultaneous, both might pay?
    *   `escrow-scheduler` does `update status -> COMPLETED` then pays.
    *   If `confirmSessionEarly` also updates status, the second one to write will fail or see COMPLETED?
    *   Prisma `update` throws if record not found/condition fail? No, standard update.
    *   *Fix*: Use optimistic locking or checks inside transaction update `where: { status: 'PENDING_CONFIRMATION' }`.

## E) Audit Findings & Recommendations

### P0: Critical Vulnerabilities

1.  **Price Manipulation in `createRequest`**
    *   **File**: `apps/api/src/booking/booking.service.ts`
    *   **Issue**: `createRequest` uses `dto.price` blindly.
    *   **Fix**: Fetch `TeacherSubject` price and force override `dto.price`, or validate equality.

### P1: High Risks

2.  **Transaction Atomicity in `payForBooking`**
    *   **File**: `apps/api/src/booking/booking.service.ts`
    *   **Issue**: Calls `walletService.lockFundsForBooking` (Tx1) then `booking.update` (Tx2). If Tx2 fails, funds are locked but booking isn't SCHEDULED.
    *   **Fix**: Wrap both in a single `prisma.$transaction`.

3.  **Missing "Auto-Complete" for Scheduled Sessions**
    *   **Issue**: No mechanism to transition `SCHEDULED` -> `PENDING_CONFIRMATION` if teacher forgets.
    *   **Fix**: Cron job to auto-complete session `endTime + X hours` (e.g., 2h) if not marked. Or notify teacher.

### P2: Medium Risks / Logic Issues

4.  **Teacher Cancellation Status**
    *   **Issue**: Teacher cancellation maps to `CANCELLED_BY_ADMIN`.
    *   **Fix**: Add `CANCELLED_BY_TEACHER` to `BookingStatus` enum and use it.

5.  **Cancellation Policy Abuse**
    *   **Issue**: `FLEXIBLE` allows 50% refund right up to start time.
    *   **Fix**: Modify `calculateRefund` to return 0% if `hoursUntilSession < 2` (or similar buffer).

6.  **Teacher Approval Expiry Check**
    *   **Issue**: `approveRequest` relies on Cron to expire bookings. Logic should also check `createdAt` explicitly to prevent race with cron delay.
    *   **Fix**: Add explicit check: `if (now - booking.createdAt > 24h) throw ...`

### P3: Cleanup

7.  **Dead Variable `teacherCompletedAt`**
    *   **Issue**: Code populates `teacherCompletedAt` and `autoReleaseAt` but comments say they are legacy.
    *   **Fix**: Remove if confirmed unused, or keep for analytics.
