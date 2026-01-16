-- CreateEnum
CREATE TYPE "MeetingEventType" AS ENUM ('PARTICIPANT_JOINED', 'PARTICIPANT_LEFT', 'MEETING_STARTED', 'MEETING_ENDED');

-- CreateTable
CREATE TABLE "meeting_events" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "MeetingEventType" NOT NULL,
    "userRole" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_events_bookingId_idx" ON "meeting_events"("bookingId");

-- CreateIndex
CREATE INDEX "meeting_events_bookingId_createdAt_idx" ON "meeting_events"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "meeting_events_userId_idx" ON "meeting_events"("userId");

-- AddForeignKey
ALTER TABLE "meeting_events" ADD CONSTRAINT "meeting_events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_events" ADD CONSTRAINT "meeting_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
