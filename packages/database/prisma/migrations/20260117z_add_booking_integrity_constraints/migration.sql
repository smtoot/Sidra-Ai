-- Booking integrity constraints + supporting indexes
-- Notes:
-- - Constraints are added as NOT VALID to avoid failing on pre-existing bad data.
--   They still protect all NEW/UPDATED rows.
-- - Indexes are created with IF NOT EXISTS for safe re-runs.

-- =========================================
-- CHECK CONSTRAINTS
-- =========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_endtime_after_starttime'
  ) THEN
    ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_endtime_after_starttime"
    CHECK ("endTime" > "startTime")
    NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_price_non_negative'
  ) THEN
    ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_price_non_negative"
    CHECK ("price" >= 0)
    NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_refund_percent_valid'
  ) THEN
    ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_refund_percent_valid"
    CHECK ("refundPercent" IS NULL OR ("refundPercent" >= 0 AND "refundPercent" <= 100))
    NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_commission_rate_valid'
  ) THEN
    ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_commission_rate_valid"
    CHECK ("commissionRate" >= 0 AND "commissionRate" <= 1)
    NOT VALID;
  END IF;
END $$;

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS "bookings_bookedByUserId_status_createdAt_idx"
  ON "bookings" ("bookedByUserId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "bookings_teacherId_status_startTime_idx"
  ON "bookings" ("teacherId", "status", "startTime");

CREATE INDEX IF NOT EXISTS "bookings_disputeWindowClosesAt_pending_confirmation_idx"
  ON "bookings" ("disputeWindowClosesAt")
  WHERE "status" = 'PENDING_CONFIRMATION';

CREATE INDEX IF NOT EXISTS "bookings_paymentDeadline_waiting_payment_idx"
  ON "bookings" ("paymentDeadline")
  WHERE "status" = 'WAITING_FOR_PAYMENT';

