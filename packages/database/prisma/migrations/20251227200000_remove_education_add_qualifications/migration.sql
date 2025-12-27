-- CreateEnum
CREATE TYPE "QualificationStatus" AS ENUM ('GRADUATED', 'IN_PROGRESS', 'NOT_COMPLETED');

-- AlterTable
ALTER TABLE "teacher_profiles" DROP COLUMN "education";

-- CreateTable
CREATE TABLE "teacher_qualifications" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "degreeName" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "status" "QualificationStatus" NOT NULL DEFAULT 'GRADUATED',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "graduationYear" INTEGER,
    "certificateUrl" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_qualifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_qualifications_teacherId_idx" ON "teacher_qualifications"("teacherId");

-- AddForeignKey
ALTER TABLE "teacher_qualifications" ADD CONSTRAINT "teacher_qualifications_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
