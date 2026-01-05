/*
  Warnings:

  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill missing emails to satisfy NOT NULL constraint
UPDATE "users"
SET "email" = 'legacy_no_email_' || "id" || '@sidra.platform'
WHERE "email" IS NULL;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "emailVerificationRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "primaryContactMethod" TEXT NOT NULL DEFAULT 'EMAIL';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ALTER COLUMN "email" SET NOT NULL;
