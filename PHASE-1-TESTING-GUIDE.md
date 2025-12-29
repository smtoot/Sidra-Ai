# Phase 1: Critical Notifications - Testing Guide

**Date**: December 28, 2025
**Status**: Ready for Testing

---

## Overview

This guide will help you systematically test all 6 critical notification gaps that were fixed in Phase 1. Follow each test case step-by-step to verify the notifications work correctly.

---

## Prerequisites

Before testing, ensure:
- ✅ Database migration applied (`20251228102640_add_session_reminder_tracking`)
- ✅ Backend server running
- ✅ Frontend server running
- ✅ You have access to:
  - Admin account
  - Teacher account
  - Parent/Student account
- ✅ Notification system is enabled (check NotificationBell component is visible)

---

## Test Case 1: Session Start Reminders (Gap #13)

### Setup
1. Create a booking with status `SCHEDULED`
2. Set `startTime` to be exactly **55 minutes from now** (within the 50-60 minute window)
3. Ensure `sessionReminderSentAt` is `NULL`

### Expected Behavior
Within 10 minutes (when cron job runs):

**Student/Parent Notification:**
```
Title: تذكير: حصتك تبدأ خلال ساعة
Message: حصتك مع [teacher name] في [subject] تبدأ بعد [X] دقيقة. سيتم إضافة رابط الاجتماع قبل بدء الحصة بدقائق.
Link: /parent/bookings/[bookingId]
Type: SESSION_REMINDER
```

**Teacher Notification:**
```
Title: تذكير: حصتك تبدأ خلال ساعة
Message: حصتك مع [student name] في [subject] تبدأ بعد [X] دقيقة.
Link: /teacher/sessions/[bookingId]
Type: SESSION_REMINDER
```

### Verification Steps
1. ✅ Both student and teacher receive notifications
2. ✅ Message does NOT include the meeting link
3. ✅ Message informs student link will be added later
4. ✅ `sessionReminderSentAt` field is now populated in database
5. ✅ No duplicate notifications sent (check deduplication)
6. ✅ Notification badge count increases by 1 for each user
7. ✅ Links work when clicked

### Manual Testing SQL
```sql
-- Create a test booking 55 minutes from now
INSERT INTO bookings (
  id,
  "bookedByUserId",
  "teacherId",
  "subjectId",
  "startTime",
  "endTime",
  status,
  price,
  "sessionReminderSentAt"
) VALUES (
  gen_random_uuid(),
  '[parent-user-id]',
  '[teacher-profile-id]',
  '[subject-id]',
  NOW() + INTERVAL '55 minutes',
  NOW() + INTERVAL '115 minutes',
  'SCHEDULED',
  100,
  NULL
);

-- Check if reminder was sent after cron runs
SELECT id, "startTime", "sessionReminderSentAt"
FROM bookings
WHERE "sessionReminderSentAt" IS NOT NULL;

-- Check notifications were created
SELECT * FROM notifications
WHERE type = 'SESSION_REMINDER'
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## Test Case 2: Teacher Application Approved (Gap #5a)

### Setup
1. Create a teacher application with status `SUBMITTED`
2. Log in as Admin
3. Navigate to teacher applications list
4. Approve the application

### Expected Behavior

**Teacher Notification:**
```
Title: مبروك! تم قبول طلبك
Message: تم قبول طلب الانضمام كمعلم في منصة سدرة. يمكنك الآن البدء في إضافة أوقات توفرك والمواد التي تدرسها.
Link: /teacher/availability
Type: ACCOUNT_UPDATE
```

### Verification Steps
1. ✅ Teacher receives notification immediately after approval
2. ✅ Application status changes to `APPROVED`
3. ✅ Teacher's `isVerified` flag set to `true`
4. ✅ Link redirects to availability setup page
5. ✅ Notification metadata includes `nextSteps` array
6. ✅ Deduplication key prevents duplicate notifications

### Manual Testing
```typescript
// Via Admin API endpoint
POST /api/admin/applications/:profileId/approve
Headers: { Authorization: Bearer [admin-token] }

