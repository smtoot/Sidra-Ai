-- CreateTable: pending_registrations
CREATE TABLE "pending_registrations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOtpSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousOtpHash" TEXT,
    "previousOtpExpiresAt" TIMESTAMP(3),

    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: otp_rate_limits
CREATE TABLE "otp_rate_limits" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "windowStartsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_registrations_email_key" ON "pending_registrations"("email");

-- CreateIndex
CREATE INDEX "pending_registrations_email_idx" ON "pending_registrations"("email");

-- CreateIndex
CREATE INDEX "pending_registrations_otpExpiresAt_idx" ON "pending_registrations"("otpExpiresAt");

-- CreateIndex
CREATE INDEX "pending_registrations_createdAt_idx" ON "pending_registrations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "otp_rate_limits_email_ipAddress_key" ON "otp_rate_limits"("email", "ipAddress");

-- CreateIndex
CREATE INDEX "otp_rate_limits_email_windowStartsAt_idx" ON "otp_rate_limits"("email", "windowStartsAt");

-- CreateIndex
CREATE INDEX "otp_rate_limits_ipAddress_windowStartsAt_idx" ON "otp_rate_limits"("ipAddress", "windowStartsAt");

-- Data Migration: Mark existing users as email verified
UPDATE "users"
SET "emailVerified" = true,
    "emailVerifiedAt" = CURRENT_TIMESTAMP
WHERE "email" IS NOT NULL
  AND "emailVerified" = false;

-- Add comments for documentation
COMMENT ON TABLE "pending_registrations" IS 'Stores temporary registration data until email verification completes via OTP';
COMMENT ON TABLE "otp_rate_limits" IS 'Rate limiting for OTP requests (email and IP-based)';
