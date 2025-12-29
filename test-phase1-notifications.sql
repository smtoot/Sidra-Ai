-- Phase 1 Notification Testing - SQL Helper Queries
-- Run these queries to verify Phase 1 implementation

-- ============================================
-- 1. VERIFY DATABASE MIGRATION
-- ============================================

-- Check if sessionReminderSentAt column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name = 'sessionReminderSentAt';
-- Expected: 1 row with column_name = 'sessionReminderSentAt', data_type = 'timestamp without time zone'

-- ============================================
-- 2. SESSION REMINDER TEST DATA
-- ============================================

-- Create a test booking 55 minutes from now for session reminder testing
-- REPLACE THE IDs WITH ACTUAL IDs FROM YOUR DATABASE
/*
INSERT INTO bookings (
  id,
  "readableId",
  "bookedByUserId",
  "beneficiaryType",
  "teacherId",
  "subjectId",
  "startTime",
  "endTime",
  status,
  price,
  "commissionRate",
  "sessionReminderSentAt"
) VALUES (
  gen_random_uuid(),
  'TEST-SESSION-REMINDER',
  '[ YOUR_PARENT_USER_ID ]',
  'STUDENT',
  '[ YOUR_TEACHER_PROFILE_ID ]',
  '[ YOUR_SUBJECT_ID ]',
  NOW() + INTERVAL '55 minutes',
  NOW() + INTERVAL '115 minutes',
  'SCHEDULED',
  100,
  0.18,
  NULL
);
*/

-- Check upcoming sessions that should trigger reminders
SELECT
  id,
  "readableId",
  "startTime",
  "sessionReminderSentAt",
  status,
  EXTRACT(EPOCH FROM ("startTime" - NOW())) / 60 AS minutes_until_start
FROM bookings
WHERE status = 'SCHEDULED'
AND "startTime" BETWEEN NOW() + INTERVAL '50 minutes' AND NOW() + INTERVAL '60 minutes'
AND "sessionReminderSentAt" IS NULL;
-- Expected: Your test booking should appear here

-- ============================================
-- 3. CHECK SESSION REMINDER NOTIFICATIONS
-- ============================================

-- Check if session reminder notifications were created
SELECT
  n.id,
  n."userId",
  n.type,
  n.title,
  n.message,
  n."isRead",
  n."createdAt",
  n."dedupeKey"
FROM notifications n
WHERE n.type = 'SESSION_REMINDER'
ORDER BY n."createdAt" DESC
LIMIT 10;
-- Expected: 2 notifications per test booking (one for student, one for teacher)

-- Verify session reminder sent timestamp was updated
SELECT
  id,
  "readableId",
  "startTime",
  "sessionReminderSentAt"
FROM bookings
WHERE "sessionReminderSentAt" IS NOT NULL
ORDER BY "sessionReminderSentAt" DESC
LIMIT 10;

-- ============================================
-- 4. TEACHER APPLICATION NOTIFICATION TESTS
-- ============================================

-- Find pending teacher applications for testing
SELECT
  tp.id AS profile_id,
  u.id AS user_id,
  u.email,
  tp."applicationStatus",
  tp."submittedAt"
FROM teacher_profiles tp
JOIN users u ON tp."userId" = u.id
WHERE tp."applicationStatus" IN ('SUBMITTED', 'INTERVIEW_REQUIRED', 'CHANGES_REQUESTED')
ORDER BY tp."submittedAt" DESC
LIMIT 5;

-- Check teacher application notifications
SELECT
  n.id,
  n."userId",
  n.type,
  n.title,
  n.message,
  n."isRead",
  n."createdAt",
  n."dedupeKey",
  n.metadata
FROM notifications n
WHERE n.type = 'ACCOUNT_UPDATE'
AND (
  n."dedupeKey" LIKE 'APPLICATION_APPROVED:%' OR
  n."dedupeKey" LIKE 'APPLICATION_REJECTED:%' OR
  n."dedupeKey" LIKE 'APPLICATION_CHANGES_REQUESTED:%' OR
  n."dedupeKey" LIKE 'INTERVIEW_SLOTS_PROPOSED:%'
)
ORDER BY n."createdAt" DESC
LIMIT 10;

-- ============================================
-- 5. RESCHEDULE NOTIFICATION TESTS
-- ============================================

-- Check reschedule approval notifications
SELECT
  n.id,
  n."userId",
  n.type,
  n.title,
  n.message,
  n."createdAt",
  n."dedupeKey",
  n.metadata
FROM notifications n
WHERE n."dedupeKey" LIKE 'RESCHEDULE_APPROVED:%'
OR n."dedupeKey" LIKE 'STUDENT_RESCHEDULED:%'
ORDER BY n."createdAt" DESC
LIMIT 10;

