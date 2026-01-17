# Booking State Machine

This document describes the Booking lifecycle and allowed status transitions enforced server-side.

## Statuses

- `PENDING_TEACHER_APPROVAL`: booking created, awaiting teacher action.
- `WAITING_FOR_PAYMENT`: teacher approved, awaiting payment/locking funds.
- `SCHEDULED`: paid and scheduled (or demo/package session reserved).
- `PENDING_CONFIRMATION`: teacher marked session complete; dispute window open.
- `DISPUTED`: student/parent raised a dispute.
- Terminal: `COMPLETED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `REJECTED_BY_TEACHER`, `CANCELLED_BY_PARENT`, `CANCELLED_BY_TEACHER`, `CANCELLED_BY_ADMIN`, `EXPIRED`.

## Allowed Transitions

Source of truth: `apps/api/src/booking/booking-policy.constants.ts` (`BOOKING_STATUS_TRANSITIONS`).

```mermaid
stateDiagram-v2
  [*] --> PENDING_TEACHER_APPROVAL

  PENDING_TEACHER_APPROVAL --> WAITING_FOR_PAYMENT
  PENDING_TEACHER_APPROVAL --> SCHEDULED
  PENDING_TEACHER_APPROVAL --> REJECTED_BY_TEACHER
  PENDING_TEACHER_APPROVAL --> CANCELLED_BY_PARENT
  PENDING_TEACHER_APPROVAL --> EXPIRED

  WAITING_FOR_PAYMENT --> SCHEDULED
  WAITING_FOR_PAYMENT --> CANCELLED_BY_PARENT
  WAITING_FOR_PAYMENT --> EXPIRED

  SCHEDULED --> PENDING_CONFIRMATION
  SCHEDULED --> COMPLETED
  SCHEDULED --> CANCELLED_BY_PARENT
  SCHEDULED --> CANCELLED_BY_TEACHER
  SCHEDULED --> CANCELLED_BY_ADMIN
  SCHEDULED --> DISPUTED

  PENDING_CONFIRMATION --> COMPLETED
  PENDING_CONFIRMATION --> DISPUTED
  PENDING_CONFIRMATION --> CANCELLED_BY_ADMIN

  DISPUTED --> COMPLETED
  DISPUTED --> REFUNDED
  DISPUTED --> PARTIALLY_REFUNDED

  COMPLETED --> [*]
  REFUNDED --> [*]
  PARTIALLY_REFUNDED --> [*]
  REJECTED_BY_TEACHER --> [*]
  CANCELLED_BY_PARENT --> [*]
  CANCELLED_BY_TEACHER --> [*]
  CANCELLED_BY_ADMIN --> [*]
  EXPIRED --> [*]
```

## How Transitions Are Enforced

- Validation is centralized in `apps/api/src/booking/booking-status-validator.service.ts`.
- Booking service methods call `bookingStatusValidator.validateTransition(current, next)` before state updates.
- Some transitions are performed with conditional updates (`update`/`updateMany` with `status` in the `where`) to protect against races.

