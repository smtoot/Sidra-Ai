
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
    constructor(private prisma: PrismaService) { }

    async getUserFavorites(userId: string) {
        return this.prisma.savedTeacher.findMany({
            where: { userId },
            include: {
                teacher: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePhotoUrl: true,
                        slug: true,
                        subjects: {
                            include: { subject: { select: { nameAr: true, nameEn: true } } }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async toggleFavorite(userId: string, teacherId: string) {
        const teacher = await this.prisma.teacherProfile.findUnique({ where: { id: teacherId } });
        if (!teacher) throw new NotFoundException('Teacher not found');

        const existing = await this.prisma.savedTeacher.findUnique({
            where: {
                userId_teacherId: { userId, teacherId }
            }
        });

        if (existing) {
            await this.prisma.savedTeacher.delete({
                where: { id: existing.id }
            });
            return { favorited: false };
        } else {
            await this.prisma.savedTeacher.create({
                data: { userId, teacherId }
            });
            return { favorited: true };
        }
    }
}
