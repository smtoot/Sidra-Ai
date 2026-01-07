/**
 * Mapper utility for transforming teacher profile data from database (snake_case)
 * to API response format (camelCase).
 *
 * This solves the naming mismatch between Prisma's snake_case and frontend's camelCase.
 */

export class TeacherProfileMapper {
  /**
   * Maps teacher_subjects to subjects with proper field naming
   */
  static mapSubjects(teacher_subjects: any[] | undefined): any[] {
    if (!teacher_subjects) return [];

    return teacher_subjects.map((ts) => ({
      id: ts.id,
      subjectId: ts.subjectId,
      curriculumId: ts.curriculumId,
      pricePerHour: ts.pricePerHour,
      subject: ts.subjects, // This contains { id, nameAr, nameEn, code }
      curriculum: ts.curricula, // This contains { id, nameAr, nameEn, code }
      grades:
        ts.teacher_subject_grades?.map((tsg: any) => ({
          // Flatten grade_levels to make it easier for frontend
          id: tsg.grade_levels?.id,
          nameAr: tsg.grade_levels?.nameAr,
          nameEn: tsg.grade_levels?.nameEn,
          code: tsg.grade_levels?.code,
          gradeLevel: tsg.grade_levels, // Keep full object for backwards compatibility
        })) || [],
      createdAt: ts.createdAt,
      updatedAt: ts.updatedAt,
    }));
  }

  /**
   * Maps teacher_qualifications to qualifications
   */
  static mapQualifications(teacher_qualifications: any[] | undefined): any[] {
    if (!teacher_qualifications) return [];

    return teacher_qualifications.map((q) => ({
      id: q.id,
      teacherId: q.teacherId,
      degreeName: q.degreeName,
      institution: q.institution,
      fieldOfStudy: q.fieldOfStudy,
      status: q.status,
      startDate: q.startDate,
      endDate: q.endDate,
      graduationYear: q.graduationYear,
      certificateUrl: q.certificateUrl,
      verified: q.verified,
      verifiedAt: q.verifiedAt,
      verifiedBy: q.verifiedBy,
      rejectionReason: q.rejectionReason,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    }));
  }

  /**
   * Maps teacher_skills to skills
   */
  static mapSkills(teacher_skills: any[] | undefined): any[] {
    if (!teacher_skills) return [];

    return teacher_skills.map((s) => ({
      id: s.id,
      teacherId: s.teacherId,
      name: s.name,
      category: s.category,
      proficiency: s.proficiency,
      createdAt: s.createdAt,
    }));
  }

  /**
   * Maps teacher_work_experiences to workExperiences
   */
  static mapWorkExperiences(
    teacher_work_experiences: any[] | undefined,
  ): any[] {
    if (!teacher_work_experiences) return [];

    return teacher_work_experiences.map((w) => ({
      id: w.id,
      teacherId: w.teacherId,
      title: w.title,
      organization: w.organization,
      experienceType: w.experienceType,
      startDate: w.startDate,
      endDate: w.endDate,
      isCurrent: w.isCurrent,
      description: w.description,
      subjects: w.subjects,
      createdAt: w.createdAt,
    }));
  }

  /**
   * Maps documents array
   */
  static mapDocuments(documents: any[] | undefined): any[] {
    if (!documents) return [];
    // Documents already use camelCase mostly, just ensure consistency
    return documents;
  }

  /**
   * Maps full teacher profile from database format to API format
   */
  static mapProfile(profile: any): any {
    return {
      ...profile,
      // Transform all snake_case arrays to camelCase
      subjects: this.mapSubjects(profile.teacher_subjects),
      qualifications: this.mapQualifications(profile.teacher_qualifications),
      skills: this.mapSkills(profile.teacher_skills),
      workExperiences: this.mapWorkExperiences(
        profile.teacher_work_experiences,
      ),
      documents: this.mapDocuments(profile.documents),

      // Remove the snake_case versions to avoid confusion
      teacher_subjects: undefined,
      teacher_qualifications: undefined,
      teacher_skills: undefined,
      teacher_work_experiences: undefined,
    };
  }
}
