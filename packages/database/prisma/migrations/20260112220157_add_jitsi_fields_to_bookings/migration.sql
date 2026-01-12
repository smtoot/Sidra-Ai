-- Add Jitsi fields to bookings table
ALTER TABLE "bookings" ADD COLUMN "jitsiRoomId" TEXT;
ALTER TABLE "bookings" ADD COLUMN "jitsiEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN "useExternalMeetingLink" BOOLEAN NOT NULL DEFAULT false;
