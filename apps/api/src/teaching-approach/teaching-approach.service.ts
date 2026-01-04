import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTagDto,
  UpdateTagDto,
  UpdateTeachingApproachDto,
} from './teaching-approach.dto';

@Injectable()
export class TeachingApproachService {
  constructor(private prisma: PrismaService) {}

  // --- Admin Methods ---

  async findAllTags(includeInactive = true) {
    return this.prisma.teaching_approach_tags.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { labelAr: 'asc' }],
    });
  }

  async createTag(dto: CreateTagDto) {
    return this.prisma.teaching_approach_tags.create({
      data: {
        id: crypto.randomUUID(),
        labelAr: dto.labelAr,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  async updateTag(id: string, dto: UpdateTagDto) {
    const tag = await this.prisma.teaching_approach_tags.findUnique({
      where: { id },
    });
    if (!tag) throw new NotFoundException('Tag not found');

    return this.prisma.teaching_approach_tags.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTag(id: string) {
    return this.prisma.teaching_approach_tags.delete({
      where: { id },
    });
  }

  // --- Teacher Methods ---

  async getTeacherTags(teacherId: string) {
    return this.prisma.teacher_teaching_approach_tags.findMany({
      where: { teacherId },
      include: {
        teaching_approach_tags: true,
      },
    });
  }

  async updateTeacherProfile(userId: string, dto: UpdateTeachingApproachDto) {
    const teacher = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
    });

    if (!teacher) throw new NotFoundException('Teacher profile not found');

    // 1. Validate Tags
    if (dto.tagIds && dto.tagIds.length > 0) {
      if (dto.tagIds.length > 4) {
        throw new BadRequestException('Maximum 4 tags allowed');
      }

      const validTags = await this.prisma.teaching_approach_tags.count({
        where: {
          id: { in: dto.tagIds },
          isActive: true,
        },
      });

      if (validTags !== dto.tagIds.length) {
        throw new BadRequestException(
          'One or more tags are invalid or inactive',
        );
      }
    }

    // 2. Transaction update
    return this.prisma.$transaction(async (tx) => {
      // Update text if provided (allow null to clear)
      if (dto.teachingStyle !== undefined) {
        await tx.teacher_profiles.update({
          where: { id: teacher.id },
          data: { teachingStyle: dto.teachingStyle },
        });
      }

      // Update tags if provided
      if (dto.tagIds !== undefined) {
        // Delete existing
        await tx.teacher_teaching_approach_tags.deleteMany({
          where: { teacherId: teacher.id },
        });

        // Insert new
        if (dto.tagIds.length > 0) {
          await tx.teacher_teaching_approach_tags.createMany({
            data: dto.tagIds.map((tagId) => ({
              teacherId: teacher.id,
              tagId,
            })),
          });
        }
      }

      // @ts-ignore
      return this.getTeacherApproachState(teacher.id, tx);
    });
  }

  async getTeacherApproachState(teacherId: string, prismaClient = this.prisma) {
    const profile = await prismaClient.teacher_profiles.findUnique({
      where: { id: teacherId },
      select: {
        teachingStyle: true,
        teacher_teaching_approach_tags: {
          include: { teaching_approach_tags: true },
          where: { teaching_approach_tags: { isActive: true } }, // Only show active tags
        },
      },
    });

    return {
      teachingStyle: profile?.teachingStyle,
      tags: profile?.teacher_teaching_approach_tags.map((rel) => rel.teaching_approach_tags) || [],
    };
  }
}
