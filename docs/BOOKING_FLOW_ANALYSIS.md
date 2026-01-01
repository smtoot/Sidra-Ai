# Booking Flow & Status Analysis

**Date:** 2026-01-01
**Version:** 1.0 (Current System State)

## 1. Booking Statuses (Analysis)

The system currently uses the following `BookingStatus` enum values.

| Status | Meaning | Visible To | Allowed Actions |
| :--- | :--- | :--- | :--- |
| **PENDING_TEACHER_APPROVAL** | Initial state after request creation. Waiting for teacher to accept. | All | **Teacher:** Approve, Reject<br>**Parent/Student:** Cancel |
| **WAITING_FOR_PAYMENT** | Teacher approved, but parent has insufficient wallet balance. Funds not yet locked. | All | **Parent/Student:** Pay, Cancel<br>**Teacher:** Cancel (only if own booking)<br>**System:** Auto-expire (cron) |
| **SCHEDULED** | Booking confirmed, funds locked in escrow. Upcoming session. | All | **Teacher:** Complete Session, Cancel<br>**Parent/Student:** Cancel, Reschedule (Package only), Dispute<br>**Admin:** Cancel |
| **PENDING_CONFIRMATION** | Teacher marked session as complete. 48h dispute window open. Payment NOT yet released. | All | **Parent/Student:** Confirm Early, Dispute<br>**System:** Auto-release (cron after 48h) |
| **COMPLETED** | Session finished successfully. Payment released to teacher. | All | **Parent/Student:** Rate<br>**Admin:** View |
| **REJECTED_BY_TEACHER** | Teacher declined the request. | All | None (Terminal State) |
| **CANCELLED_BY_PARENT** | Parent cancelled the booking. | All | None (Terminal State) |
| **CANCELLED_BY_ADMIN** | Admin cancelled the booking (or Teacher cancelled and system mapped it here). | All | None (Terminal State) |
| **EXPIRED** | Request timed out (24h) or payment deadline missed. | All | None (Terminal State) |
| **DISPUTED** | Student/Parent raised a dispute during the confirmation window. | Admin, Affected Users | **Admin:** Resolve (Dismiss, Refund, Split) |
| **REFUNDED** | Admin resolved dispute in favor of student (Full Refund). | All | None (Terminal State) |
| **PARTIALLY_REFUNDED** | Admin resolved dispute with a split payment. | All | None (Terminal State) |
| **PAYMENT_REVIEW** | *Unused/Legacy*. Intended for manual payment verification? | N/A | *None observed* |

### Notes on Logic
- **Teacher Cancellation:** Currently maps to `CANCELLED_BY_ADMIN` status internally in some flows, or triggers a full refund.
- **Auto-Complete:** A "safety net" cron job moves stuck `SCHEDULED` sessions (2h past end time) to `PENDING_CONFIRMATION` automatically.

---

## 2. Full Booking Flow (Step-by-Step)

### A. Creation & Approval
1.  **Parent/Student** selects a slot and creates a request (`POST /bookings`).
    *   **Status:** `PENDING_TEACHER_APPROVAL`
    *   **Notification:** Teacher receives "New Booking Request".
2.  **Teacher** reviews the request.
    *   **Action:** `approveRequest` or `rejectRequest`.
    *   **Rejection:** Status becomes `REJECTED_BY_TEACHER`. Terminal.
    *   **Approval (Sufficient Funds):** Wallet balance checked. If sufficient, funds are locked (~18% commission reserved).
        *   **Status:** `SCHEDULED`.
    *   **Approval (Insufficient Funds):**
        *   **Status:** `WAITING_FOR_PAYMENT`.
        *   **Deadline:** Set to 24h or 2h before session (whichever is sooner).

### B. Payment (If Insufficient Funds)
1.  **Parent/Student** tops up wallet.
2.  **Parent/Student** triggers payment (`PATCH /bookings/:id/pay`).
3.  **System:** Locks funds.
    *   **Status:** `SCHEDULED`.

### C. The Session
1.  **Teacher** adds/updates meeting link (`PATCH /bookings/:id/meeting-link`).
2.  Session occurs at `startTime`.

### D. Completion & Disputes
1.  **Teacher** marks session complete (`PATCH /bookings/:id/complete-session`).
    *   **Status:** `PENDING_CONFIRMATION`.
    *   **Dispute Window:** Opens for 48 hours.
2.  **Scenario 1: Happy Path (Early Confirmation)**
    *   **Student** clicks "Confirm Session".
    *   **Status:** `COMPLETED`.
    *   **Action:** Funds released to teacher wallet.
3.  **Scenario 2: Happy Path (Auto-Release)**
    *   **System:** Cron job checks if `disputeWindowClosesAt` has passed.
    *   **Status:** `COMPLETED`.
    *   **Action:** Funds released to teacher wallet.
4.  **Scenario 3: Dispute**
    *   **Student** raises dispute (`POST /bookings/:id/dispute`).
    *   **Status:** `DISPUTED`.
    *   **Action:** Admin alerted. Funds remain locked.
    *   **Resolution:** Admin resolves (`Dismiss`, `Teacher Win`, `Student Win`, `Split`).
        *   **Outcomes:** `COMPLETED` (Teacher Paid), `REFUNDED` (Student Paid), or `PARTIALLY_REFUNDED`.

### E. Cancellation (Pre-Completion)
1.  **Parent/Student/Teacher** requests cancellation (`PATCH /bookings/:id/cancel`).
2.  **Logic:** Check policy (Flexible/Moderate/Strict) & Time remaining.
    *   **Cancellation (No Payment Made):** Status `CANCELLED_BY_X`, 100% refund (phantom).
    *   **Cancellation (Paid):** Refund calculated based on policy. Wallet settlement executed.
    *   **Status:** `CANCELLED_BY_PARENT` or `CANCELLED_BY_ADMIN`.

---

## 3. Ambiguities & Identified Issues

### 1. Ambiguous Statuses
*   **`PAYMENT_REVIEW`**: Exists in Enum but appears **completely unused** in the code. Should be deprecated or removed to avoid confusion.
*   **`CANCELLED_BY_TEACHER`**: Does **not exist** in Enum. Teacher cancellations currently map to `CANCELLED_BY_ADMIN` status in some logical paths (or just generic cancellation actions). This makes analytics difficult.

### 2. Missing States
*   **`TEACHER_NO_SHOW`**: There is no specific status for when a teacher misses a session. This is handled via the generic `DISPUTED` state.
*   **`AUTO_COMPLETED`**: Automated completion uses `PENDING_CONFIRMATION`, distinguishing it from manual teacher completion relies on audit logs.

### 3. UI/Logic Inconsistencies
*   **Reschedule Logic:** Only supports **Package Sessions**. Standard bookings cannot be rescheduled.
*   **"Pending Tier" Complexity:** The `pendingTierId` logic for deferred package purchases adds complexity to the state machine.

### 4. Admin Refunds
*   Admin "Complete" action (`markCompleted`) exists for emergency overrides but bypasses the dispute window (goes straight to `COMPLETED`).
