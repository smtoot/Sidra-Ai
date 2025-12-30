-- Add curriculumId and schoolName to student_profiles (if not exists)
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "schoolName" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "curriculumId" TEXT;

-- Add curriculumId and schoolName to children (if not exists)
ALTER TABLE "children" ADD COLUMN IF NOT EXISTS "schoolName" TEXT;
ALTER TABLE "children" ADD COLUMN IF NOT EXISTS "curriculumId" TEXT;

-- Add foreign key constraints (drop first if exists to avoid conflicts)
ALTER TABLE "student_profiles" DROP CONSTRAINT IF EXISTS "student_profiles_curriculumId_fkey";
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "children" DROP CONSTRAINT IF EXISTS "children_curriculumId_fkey";
ALTER TABLE "children" ADD CONSTRAINT "children_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
