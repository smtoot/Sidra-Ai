-- AlterTable
ALTER TABLE "bookings" 
ADD COLUMN "disputeReminderSentAt" TIMESTAMP(3),
ADD COLUMN "disputeWindowClosesAt" TIMESTAMP(3),
ADD COLUMN "disputeWindowOpensAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "system_settings" 
ADD COLUMN "disputeWindowHours" INTEGER NOT NULL DEFAULT 48,
ADD COLUMN "reminderIntervals" JSONB DEFAULT '[6, 12, 24]';

-- ✅ PRODUCT OWNER DECISION: Force-release all existing PENDING_CONFIRMATION bookings
-- This ensures clean slate for new dispute window system
UPDATE "bookings"
SET 
  status = 'COMPLETED',
  "paymentReleasedAt" = NOW(),
  "disputeWindowOpensAt" = "teacherCompletedAt",
  "disputeWindowClosesAt" = NOW()
WHERE status = 'PENDING_CONFIRMATION' 
  AND "teacherCompletedAt" IS NOT NULL;

-- Note: Wallet fund releases must be handled by post-migration script
-- See: scripts/force-release-existing-bookings.ts
