-- Add payment proof tracking fields to Booking table
-- This allows manual payment verification without using PAYMENT_REVIEW status

ALTER TABLE "bookings" ADD COLUMN "paymentProofUrl" TEXT;
ALTER TABLE "bookings" ADD COLUMN "paymentProofUploadedAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN "paymentVerifiedBy" TEXT;
ALTER TABLE "bookings" ADD COLUMN "paymentVerifiedAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN "paymentRejectedBy" TEXT;
ALTER TABLE "bookings" ADD COLUMN "paymentRejectedAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN "paymentRejectionNote" TEXT;

-- Create index for admin payment review queries (bookings awaiting verification)
CREATE INDEX "idx_bookings_payment_proof_pending" ON "bookings"("paymentProofUploadedAt")
WHERE "status" = 'WAITING_FOR_PAYMENT' AND "paymentProofUrl" IS NOT NULL AND "paymentVerifiedAt" IS NULL AND "paymentRejectedAt" IS NULL;
