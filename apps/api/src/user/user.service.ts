import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@sidra/shared';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUsers(query?: string) {
    return this.prisma.users.findMany({
      where: {
        OR: query
          ? [
              { email: { contains: query, mode: 'insensitive' } },
              {
                teacher_profiles: {
                  displayName: { contains: query, mode: 'insensitive' },
                },
              },
            ]
          : undefined,
      },
      include: {
        teacher_profiles: true,
        parent_profiles: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async toggleBan(userId: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.users.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  async updateUser(
    userId: string,
    data: {
      email?: string;
      phoneNumber?: string;
      firstName?: string;
      lastName?: string;
    },
  ) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.users.update({
      where: { id: userId },
      data: {
        email: data.email,
        phoneNumber: data.phoneNumber,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
  }

  async markTourCompleted(userId: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.users.update({
      where: { id: userId },
      data: {
        hasCompletedTour: true,
        tourCompletedAt: new Date(),
      },
    });
  }
}
