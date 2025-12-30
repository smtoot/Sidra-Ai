-- Add curriculumId and schoolName to student_profiles
ALTER TABLE "student_profiles" ADD COLUMN "schoolName" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "curriculumId" TEXT;

-- Add curriculumId and schoolName to children
ALTER TABLE "children" ADD COLUMN "schoolName" TEXT;
ALTER TABLE "children" ADD COLUMN "curriculumId" TEXT;

-- Add foreign key constraints
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "children" ADD CONSTRAINT "children_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
