-- AlterTable: Add jitsiEnabled flag to teacher_profiles for admin whitelist
ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "jitsiEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Comment: This field allows admins to enable Jitsi for specific teachers
-- When system_settings.jitsiConfig.enabled = true AND teacher_profiles.jitsiEnabled = true,
-- the teacher's bookings will use Jitsi video conferencing.
