-- CreateTable
CREATE TABLE "interview_time_slots" (
    "id" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "proposedDateTime" TIMESTAMP(3) NOT NULL,
    "meetingLink" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_time_slots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "interview_time_slots" ADD CONSTRAINT "interview_time_slots_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