-- Find bookings that were rescheduled
SELECT
  id,
  "readableId",
  "startTime",
  "rescheduleCount",
  "lastRescheduledAt",
  "rescheduledByRole"
FROM bookings
WHERE "rescheduleCount" > 0
ORDER BY "lastRescheduledAt" DESC
LIMIT 10;

-- ============================================
-- 6. WALLET REJECTION NOTIFICATION TESTS
-- ============================================

-- Check deposit rejection notifications
SELECT
  n.id,
  n."userId",
  n.type,
  n.title,
  n.message,
  n."createdAt",
  n."dedupeKey",
  n.metadata
FROM notifications n
WHERE n."dedupeKey" LIKE 'DEPOSIT_REJECTED:%'
ORDER BY n."createdAt" DESC
LIMIT 10;

-- Check withdrawal rejection notifications
SELECT
  n.id,
  n."userId",
  n.type,
  n.title,
  n.message,
  n."createdAt",
  n."dedupeKey",
  n.metadata
FROM notifications n
WHERE n."dedupeKey" LIKE 'WITHDRAWAL_REJECTED:%'
ORDER BY n."createdAt" DESC
LIMIT 10;

-- Check rejected transactions
SELECT
  t.id,
  t."readableId",
  t.type,
  t.status,
  t.amount,
  t."adminNote",
  t."createdAt",
  w."userId"
FROM transactions t
JOIN wallets w ON t."walletId" = w.id
WHERE t.status = 'REJECTED'
AND t.type IN ('DEPOSIT', 'WITHDRAWAL')
ORDER BY t."createdAt" DESC
LIMIT 10;

-- ============================================
-- 7. NOTIFICATION SUMMARY STATISTICS
-- ============================================

-- Count notifications by type (Phase 1 types)
SELECT
  type,
  COUNT(*) AS total,
  COUNT(CASE WHEN "isRead" = false THEN 1 END) AS unread,
  COUNT(CASE WHEN "isRead" = true THEN 1 END) AS read
FROM notifications
WHERE type IN (
  'SESSION_REMINDER',
  'ACCOUNT_UPDATE',
  'BOOKING_APPROVED',
  'PAYMENT_RELEASED'
)
GROUP BY type
ORDER BY total DESC;

-- Recent notifications across all Phase 1 types
SELECT
  n.id,
  n."userId",
  u.email AS user_email,
  n.type,
  n.title,
  LEFT(n.message, 50) AS message_preview,
  n."isRead",
  n."createdAt",
  n."dedupeKey"
FROM notifications n
JOIN users u ON n."userId" = u.id
WHERE n."createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY n."createdAt" DESC
LIMIT 20;

-- ============================================
-- 8. DEDUPLICATION CHECK
-- ============================================

-- Find any duplicate notifications (should be 0)
SELECT
  "dedupeKey",
  COUNT(*) AS duplicate_count
FROM notifications
WHERE "dedupeKey" IS NOT NULL
GROUP BY "dedupeKey"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
-- Expected: 0 rows (no duplicates)

-- ============================================
-- 9. CLEANUP TEST DATA (RUN AFTER TESTING)
-- ============================================

-- Delete test session reminder booking
/*
DELETE FROM bookings
WHERE "readableId" = 'TEST-SESSION-REMINDER';
*/

-- Delete test notifications
/*
DELETE FROM notifications
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
AND metadata::text LIKE '%TEST%';
*/

-- ============================================
-- 10. HEALTH CHECK
-- ============================================

-- Check if notification polling is working (should see recent activity)
SELECT
  COUNT(*) AS notifications_last_hour,
  COUNT(CASE WHEN "isRead" = false THEN 1 END) AS unread_last_hour
FROM notifications
WHERE "createdAt" > NOW() - INTERVAL '1 hour';

-- Check cron job performance (session reminders)
SELECT
  DATE_TRUNC('hour', "sessionReminderSentAt") AS hour,
  COUNT(*) AS reminders_sent
FROM bookings
WHERE "sessionReminderSentAt" IS NOT NULL
AND "sessionReminderSentAt" > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- ============================================
-- EXPECTED RESULTS SUMMARY
-- ============================================

/*
After running all tests, you should see:

1. ✅ sessionReminderSentAt column exists in bookings table
2. ✅ Session reminders sent ~55 minutes before scheduled sessions
3. ✅ 2 notifications per session (student + teacher)
4. ✅ Teacher application notifications for approved/rejected/changes/interview
5. ✅ Reschedule notifications sent to teachers
6. ✅ Wallet rejection notifications with clear reasons
7. ✅ All notifications have correct type, title, and message in Arabic
8. ✅ No duplicate notifications (deduplication working)
9. ✅ All links and metadata are correct
10. ✅ Notification count increases correctly

If any check fails, refer to the testing guide for troubleshooting steps.
*/
