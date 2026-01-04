import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkExperienceDto,
  UpdateWorkExperienceDto,
} from '@sidra/shared';

// Explicit limits as constants (Minor Improvement #3)
const MAX_EXPERIENCES_PER_TEACHER = 20;
const MAX_SUBJECT_LENGTH = 50;

@Injectable()
export class WorkExperienceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all work experiences for a teacher
   * Sorted by: isCurrent DESC, startDate DESC, createdAt DESC
   */
  async getWorkExperiences(userId: string) {
    const profile = await this.getTeacherProfile(userId);

    return this.prisma.teacherWorkExperience.findMany({
      where: { teacherId: profile.id },
      orderBy: [
        { isCurrent: 'desc' },
        { startDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Add a new work experience
   * Applies validation rules and auto-fix for isCurrent/endDate
   */
  async addWorkExperience(userId: string, dto: CreateWorkExperienceDto) {
    const profile = await this.getTeacherProfile(userId);

    // Check max limit
    const existingCount = await this.prisma.teacherWorkExperience.count({
      where: { teacherId: profile.id },
    });

    if (existingCount >= MAX_EXPERIENCES_PER_TEACHER) {
      throw new BadRequestException(
        `الحد الأقصى ${MAX_EXPERIENCES_PER_TEACHER} خبرة`,
      );
    }

    // Validate and normalize data
    const validatedData = this.validateAndNormalizeData(dto);

    // Create work experience
    const experience = await this.prisma.teacherWorkExperience.create({
      data: {
        teacherId: profile.id,
        title: dto.title.trim(),
        organization: dto.organization.trim(),
        experienceType: dto.experienceType,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        isCurrent: validatedData.isCurrent,
        description: dto.description?.trim(),
        subjects: validatedData.subjects,
      },
    });

    return experience;
  }

  /**
   * Update an existing work experience
   * Applies validation rules and auto-fix for isCurrent/endDate
   * Returns corrected values (Minor Improvement #1)
   */
  async updateWorkExperience(
    userId: string,
    experienceId: string,
    dto: UpdateWorkExperienceDto,
  ) {
    const profile = await this.getTeacherProfile(userId);

    // Verify ownership
    const experience = await this.prisma.teacherWorkExperience.findFirst({
      where: { id: experienceId, teacherId: profile.id },
    });

    if (!experience) {
      throw new NotFoundException('الخبرة غير موجودة');
    }

    // Merge existing data with update for validation
    const mergedData = {
      startDate:
        dto.startDate ?? (experience.startDate?.toISOString() || undefined),
      endDate: dto.endDate ?? (experience.endDate?.toISOString() || undefined),
      isCurrent: dto.isCurrent ?? experience.isCurrent,
      subjects: dto.subjects ?? experience.subjects,
    };

    // Validate and normalize
    const validatedData = this.validateAndNormalizeData(mergedData);

    // Update work experience
    return this.prisma.teacherWorkExperience.update({
      where: { id: experienceId },
      data: {
        title: dto.title?.trim(),
        organization: dto.organization?.trim(),
        experienceType: dto.experienceType,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        isCurrent: validatedData.isCurrent,
        description: dto.description?.trim(),
        subjects: validatedData.subjects,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a work experience
   */
  async deleteWorkExperience(userId: string, experienceId: string) {
    const profile = await this.getTeacherProfile(userId);

    // Verify ownership
    const experience = await this.prisma.teacherWorkExperience.findFirst({
      where: { id: experienceId, teacherId: profile.id },
    });

    if (!experience) {
      throw new NotFoundException('الخبرة غير موجودة');
    }

    await this.prisma.teacherWorkExperience.delete({
      where: { id: experienceId },
    });

    return { success: true };
  }

  // ============ Private Helpers ============

  /**
   * Get teacher profile or throw NotFoundException
   */
  private async getTeacherProfile(userId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    return profile;
  }

  /**
   * Validate and normalize work experience data
   * Implements the Date Validation Matrix from the plan
   * Auto-fixes isCurrent/endDate conflicts (Minor Improvement #1)
   */
  private validateAndNormalizeData(dto: {
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    subjects?: string[];
  }): {
    startDate: Date | null;
    endDate: Date | null;
    isCurrent: boolean;
    subjects: string[];
  } {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today for comparison

    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let isCurrent = dto.isCurrent ?? false;

    // Parse dates
    if (dto.startDate) {
      startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      endDate = new Date(dto.endDate);
    }

    // Validation 1: endDate without startDate
    if (endDate && !startDate) {
      throw new BadRequestException(
        'تاريخ البداية مطلوب عند تحديد تاريخ النهاية',
      );
    }

    // Validation 2: startDate in future
    if (startDate && startDate > today) {
      throw new BadRequestException(
        'تاريخ البداية لا يمكن أن يكون في المستقبل',
      );
    }

    // Validation 3: endDate in future when not current
    if (endDate && endDate > today && !isCurrent) {
      throw new BadRequestException(
        'تاريخ النهاية لا يمكن أن يكون في المستقبل',
      );
    }

    // Validation 4: startDate > endDate
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'تاريخ البداية يجب أن يكون قبل تاريخ النهاية',
      );
    }

    // Auto-fix 5: If isCurrent=true → clear endDate
    if (isCurrent) {
      endDate = null;
    }

    // Auto-fix 6: If endDate provided → set isCurrent=false
    if (endDate) {
      isCurrent = false;
    }

    // Validate and normalize subjects
    const subjects = this.normalizeSubjects(dto.subjects);

    return { startDate, endDate, isCurrent, subjects };
  }

  /**
   * Normalize subjects array
   * - Trim each subject
   * - Limit length to MAX_SUBJECT_LENGTH
   * - Remove empty strings
   */
  private normalizeSubjects(subjects?: string[]): string[] {
    if (!subjects || subjects.length === 0) {
      return [];
    }

    return subjects
      .map((s) => s.trim().substring(0, MAX_SUBJECT_LENGTH))
      .filter((s) => s.length > 0);
  }
}
