import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.curricula.findMany({
      where: { isActive: true },
      // Minimal fields for listing
      select: {
        id: true,
        code: true,
        nameAr: true,
        nameEn: true,
        systemType: true,
      },
    });
  }

  /**
   * Returns full hierarchy tree for a curricula in one go.
   * Optimized to avoid N+1 queries.
   */
  async getHierarchy(id: string) {
    const curricula = await this.prisma.curricula.findUnique({
      where: { id },
      include: {
        educational_stages: {
          where: { isActive: true },
          orderBy: { sequence: 'asc' },
          include: {
            grade_levels: {
              where: { isActive: true },
              orderBy: { sequence: 'asc' },
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!curricula) {
      throw new NotFoundException(`Curriculum with ID ${id} not found`);
    }

    // Transform to match frontend interface expectations
    return {
      id: curricula.id,
      code: curricula.code,
      nameAr: curricula.nameAr,
      nameEn: curricula.nameEn,
      stages: curricula.educational_stages.map(stage => ({
        id: stage.id,
        nameAr: stage.nameAr,
        nameEn: stage.nameEn,
        grades: stage.grade_levels,
      })),
    };
  }
}
