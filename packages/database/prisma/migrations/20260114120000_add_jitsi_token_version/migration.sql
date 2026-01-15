-- P0-2 Security Fix: Add jitsiTokenVersion for token invalidation
-- When a booking is cancelled, this version is incremented, which changes
-- the Jitsi room name and invalidates all previously issued JWT tokens.

-- Add jitsiTokenVersion column with default value of 1
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "jitsiTokenVersion" INTEGER NOT NULL DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN "bookings"."jitsiTokenVersion" IS 'Incremented on booking cancellation to invalidate Jitsi JWT tokens';
