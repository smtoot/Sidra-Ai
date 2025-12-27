-- AlterTable
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "meetingLinkReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "meetingLinkAccessMinutesBefore" INTEGER NOT NULL DEFAULT 15;
