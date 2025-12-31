import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { UpdateTeacherProfileDto } from '@sidra/shared'; // Using shared DTO or need new one?
// Actually we need a StudentProfileDto. For now, simplistic or reuse.
// The spec said "StudentProfile: 1:1 with User where role=STUDENT".

@Injectable()
export class StudentService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) { }

  private readonly logger = new Logger(StudentService.name);

  async getDashboardStats(userId: string) {
    this.logger.log(`Getting dashboard stats for user: ${userId}`);

    try {
      // 1. Check Wallet
      let wallet: any = { balance: 0 };
      try {
        this.logger.debug(`Fetching wallet for ${userId}...`);
        const fetchedWallet = await this.walletService.getBalance(userId);
        if (fetchedWallet) {
          wallet = fetchedWallet;
        }
        this.logger.debug(`Wallet fetched. Balance: ${wallet?.balance}`);
      } catch (e) {
        this.logger.error(`Failed to fetch wallet for ${userId}: ${e.message}`, e.stack);
        // Fallback to 0 balance, don't crash dashboard
      }

      // 2. Fetch Bookings
      let upcomingClasses: any[] = [];
      try {
        this.logger.debug(`Fetching upcoming classes...`);
        upcomingClasses = await this.prisma.booking.findMany({
          where: {
            bookedByUserId: userId,
            status: 'SCHEDULED',
          },
          orderBy: { startTime: 'asc' },
          take: 5, // Limit to next 5 upcoming classes
          include: { teacherProfile: { include: { user: true } }, subject: true },
        });
        this.logger.debug(`Upcoming classes fetched: ${upcomingClasses?.length}`);
      } catch (e) {
        this.logger.error(`Failed to fetch upcoming classes for ${userId}: ${e.message}`, e.stack);
      }

      // 3. Count Total
      let totalClasses = 0;
      try {
        this.logger.debug(`Counting total classes...`);
        totalClasses = await this.prisma.booking.count({
          where: { bookedByUserId: userId },
        });
      } catch (e) {
        this.logger.error(`Failed to count classes for ${userId}: ${e.message}`, e.stack);
      }

      return {
        balance: wallet.balance || 0,
        upcomingClasses,
        totalClasses,
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard stats for ${userId}`, error.stack);
      throw error;
    }
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { user: true, curriculum: true },
    });
    if (!profile) throw new NotFoundException('Student profile not found');
    return profile;
  }

  async updateProfile(
    userId: string,
    data: {
      gradeLevel?: string;
      bio?: string;
      whatsappNumber?: string;
      city?: string;
      country?: string;
      firstName?: string;
      lastName?: string;
      profilePhotoUrl?: string;
      schoolName?: string;
      curriculumId?: string;
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

    // Update student profile fields
    const profile = await this.prisma.studentProfile.update({
      where: { userId },
      data: {
        gradeLevel: data.gradeLevel,
        bio: data.bio,
        whatsappNumber: data.whatsappNumber,
        city: data.city,
        country: data.country,
        profilePhotoUrl: data.profilePhotoUrl,
        schoolName: data.schoolName,
        curriculumId: data.curriculumId || null,
      },
      include: { user: true, curriculum: true },
    });

    return profile;
  }

  async getCurricula() {
    return this.prisma.curriculum.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
    });
  }
}
