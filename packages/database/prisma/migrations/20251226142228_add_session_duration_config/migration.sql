-- AlterTable: Add session duration configuration fields
ALTER TABLE "system_settings" ADD COLUMN "defaultSessionDurationMinutes" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "system_settings" ADD COLUMN "allowedSessionDurations" INTEGER[] NOT NULL DEFAULT ARRAY[60];