// Check notification
SELECT * FROM notifications
WHERE type = 'ACCOUNT_UPDATE'
AND "userId" = '[teacher-user-id]'
ORDER BY "createdAt" DESC;
```

---

## Test Case 3: Teacher Application Rejected (Gap #5b)

### Setup
1. Create a teacher application with status `SUBMITTED`
2. Log in as Admin
3. Navigate to teacher applications list
4. Reject the application with a reason

### Expected Behavior

**Teacher Notification:**
```
Title: تحديث بخصوص طلبك
Message: نأسف، لم نتمكن من قبول طلب الانضمام كمعلم في الوقت الحالي. السبب: [admin's reason]
Link: /teacher/application
Type: ACCOUNT_UPDATE
```

### Verification Steps
1. ✅ Teacher receives notification with rejection reason
2. ✅ Application status changes to `REJECTED`
3. ✅ `rejectionReason` field populated in database
4. ✅ `rejectedAt` timestamp set
5. ✅ Metadata includes `canReapply: true`

### Manual Testing
```typescript
// Via Admin API endpoint
POST /api/admin/applications/:profileId/reject
Headers: { Authorization: Bearer [admin-token] }
Body: { reason: "المستندات غير واضحة" }
```

---

## Test Case 4: Teacher Application Changes Requested (Gap #5c)

### Setup
1. Create a teacher application with status `SUBMITTED`
2. Log in as Admin
3. Request changes with specific reasons

### Expected Behavior

**Teacher Notification:**
```
Title: يرجى تحديث طلبك
Message: يرجى إجراء التعديلات التالية على طلب الانضمام: [specific changes]
Link: /teacher/application
Type: ACCOUNT_UPDATE
```

### Verification Steps
1. ✅ Teacher receives notification with requested changes
2. ✅ Application status changes to `CHANGES_REQUESTED`
3. ✅ `changeRequestReason` field populated
4. ✅ Teacher can resubmit after making changes

---

## Test Case 5: Interview Slots Proposed (Gap #5d)

### Setup
1. Create a teacher application with status `SUBMITTED`
2. Log in as Admin
3. Propose interview time slots (minimum 2 slots)

### Expected Behavior

**Teacher Notification:**
```
Title: مقابلة مطلوبة - اختر موعداً
Message: يرجى اختيار أحد المواعيد التالية لإجراء المقابلة:
1. [formatted date/time]
2. [formatted date/time]
Link: /teacher/application
Type: ACCOUNT_UPDATE
```

### Verification Steps
1. ✅ Teacher receives notification with all proposed slots
2. ✅ Dates formatted in Arabic locale
3. ✅ Application status changes to `INTERVIEW_REQUIRED`
4. ✅ Interview slots stored in `interviewTimeSlot` table
5. ✅ Metadata includes array of proposed times

---

## Test Case 6: Reschedule Request Approved (Gap #1)

### Setup
1. Teacher creates a reschedule request for a scheduled booking
2. Student/Parent approves the reschedule request

### Expected Behavior

**Teacher Notification:**
```
Title: تم الموافقة على طلب تغيير الموعد
Message: وافق الطالب على طلب تغيير موعد الحصة إلى [formatted new time]
Link: /teacher/sessions
Type: BOOKING_APPROVED
```

### Verification Steps
1. ✅ Teacher receives notification immediately after approval
2. ✅ Booking time updated to new time
3. ✅ Time displayed in correct timezone format
4. ✅ Reschedule request status updated
5. ✅ Metadata includes new start/end times

### Manual Testing
```typescript
// Student approves reschedule request
POST /api/bookings/reschedule-requests/:requestId/approve
Headers: { Authorization: Bearer [student-token] }
Body: { newStartTime: "2025-12-29T10:00:00Z" }

// Check teacher received notification
SELECT * FROM notifications
WHERE type = 'BOOKING_APPROVED'
AND "dedupeKey" LIKE 'RESCHEDULE_APPROVED:%'
ORDER BY "createdAt" DESC;
```

---

## Test Case 7: Student Directly Reschedules (Gap #2)

### Setup
1. Create a package booking with status `SCHEDULED`
2. Student/Parent directly reschedules the session (not via teacher request)

### Expected Behavior

**Teacher Notification:**
```
Title: تم تغيير موعد حصة
Message: قام الطالب بتغيير موعد الحصة من [old time] إلى [new time]
Link: /teacher/sessions
Type: BOOKING_APPROVED
```

### Verification Steps
1. ✅ Teacher receives notification with old and new times
2. ✅ Both times formatted in correct timezone
3. ✅ Booking `rescheduleCount` incremented
4. ✅ `lastRescheduledAt` timestamp updated
5. ✅ `rescheduledByRole` set to 'STUDENT' or 'PARENT'
6. ✅ Audit log created with reschedule details

### Manual Testing
```typescript
// Student reschedules package session
POST /api/bookings/:bookingId/reschedule
Headers: { Authorization: Bearer [parent-token] }
Body: {
  newStartTime: "2025-12-30T14:00:00Z",
  newEndTime: "2025-12-30T15:00:00Z"
}
```

---

## Test Case 8: Deposit Rejected (Gap #8)

### Setup
1. Parent submits a deposit request
2. Admin reviews and rejects it with a reason

### Expected Behavior

**Parent Notification:**
```
Title: تم رفض طلب الإيداع
Message: تم رفض طلب إيداع مبلغ [amount] SDG. السبب: [admin's reason]
Link: /parent/wallet
Type: PAYMENT_RELEASED
```

### Verification Steps
1. ✅ Parent receives notification with rejection reason
2. ✅ Transaction status changes to `REJECTED`
3. ✅ No funds added to wallet
4. ✅ `adminNote` field contains rejection reason
5. ✅ Link redirects to wallet page
6. ✅ Metadata includes transaction details

### Manual Testing
```typescript
// Admin rejects deposit
POST /api/admin/transactions/:transactionId/process
Headers: { Authorization: Bearer [admin-token] }
Body: {
  status: "REJECTED",
  adminNote: "صورة الإيصال غير واضحة"
}

// Verify notification
SELECT * FROM notifications
WHERE "dedupeKey" LIKE 'DEPOSIT_REJECTED:%'
ORDER BY "createdAt" DESC;
```

---

## Test Case 9: Withdrawal Rejected (Gap #10)

### Setup
1. Teacher submits a withdrawal request
2. Admin reviews and rejects it with a reason

### Expected Behavior

**Teacher Notification:**
```
Title: تم رفض طلب السحب
Message: تم رفض طلب سحب مبلغ [amount] SDG وإرجاع المبلغ إلى رصيدك. السبب: [admin's reason]
Link: /teacher/wallet
Type: PAYMENT_RELEASED
```

### Verification Steps
1. ✅ Teacher receives notification with reason
2. ✅ Transaction status changes to `REJECTED`
3. ✅ Funds returned from `pendingBalance` to `balance`
4. ✅ Ledger transaction created (`WITHDRAWAL_REFUNDED`)
5. ✅ Teacher can see available balance increased
6. ✅ Metadata includes refund confirmation

### Manual Testing
```typescript
// Admin rejects withdrawal
POST /api/admin/withdrawals/:transactionId/process
Headers: { Authorization: Bearer [admin-token] }
Body: {
  status: "REJECTED",
  adminNote: "معلومات الحساب البنكي غير صحيحة"
}

// Check wallet balance restored
SELECT balance, "pendingBalance"
FROM wallets
WHERE "userId" = '[teacher-user-id]';

// Check refund transaction created
SELECT * FROM transactions
WHERE type = 'WITHDRAWAL_REFUNDED'
AND "walletId" = '[wallet-id]'
ORDER BY "createdAt" DESC;
```

---

## Automated Testing Checklist

For each notification type, verify:

### Database Level
- [ ] Notification record created in `notifications` table
- [ ] `userId` matches intended recipient
- [ ] `type` field is correct
- [ ] `isRead` is `false` initially
- [ ] `dedupeKey` prevents duplicates
- [ ] `metadata` JSON contains expected fields
- [ ] Timestamps (`createdAt`) are correct

### API Level
- [ ] `GET /api/notifications` returns the notification
- [ ] `GET /api/notifications/unread-count` increments
- [ ] `POST /api/notifications/:id/mark-read` works
- [ ] `POST /api/notifications/mark-all-read` works

### Frontend Level
- [ ] NotificationBell shows unread count badge
- [ ] Clicking bell opens dropdown with notification
- [ ] Notification title and message display correctly (Arabic RTL)
- [ ] Clicking notification link navigates to correct page
- [ ] Marking as read updates UI immediately
- [ ] Real-time updates work (60-second polling)

---

## Performance Testing

### Session Reminder Cron Job
```bash
# Check cron job runs every 10 minutes
# Monitor logs for:
tail -f logs/app.log | grep "Session start reminders"

# Expected output every 10 minutes:
# "🔔 Checking for upcoming sessions..."
# "Found X sessions needing start reminders"
# "✅ Session start reminders complete: X reminders sent"
```

### Load Testing
```bash
# Simulate 100 concurrent bookings 55 minutes from now
# Verify all receive reminders within 10 minutes
# Check database for performance bottlenecks
```

---

## Error Handling Testing

### Test Failure Scenarios

1. **Notification Service Down**
   - [ ] Main operation (e.g., approval) still completes
   - [ ] Error logged but doesn't throw exception
   - [ ] User sees success message for main action

2. **Invalid User ID**
   - [ ] Notification creation fails gracefully
   - [ ] Doesn't break the transaction

3. **Duplicate Notifications**
   - [ ] Deduplication key prevents duplicates
   - [ ] Same notification not sent twice

4. **Missing Metadata**
   - [ ] Notification still created with null metadata
   - [ ] Frontend handles missing metadata gracefully

---

## Rollback Plan

If any test fails critically:

1. **Revert Database Migration**
```bash
cd packages/database
npx prisma migrate reset --skip-seed
npx prisma migrate deploy
```

2. **Revert Code Changes**
```bash
git revert [commit-hash-of-phase1]
```

3. **Disable Cron Jobs** (if needed)
```typescript
// Comment out @Cron decorator in escrow-scheduler.service.ts
// @Cron('*/10 * * * *')
async sendSessionStartReminders() {
```

---

## Success Criteria

Phase 1 is considered **SUCCESSFUL** if:

✅ All 9 test cases pass
✅ No critical errors in production logs
✅ Notification delivery rate > 99%
✅ No performance degradation (cron job < 5 seconds)
✅ No duplicate notifications sent
✅ All notifications display correctly in Arabic
✅ Timezone formatting works correctly
✅ Links navigate to correct pages
✅ Deduplication prevents spam

---

## Next Steps After Testing

1. **If ALL tests pass**: Proceed to Phase 2 (Medium Priority gaps)
2. **If ANY test fails**: Document failures, fix issues, re-test
3. **After validation**: Deploy to production with monitoring

---

## Contact for Issues

If you encounter any issues during testing:
- Check backend logs: `tail -f logs/app.log`
- Check database: Query `notifications` table
- Check frontend console: Browser DevTools
- Review audit report: [NOTIFICATION-SYSTEM-AUDIT.md](NOTIFICATION-SYSTEM-AUDIT.md)
- Review implementation: [PHASE-1-CRITICAL-NOTIFICATIONS-COMPLETE.md](PHASE-1-CRITICAL-NOTIFICATIONS-COMPLETE.md)
