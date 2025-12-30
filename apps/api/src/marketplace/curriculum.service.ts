import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.curriculum.findMany({
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
   * Returns full hierarchy tree for a curriculum in one go.
   * Optimized to avoid N+1 queries.
   */
  async getHierarchy(id: string) {
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id },
      include: {
        stages: {
          where: { isActive: true },
          orderBy: { sequence: 'asc' },
          include: {
            grades: {
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

    if (!curriculum) {
      throw new NotFoundException(`Curriculum with ID ${id} not found`);
    }

    return curriculum;
  }
}
