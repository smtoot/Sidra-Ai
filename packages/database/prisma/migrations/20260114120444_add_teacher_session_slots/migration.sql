-- CreateTable
CREATE TABLE "teacher_session_slots" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "startTimeUtc" TIMESTAMP(3) NOT NULL,
    "endTimeUtc" TIMESTAMP(3) NOT NULL,
    "localDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_session_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_session_slots_teacherId_localDate_idx" ON "teacher_session_slots"("teacherId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_session_slots_teacherId_startTimeUtc_key" ON "teacher_session_slots"("teacherId", "startTimeUtc");

-- AddForeignKey
ALTER TABLE "teacher_session_slots" ADD CONSTRAINT "teacher_session_slots_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
