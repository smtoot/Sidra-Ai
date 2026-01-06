-- AlterTable
ALTER TABLE "users" ADD COLUMN "hasCompletedTour" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "tourCompletedAt" TIMESTAMP(3);
