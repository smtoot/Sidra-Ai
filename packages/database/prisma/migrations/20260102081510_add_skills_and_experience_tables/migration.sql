-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('TEACHING_METHOD', 'TECHNOLOGY', 'SOFT_SKILL', 'SUBJECT_SPECIFIC');

-- CreateEnum
CREATE TYPE "SkillProficiency" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "ExperienceType" AS ENUM ('SCHOOL', 'TUTORING_CENTER', 'ONLINE_PLATFORM', 'PRIVATE', 'OTHER');

-- CreateTable
CREATE TABLE "teacher_skills" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SkillCategory",
    "proficiency" "SkillProficiency" NOT NULL DEFAULT 'INTERMEDIATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_work_experiences" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "experienceType" "ExperienceType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "subjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_work_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_skills_teacherId_idx" ON "teacher_skills"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_work_experiences_teacherId_idx" ON "teacher_work_experiences"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_work_experiences_teacherId_isCurrent_startDate_idx" ON "teacher_work_experiences"("teacherId", "isCurrent", "startDate");

-- AddForeignKey
ALTER TABLE "teacher_skills" ADD CONSTRAINT "teacher_skills_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_work_experiences" ADD CONSTRAINT "teacher_work_experiences_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
