
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@sidra/shared';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async getUsers(query?: string) {
        return this.prisma.user.findMany({
            where: {
                OR: query ? [
                    { email: { contains: query, mode: 'insensitive' } },
                    { teacherProfile: { displayName: { contains: query, mode: 'insensitive' } } }
                ] : undefined
            },
            include: {
                teacherProfile: true,
                parentProfile: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }

    async toggleBan(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        return this.prisma.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive }
        });
    }
}
