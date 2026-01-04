import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto, UpdateSkillDto } from '@sidra/shared';

// Explicit limits as constants (Minor Improvement #3)
const MAX_SKILLS_PER_TEACHER = 15;

/**
 * Normalize skill name for comparison (Minor Improvement #2)
 * - Trims whitespace
 * - Converts to lowercase
 * - Collapses multiple spaces to single space
 */
export function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all skills for a teacher
   * Sorted by createdAt DESC (backend responsibility)
   */
  async getSkills(userId: string) {
    const profile = await this.getTeacherProfile(userId);

    return this.prisma.teacherSkill.findMany({
      where: { teacherId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Add a new skill
   * Validates:
   * - Skill name uniqueness (case-insensitive)
   * - Max skills per teacher limit
   */
  async addSkill(userId: string, dto: CreateSkillDto) {
    const profile = await this.getTeacherProfile(userId);

    // Check max limit
    const existingCount = await this.prisma.teacherSkill.count({
      where: { teacherId: profile.id },
    });

    if (existingCount >= MAX_SKILLS_PER_TEACHER) {
      throw new BadRequestException(
        `الحد الأقصى ${MAX_SKILLS_PER_TEACHER} مهارة`,
      );
    }

    // Check for duplicates (case-insensitive)
    await this.checkDuplicateSkill(profile.id, dto.name);

    // Create skill (store original name, use normalized for comparison)
    const skill = await this.prisma.teacherSkill.create({
      data: {
        teacherId: profile.id,
        name: dto.name.trim(), // Store trimmed but preserve case
        category: dto.category,
        proficiency: dto.proficiency || 'INTERMEDIATE',
      },
    });

    return skill;
  }

  /**
   * Update an existing skill
   * If name changed, re-check uniqueness
   */
  async updateSkill(userId: string, skillId: string, dto: UpdateSkillDto) {
    const profile = await this.getTeacherProfile(userId);

    // Verify ownership
    const skill = await this.prisma.teacherSkill.findFirst({
      where: { id: skillId, teacherId: profile.id },
    });

    if (!skill) {
      throw new NotFoundException('المهارة غير موجودة');
    }

    // If name is being changed, check for duplicates
    if (
      dto.name &&
      normalizeSkillName(dto.name) !== normalizeSkillName(skill.name)
    ) {
      await this.checkDuplicateSkill(profile.id, dto.name, skillId);
    }

    // Update skill
    return this.prisma.teacherSkill.update({
      where: { id: skillId },
      data: {
        name: dto.name?.trim(),
        category: dto.category,
        proficiency: dto.proficiency,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a skill
   */
  async deleteSkill(userId: string, skillId: string) {
    const profile = await this.getTeacherProfile(userId);

    // Verify ownership
    const skill = await this.prisma.teacherSkill.findFirst({
      where: { id: skillId, teacherId: profile.id },
    });

    if (!skill) {
      throw new NotFoundException('المهارة غير موجودة');
    }

    await this.prisma.teacherSkill.delete({
      where: { id: skillId },
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
   * Check for duplicate skill name (case-insensitive)
   * Uses normalized comparison for consistency
   */
  private async checkDuplicateSkill(
    teacherId: string,
    name: string,
    excludeId?: string,
  ) {
    const normalizedName = normalizeSkillName(name);

    const existingSkills = await this.prisma.teacherSkill.findMany({
      where: {
        teacherId,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { name: true },
    });

    const isDuplicate = existingSkills.some(
      (s) => normalizeSkillName(s.name) === normalizedName,
    );

    if (isDuplicate) {
      throw new BadRequestException('هذه المهارة مضافة بالفعل');
    }
  }
}
