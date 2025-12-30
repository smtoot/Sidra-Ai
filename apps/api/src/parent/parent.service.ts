import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class ParentService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async getDashboardStats(userId: string) {
    const [wallet, upcomingClasses, parentProfile] = await Promise.all([
      this.walletService.getBalance(userId),
      this.prisma.booking.findMany({
        where: {
          bookedByUserId: userId,
          status: 'SCHEDULED',
        },
        orderBy: { startTime: 'asc' },
        take: 5, // Limit to next 5 upcoming classes
        include: {
          teacherProfile: { include: { user: true } },
          subject: true,
          child: true, // Include child name
        },
      }),
      this.prisma.parentProfile.findUnique({
        where: { userId },
        include: { children: true },
      }),
    ]);

    return {
      balance: wallet.balance,
      upcomingClasses,
      children: parentProfile?.children || [],
    };
  }

  // --- Children Management ---

  async getChildren(userId: string) {
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        children: {
          include: { curriculum: true },
        },
      },
    });

    if (!parentProfile) throw new NotFoundException('Parent profile not found');
    return parentProfile.children;
  }

  async addChild(
    userId: string,
    data: {
      name: string;
      gradeLevel: string;
      schoolName?: string;
      curriculumId?: string;
    },
  ) {
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId },
    });

    if (!parentProfile) throw new NotFoundException('Parent profile not found');

    return this.prisma.child.create({
      data: {
        parentId: parentProfile.id,
        name: data.name,
        gradeLevel: data.gradeLevel,
        schoolName: data.schoolName,
        curriculumId: data.curriculumId || null,
      },
      include: { curriculum: true },
    });
  }

  async updateChild(
    userId: string,
    childId: string,
    data: {
      name?: string;
      gradeLevel?: string;
      schoolName?: string;
      curriculumId?: string;
    },
  ) {
    // Verify ownership
    const child = await this.prisma.child.findFirst({
      where: {
        id: childId,
        parent: { userId },
      },
    });

    if (!child) throw new NotFoundException('Child not found or unauthorized');

    return this.prisma.child.update({
      where: { id: childId },
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel,
        schoolName: data.schoolName,
        curriculumId: data.curriculumId || null,
      },
      include: { curriculum: true },
    });
  }

  async getCurricula() {
    return this.prisma.curriculum.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
    });
  }

  // --- Profile Management ---

  async getProfile(userId: string) {
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        children: true,
      },
    });

    if (!parentProfile) throw new NotFoundException('Parent profile not found');
    return parentProfile;
  }

  async updateProfile(
    userId: string,
    data: {
      whatsappNumber?: string;
      city?: string;
      country?: string;
      firstName?: string;
      lastName?: string;
    },
  ) {
    // Update user fields (firstName, lastName)
    if (data.firstName !== undefined || data.lastName !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });
    }

    // Update parent profile fields
    const profile = await this.prisma.parentProfile.update({
      where: { userId },
      data: {
        whatsappNumber: data.whatsappNumber,
        city: data.city,
        country: data.country,
      },
      include: {
        user: true,
        children: true,
      },
    });

    return profile;
  }
}
