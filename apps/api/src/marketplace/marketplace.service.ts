import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto, UpdateCurriculumDto, CreateSubjectDto, UpdateSubjectDto } from '@sidra/shared';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) { }

  // --- Curricula ---
  async createCurriculum(dto: CreateCurriculumDto) {
    return this.prisma.curriculum.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAllCurricula(includeInactive = false) {
    return this.prisma.curriculum.findMany({
      where: includeInactive ? {} : { isActive: true },
    });
  }

  async findOneCurriculum(id: string) {
    const curr = await this.prisma.curriculum.findUnique({ where: { id } });
    if (!curr) throw new NotFoundException(`Curriculum with ID ${id} not found`);
    return curr;
  }

  async updateCurriculum(id: string, dto: UpdateCurriculumDto) {
    await this.findOneCurriculum(id); // Ensure exists
    return this.prisma.curriculum.update({
      where: { id },
      data: dto,
    });
  }

  async softDeleteCurriculum(id: string) {
    await this.findOneCurriculum(id);
    return this.prisma.curriculum.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // --- Subjects ---
  async createSubject(dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAllSubjects(includeInactive = false) {
    return this.prisma.subject.findMany({
      where: includeInactive ? {} : { isActive: true },
    });
  }

  async findOneSubject(id: string) {
    const sub = await this.prisma.subject.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException(`Subject with ID ${id} not found`);
    return sub;
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    await this.findOneSubject(id);
    return this.prisma.subject.update({
      where: { id },
      data: dto,
    });
  }

  async softDeleteSubject(id: string) {
    await this.findOneSubject(id);
    return this.prisma.subject.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
