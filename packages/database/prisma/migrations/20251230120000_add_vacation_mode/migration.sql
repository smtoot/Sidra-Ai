-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "maxVacationDays" INTEGER NOT NULL DEFAULT 21;

-- AlterTable
ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "isOnVacation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "vacationEndDate" TIMESTAMP(3);
ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "vacationReason" TEXT;
ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "vacationStartDate" TIMESTAMP(3);
