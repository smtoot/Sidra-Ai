/*
  Warnings:

  - You are about to drop the column `reminderIntervals` on the `system_settings` table. All the data in the column will be lost.
  - You are about to alter the column `defaultCommissionRate` on the `system_settings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - A unique constraint covering the columns `[readableId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `teacher_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[readableId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[readableId]` on the table `wallets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "IdType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'RESIDENT_PERMIT');

-- CreateEnum
CREATE TYPE "PackageSessionType" AS ENUM ('AUTO_SCHEDULED', 'FLOATING');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'DEPLETED', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('RESERVED', 'RELEASED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DemoOwnerType" AS ENUM ('PARENT', 'STUDENT');

-- CreateEnum
CREATE TYPE "DemoStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RescheduleRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PERMISSION_OVERRIDE_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_USER_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_USER_DEACTIVATED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DISPUTE_RAISED';
ALTER TYPE "NotificationType" ADD VALUE 'URGENT';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_ALERT';

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'PAID';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'PACKAGE_PURCHASE';
ALTER TYPE "TransactionType" ADD VALUE 'PACKAGE_RELEASE';
ALTER TYPE "TransactionType" ADD VALUE 'ESCROW_RELEASE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'MODERATOR';
ALTER TYPE "UserRole" ADD VALUE 'CONTENT_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'FINANCE';

-- AlterTable
ALTER TABLE "bank_info" ADD COLUMN     "bankBranch" TEXT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "bookingNotes" TEXT,
ADD COLUMN     "homeworkAssigned" BOOLEAN,
ADD COLUMN     "homeworkDescription" TEXT,
ADD COLUMN     "lastRescheduledAt" TIMESTAMP(3),
ADD COLUMN     "maxReschedules" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "nextSessionRecommendations" TEXT,
ADD COLUMN     "originalScheduledAt" TIMESTAMP(3),
ADD COLUMN     "packageSessionType" "PackageSessionType",
ADD COLUMN     "paymentDeadline" TIMESTAMP(3),
ADD COLUMN     "paymentLockedAt" TIMESTAMP(3),
ADD COLUMN     "pendingTierId" TEXT,
ADD COLUMN     "readableId" TEXT,
ADD COLUMN     "rescheduleCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rescheduledByRole" TEXT,
ADD COLUMN     "sessionProofUrl" TEXT,
ADD COLUMN     "studentPerformanceNotes" TEXT,
ADD COLUMN     "studentPerformanceRating" INTEGER,
ADD COLUMN     "teacherPrepNotes" TEXT,
ADD COLUMN     "teacherSummary" TEXT,
ADD COLUMN     "topicsCovered" TEXT;

-- AlterTable
ALTER TABLE "parent_profiles" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- AlterTable
ALTER TABLE "system_settings" DROP COLUMN "reminderIntervals",
ADD COLUMN     "allowedFileTypes" TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'application/pdf']::TEXT[],
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'SDG',
ADD COLUMN     "demosEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxFileSizeMB" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "minHoursBeforeSession" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "minWithdrawalAmount" DECIMAL(10,2) NOT NULL DEFAULT 500,
ADD COLUMN     "packagesEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "paymentWindowHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "supportEmail" TEXT NOT NULL DEFAULT 'support@sidra.com',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Africa/Khartoum',
ALTER COLUMN "defaultCommissionRate" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "teacher_profiles" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "idImageUrl" TEXT,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "idType" "IdType",
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "slugLockedAt" TIMESTAMP(3),
ADD COLUMN     "teachingStyle" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "bankSnapshot" JSONB,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "proofDocumentId" TEXT,
ADD COLUMN     "readableId" TEXT,
ADD COLUMN     "referenceId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "createdByAdminId" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "permissionOverrides" JSONB;

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "readableId" TEXT;

-- CreateTable
CREATE TABLE "saved_teachers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_tiers" (
    "id" TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "recurringRatio" DECIMAL(3,2) NOT NULL DEFAULT 0.8,
    "floatingRatio" DECIMAL(3,2) NOT NULL DEFAULT 0.2,
    "rescheduleLimit" INTEGER NOT NULL DEFAULT 2,
    "durationWeeks" INTEGER NOT NULL,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 14,
    "nameAr" TEXT,
    "nameEn" TEXT,
    "descriptionAr" TEXT,
    "descriptionEn" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "badge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_demo_settings" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "demoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "packagesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_demo_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_package_tier_settings" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_package_tier_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_packages" (
    "id" TEXT NOT NULL,
    "readableId" TEXT,
    "payerId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "tierId" TEXT,
    "sessionCount" INTEGER NOT NULL,
    "sessionsUsed" INTEGER NOT NULL DEFAULT 0,
    "originalPricePerSession" DECIMAL(10,2) NOT NULL,
    "discountedPricePerSession" DECIMAL(10,2) NOT NULL,
    "perSessionReleaseAmount" DECIMAL(10,2) NOT NULL,
    "totalPaid" DECIMAL(10,2) NOT NULL,
    "escrowRemaining" DECIMAL(10,2) NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isSmartPack" BOOLEAN NOT NULL DEFAULT true,
    "recurringWeekday" TEXT,
    "recurringTime" TEXT,
    "recurringSessionCount" INTEGER,
    "floatingSessionCount" INTEGER,
    "floatingSessionsUsed" INTEGER NOT NULL DEFAULT 0,
    "rescheduleLimit" INTEGER NOT NULL DEFAULT 2,
    "firstScheduledSession" TIMESTAMP(3),
    "lastScheduledSession" TIMESTAMP(3),
    "gracePeriodEnds" TIMESTAMP(3),

    CONSTRAINT "student_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_redemptions" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'RESERVED',
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_sessions" (
    "id" TEXT NOT NULL,
    "demoOwnerId" TEXT NOT NULL,
    "demoOwnerType" "DemoOwnerType" NOT NULL,
    "beneficiaryId" TEXT,
    "teacherId" TEXT NOT NULL,
    "status" "DemoStatus" NOT NULL DEFAULT 'SCHEDULED',
    "usedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "rescheduleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_transactions" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reschedule_requests" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "proposedStartTime" TIMESTAMP(3),
    "proposedEndTime" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" "RescheduleRequestStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reschedule_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readable_id_counters" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "yearMonth" TEXT,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "readable_id_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_approach_tags" (
    "id" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teaching_approach_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_teaching_approach_tags" (
    "teacherId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_teaching_approach_tags_pkey" PRIMARY KEY ("teacherId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_teachers_userId_teacherId_key" ON "saved_teachers"("userId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_demo_settings_teacherId_key" ON "teacher_demo_settings"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_package_tier_settings_teacherId_idx" ON "teacher_package_tier_settings"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_package_tier_settings_teacherId_tierId_key" ON "teacher_package_tier_settings"("teacherId", "tierId");

-- CreateIndex
CREATE UNIQUE INDEX "student_packages_readableId_key" ON "student_packages"("readableId");

-- CreateIndex
CREATE INDEX "student_packages_payerId_idx" ON "student_packages"("payerId");

-- CreateIndex
CREATE INDEX "student_packages_studentId_idx" ON "student_packages"("studentId");

-- CreateIndex
CREATE INDEX "student_packages_teacherId_idx" ON "student_packages"("teacherId");

-- CreateIndex
CREATE INDEX "student_packages_status_idx" ON "student_packages"("status");

-- CreateIndex
CREATE INDEX "student_packages_tierId_idx" ON "student_packages"("tierId");

-- CreateIndex
CREATE UNIQUE INDEX "package_redemptions_bookingId_key" ON "package_redemptions"("bookingId");

-- CreateIndex
CREATE INDEX "package_redemptions_packageId_status_idx" ON "package_redemptions"("packageId", "status");

-- CreateIndex
CREATE INDEX "demo_sessions_demoOwnerId_status_idx" ON "demo_sessions"("demoOwnerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "demo_sessions_demoOwnerId_teacherId_key" ON "demo_sessions"("demoOwnerId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "package_transactions_idempotencyKey_key" ON "package_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "package_transactions_packageId_idx" ON "package_transactions"("packageId");

-- CreateIndex
CREATE INDEX "reschedule_requests_bookingId_idx" ON "reschedule_requests"("bookingId");

-- CreateIndex
CREATE INDEX "reschedule_requests_status_idx" ON "reschedule_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "readable_id_counters_type_yearMonth_key" ON "readable_id_counters"("type", "yearMonth");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_readableId_key" ON "bookings"("readableId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_slug_key" ON "teacher_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_readableId_key" ON "transactions"("readableId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_readableId_key" ON "wallets"("readableId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_teachers" ADD CONSTRAINT "saved_teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_teachers" ADD CONSTRAINT "saved_teachers_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_demo_settings" ADD CONSTRAINT "teacher_demo_settings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_package_tier_settings" ADD CONSTRAINT "teacher_package_tier_settings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_package_tier_settings" ADD CONSTRAINT "teacher_package_tier_settings_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "package_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_packages" ADD CONSTRAINT "student_packages_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_packages" ADD CONSTRAINT "student_packages_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_packages" ADD CONSTRAINT "student_packages_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_packages" ADD CONSTRAINT "student_packages_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_packages" ADD CONSTRAINT "student_packages_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "package_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_redemptions" ADD CONSTRAINT "package_redemptions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "student_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_redemptions" ADD CONSTRAINT "package_redemptions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_demoOwnerId_fkey" FOREIGN KEY ("demoOwnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_transactions" ADD CONSTRAINT "package_transactions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "student_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reschedule_requests" ADD CONSTRAINT "reschedule_requests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reschedule_requests" ADD CONSTRAINT "reschedule_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reschedule_requests" ADD CONSTRAINT "reschedule_requests_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_teaching_approach_tags" ADD CONSTRAINT "teacher_teaching_approach_tags_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_teaching_approach_tags" ADD CONSTRAINT "teacher_teaching_approach_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "teaching_approach_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
