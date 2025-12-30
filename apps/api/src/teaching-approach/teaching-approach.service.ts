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
    return this.prisma.teachingApproachTag.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { labelAr: 'asc' }],
    });
  }

  async createTag(dto: CreateTagDto) {
    return this.prisma.teachingApproachTag.create({
      data: {
        labelAr: dto.labelAr,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      },
    });
  }

  async updateTag(id: string, dto: UpdateTagDto) {
    const tag = await this.prisma.teachingApproachTag.findUnique({
      where: { id },
    });
    if (!tag) throw new NotFoundException('Tag not found');

    return this.prisma.teachingApproachTag.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTag(id: string) {
    return this.prisma.teachingApproachTag.delete({
      where: { id },
    });
  }

  // --- Teacher Methods ---

  async getTeacherTags(teacherId: string) {
    return this.prisma.teacherTeachingApproachTag.findMany({
      where: { teacherId },
      include: {
        tag: true,
      },
    });
  }

  async updateTeacherProfile(userId: string, dto: UpdateTeachingApproachDto) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { userId },
    });

    if (!teacher) throw new NotFoundException('Teacher profile not found');

    // 1. Validate Tags
    if (dto.tagIds && dto.tagIds.length > 0) {
      if (dto.tagIds.length > 4) {
        throw new BadRequestException('Maximum 4 tags allowed');
      }

      const validTags = await this.prisma.teachingApproachTag.count({
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
        await tx.teacherProfile.update({
          where: { id: teacher.id },
          data: { teachingStyle: dto.teachingStyle },
        });
      }

      // Update tags if provided
      if (dto.tagIds !== undefined) {
        // Delete existing
        await tx.teacherTeachingApproachTag.deleteMany({
          where: { teacherId: teacher.id },
        });

        // Insert new
        if (dto.tagIds.length > 0) {
          await tx.teacherTeachingApproachTag.createMany({
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
    const profile = await prismaClient.teacherProfile.findUnique({
      where: { id: teacherId },
      select: {
        teachingStyle: true,
        teachingTags: {
          include: { tag: true },
          where: { tag: { isActive: true } }, // Only show active tags
        },
      },
    });

    return {
      teachingStyle: profile?.teachingStyle,
      tags: profile?.teachingTags.map((rel) => rel.tag) || [],
    };
  }
}
