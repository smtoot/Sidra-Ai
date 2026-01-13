import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { UpdateTeacherProfileDto } from '@sidra/shared';
import { SessionUtil } from '../common/utils/session.util';
// Actually we need a StudentProfileDto. For now, simplistic or reuse.
// The spec said "StudentProfile: 1:1 with User where role=STUDENT".

@Injectable()
export class StudentService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  private readonly logger = new Logger(StudentService.name);

  async getDashboardStats(userId: string) {
    this.logger.log(`Getting dashboard stats for user: ${userId}`);

    try {
      // 1. Fetch Student Profile (Needed for recommendations)
      const student_profiles = await this.prisma.student_profiles.findUnique({
        where: { userId },
      });

      // 2. Check Wallet
      let wallet: any = { balance: 0 };
      try {
        const fetchedWallet = await this.walletService.getBalance(userId);
        if (fetchedWallet) {
          wallet = fetchedWallet;
        }
      } catch (e) {
        this.logger.error(`Failed to fetch wallet for ${userId}: ${e.message}`);
      }

      // 3. Fetch Bookings (Active & Upcoming)
      let activeSession: any = null;
      let upcomingClasses: any[] = [];
      const now = new Date();

      try {
        // ACTIVE / JOINABLE SESSION
        // Starts within 10 mins (or started), and hasn't ended
        const joinBufferTime = new Date(now.getTime() + 10 * 60 * 1000); // Now + 10m

        activeSession = await this.prisma.bookings.findFirst({
          where: {
            bookedByUserId: userId,
            status: 'SCHEDULED',
            startTime: { lte: joinBufferTime },
            endTime: { gte: now },
          },
          include: {
            teacher_profiles: { include: { users: true } },
            subjects: true,
          },
        });

        // UPCOMING SESSIONS (Future)
        // Exclude the active one
        upcomingClasses = await this.prisma.bookings.findMany({
          where: {
            bookedByUserId: userId,
            status: 'SCHEDULED',
            id: activeSession ? { not: activeSession.id } : undefined, // Exclude active
            startTime: { gt: now }, // Strictly future
          },
          orderBy: { startTime: 'asc' },
          take: 5,
          include: {
            teacher_profiles: { include: { users: true } },
            subjects: true,
          },
        });
      } catch (e) {
        this.logger.error(`Failed to fetch classes: ${e.message}`);
      }

      // Enrich Active Session
      if (activeSession) {
        activeSession = {
          ...activeSession,
          isActive: SessionUtil.isSessionActive(
            activeSession.startTime,
            activeSession.endTime,
            now,
          ),
          isJoinable: SessionUtil.isSessionJoinable(
            activeSession.startTime,
            activeSession.endTime,
            now,
          ),
          isLate: SessionUtil.isSessionLate(activeSession.startTime, now),
          teacherName:
            activeSession.teacher_profiles?.users?.firstName || 'Teacher',
          subjectName: activeSession.subjects?.nameAr || 'General',
          hasMeetingLink: !!activeSession.meetingLink, // Allow join only if link exists
        };
      }

      // 4. Calculate Stats (Completed Classes & Hours)
      let completedClassesJson: any[] = [];
      try {
        completedClassesJson = await this.prisma.bookings.findMany({
          where: {
            bookedByUserId: userId,
            status: 'COMPLETED',
          },
          select: {
            startTime: true,
            endTime: true,
            teacherId: true, // For re-connect logic
          },
        });
      } catch (e) {
        this.logger.error(`Failed to fetch completed stats: ${e.message}`);
      }

      const completedClassesCount = completedClassesJson.length;
      const totalHoursLearned = completedClassesJson.reduce((acc, booking) => {
        const start = new Date(booking.startTime).getTime();
        const end = new Date(booking.endTime).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0);

      // 5. Smart Teacher Recommendations
      let suggestedTeachers: any[] = [];
      try {
        // Collect past teacher IDs for Tier 1 (Re-connect)
        const pastTeacherIds = [
          ...new Set(completedClassesJson.map((b) => b.teacherId)),
        ];
        suggestedTeachers = await this.getSuggestedTeachers(
          userId,
          student_profiles,
          pastTeacherIds,
        );
      } catch (e) {
        this.logger.error(`Failed to fetch suggestions: ${e.message}`, e.stack);
        // Fallback: Empty array (frontend handles empty state if needed, or we implement fallback inside getSuggestedTeachers)
      }

      // 6. Total Classes (All time)
      const totalClasses = await this.prisma.bookings.count({
        where: { bookedByUserId: userId },
      });

      return {
        balance: wallet.balance || 0,
        activeSession, // NEW
        upcomingClasses,
        totalClasses,
        completedClassesCount,
        totalHoursLearned: Math.round(totalHoursLearned * 10) / 10, // Round to 1 decimal
        suggestedTeachers,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get dashboard stats for ${userId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Smart Recommendation Algorithm
   * Tier 1: Re-connect (Past teachers)
   * Tier 2: Curriculum & Grade Match
   * Tier 3: Top Rated (Fallback)
   */
  private async getSuggestedTeachers(
    userId: string,
    profile: any,
    pastTeacherIds: string[],
  ) {
    const suggestions: any[] = [];
    const excludeTeacherIds = new Set<string>(); // Keep track to avoid duplicates

    // --- Tier 1: Re-connect (Max 1) ---
    if (pastTeacherIds.length > 0) {
      const reconnectTeachers = await this.prisma.teacher_profiles.findMany({
        where: {
          id: { in: pastTeacherIds },
          applicationStatus: 'APPROVED',
          isOnVacation: false,
        },
        take: 1, // Suggest most recent/relevant one
        include: {
          users: true,
          teacher_subjects: { include: { subjects: true } },
        },
      });

      reconnectTeachers.forEach((t) => {
        suggestions.push(t);
        excludeTeacherIds.add(t.id);
      });
    }

    // --- Tier 2: Curriculum & Grade Match ---
    // Only if we have profile data
    if (suggestions.length < 3 && profile?.curriculumId) {
      const needed = 3 - suggestions.length;

      const matchQuery: any = {
        applicationStatus: 'APPROVED',
        isOnVacation: false,
        id: { notIn: Array.from(excludeTeacherIds) },
        // Match teachers who have subjects linked to this curricula
        teacher_subjects: {
          some: {
            curriculumId: profile.curriculumId,
          },
        },
      };

      // Refinement: If grade is known, filter strictly by grade?
      // TeacherSubject -> grades. Complex query.
      // For MVP, Curriculum match is a strong enough signal.

      const matchedTeachers = await this.prisma.teacher_profiles.findMany({
        where: matchQuery,
        take: needed,
        orderBy: { averageRating: 'desc' },
        include: {
          users: true,
          teacher_subjects: { include: { subjects: true } },
        },
      });

      matchedTeachers.forEach((t) => {
        suggestions.push(t);
        excludeTeacherIds.add(t.id);
      });
    }

    // --- Tier 3: Top Rated Fallback ---
    if (suggestions.length < 3) {
      const needed = 3 - suggestions.length;
      const topTeachers = await this.prisma.teacher_profiles.findMany({
        where: {
          applicationStatus: 'APPROVED',
          isOnVacation: false,
          id: { notIn: Array.from(excludeTeacherIds) },
        },
        take: needed,
        orderBy: { averageRating: 'desc' },
        include: {
          users: true,
          teacher_subjects: { include: { subjects: true } },
        },
      });

      topTeachers.forEach((t) => suggestions.push(t));
    }

    // Transform for Frontend Display
    return suggestions.map((t) => ({
      id: t.id,
      name: t.displayName || t.users.firstName + ' ' + t.users.lastName,
      subject: t.teacher_subjects?.[0]?.subjects?.nameAr || 'عام', // Pick primary subject
      rating: t.averageRating || 5.0, // Default to 5.0 for new teachers if 0? Or keep 0.
      image: t.profilePhotoUrl || t.users.profilePhotoUrl,
      slug: t.slug || t.id,
    }));
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.student_profiles.findUnique({
      where: { userId },
      include: { users: true, curricula: true },
    });
    if (!profile) throw new NotFoundException('Student profile not found');

    // Transform relations to match frontend expected structure
    return {
      ...profile,
      user: profile.users, // Map users -> user
      curriculum: profile.curricula, // Map curricula -> curriculum
    };
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
      await this.prisma.users.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });
    }

    // Update student profile fields
    const profile = await this.prisma.student_profiles.update({
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
      include: { users: true, curricula: true },
    });

    // Transform relations to match frontend expected structure
    return {
      ...profile,
      user: profile.users, // Map users -> user
      curriculum: profile.curricula, // Map curricula -> curriculum
    };
  }

  async getCurricula() {
    const curricula = await this.prisma.curricula.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
      include: {
        educational_stages: {
          where: { isActive: true },
          orderBy: { sequence: 'asc' },
          include: {
            grade_levels: {
              where: { isActive: true },
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
    });

    // Transform to match frontend expected structure
    return curricula.map((c) => ({
      ...c,
      stages: c.educational_stages.map((s) => ({
        ...s,
        grades: s.grade_levels,
      })),
    }));
  }
}
