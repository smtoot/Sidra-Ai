import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) { }

  async getUserFavorites(userId: string) {
    return this.prisma.saved_teachers.findMany({
      where: { userId },
      include: {
        teacher_profiles: {
          select: {
            id: true,
            displayName: true,
            profilePhotoUrl: true,
            slug: true,
            teacher_subjects: {
              include: { subjects: { select: { nameAr: true, nameEn: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleFavorite(userId: string, teacherId: string) {
    const teacher = await this.prisma.teacher_profiles.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const existing = await this.prisma.saved_teachers.findUnique({
      where: {
        userId_teacherId: { userId, teacherId },
      },
    });

    if (existing) {
      await this.prisma.saved_teachers.delete({
        where: { id: existing.id },
      });
      return { favorited: false };
    } else {
      await this.prisma.saved_teachers.create({
        data: { userId, teacherId },
      });
      return { favorited: true };
    }
  }
}
