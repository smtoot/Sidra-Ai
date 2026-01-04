/*
  Warnings:

  - A unique constraint covering the columns `[teacherId,startTime]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_RESCHEDULED';

-- CreateIndex
CREATE INDEX "availability_teacherId_idx" ON "availability"("teacherId");

-- CreateIndex
CREATE INDEX "bookings_paymentReleasedAt_idx" ON "bookings"("paymentReleasedAt");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_teacherId_startTime_key" ON "bookings"("teacherId", "startTime");

-- CreateIndex
CREATE INDEX "children_parentId_idx" ON "children"("parentId");

-- CreateIndex
CREATE INDEX "teacher_profiles_applicationStatus_idx" ON "teacher_profiles"("applicationStatus");

-- CreateIndex
CREATE INDEX "teacher_profiles_isOnVacation_idx" ON "teacher_profiles"("isOnVacation");

-- CreateIndex
CREATE INDEX "teacher_subjects_teacherId_idx" ON "teacher_subjects"("teacherId");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");
