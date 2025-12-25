# Audit Closure Report: Single Session Booking Hardening

**Date:** 2025-12-24
**Scope:** Single Session Booking Lifecycle (P0 & P1 Fixes)
**Status:** COMPLETED

## Executive Summary
All identified P0 (Critical) and P1 (High) vulnerabilities in the booking lifecycle have been remediated. The system now enforces server-side pricing, atomic financial transactions, and concurrency safety.

## 1. Remediation Status

### P0-1: Price Authority & Manipulation
*   **Issue:** Client could send arbitrary `dto.price`.
*   **Fix:** `createRequest` now ignores `dto.price`. It fetches `TeacherSubject.pricePerHour` and calculates `price = rate * duration` server-side.
*   **Verification:** Integration Test `P0-1` confirms `cheatPrice` is ignored and system price is stored.
*   **Status:** ✅ FIXED

### P0-2: Payment Atomicity
*   **Issue:** Wallet lock and booking update were separate potentially causing data inconsistencies.
*   **Fix:** `payForBooking` and `approveRequest` now execute within a strict `prisma.$transaction`. Usage of `walletService.lockFundsForBooking` requires passing the transaction client.
*   **Verification:** Integration Test `P0-2` confirms transactional wrapping.
*   **Status:** ✅ FIXED

### P1-1: Race Condition (Double Confirm)
*   **Issue:** `confirmSessionEarly` and `autoRelease` could race, leading to double payouts.
*   **Fix:** Implemented Conditional Update pattern: `UPDATE booking SET ... WHERE id = ? AND status = 'PENDING_CONFIRMATION'`. Only proceeds to release funds if exactly 1 row is modified.
*   **Verification:** Integration Test `P1-1` confirms second attempt returns success without re-triggering payout (idempotency).
*   **Status:** ✅ FIXED

### P1-2: Auto-Complete Safety Net
*   **Issue:** Forgotten sessions remained SCHEDULED indefinitely, locking funds.
*   **Fix:** Added `@Cron` job `autoCompleteScheduledSessions`. Moves bookings to `PENDING_CONFIRMATION` if `endTime + 2h` has passed.
*   **Verification:** Integration Test `P1-2` verifies status transition for stale bookings.
*   **Status:** ✅ FIXED

### P1-3: Escrow Scheduler Hardening
*   **Issue:** Auto-release job was vulnerable to race conditions.
*   **Fix:** `processAutoReleases` now uses the same atomic transaction pattern as `confirmSessionEarly` (Conditional Update + Fund Release in one Tx).
*   **Status:** ✅ FIXED

## 2. Deliverables
*   **Code:** Modified `booking.service.ts`, `wallet.service.ts`, `escrow-scheduler.service.ts`.
*   **Tests:** Added `apps/api/test/booking.integration.spec.ts`.
*   **Documentation:** this report.

## 3. Operations
*   **Migration:** No DB migration required (logic fix only).
*   **Deployment:** Safe to deploy. Note: Clients sending `price` will see no error, but their price will be ignored (safe backward compatibility).

**Sign-off:** Senior Backend Architect
