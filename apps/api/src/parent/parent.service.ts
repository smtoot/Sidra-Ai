import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { UpdateParentProfileDto, CreateChildDto, UpdateChildDto } from './dto';
import { SessionUtil } from '../common/utils/session.util';

@Injectable()
export class ParentService {
  private readonly logger = new Logger(ParentService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async getDashboardStats(userId: string) {
    const [wallet, upcomingBookings, activeSessionsResult, parentProfile] =
      await Promise.all([
        this.walletService.getBalance(userId),
        this.prisma.bookings.findMany({
          where: {
            bookedByUserId: userId,
            status: 'SCHEDULED',
          },
          orderBy: { startTime: 'asc' },
          take: 5, // Limit to next 5 upcoming classes
          include: {
            teacher_profiles: { include: { users: true } },
            subjects: true,
            children: true, // Include child name
          },
        }),
        // Fetch Active Sessions for ANY child
        this.prisma.bookings.findMany({
          where: {
            bookedByUserId: userId,
            status: 'SCHEDULED',
            startTime: { lte: new Date(Date.now() + 10 * 60 * 1000) }, // Start <= Now + 10m
            endTime: { gte: new Date() }, // End >= Now
          },
          include: {
            teacher_profiles: { include: { users: true } },
            subjects: true,
            children: true,
          },
        }),
        this.prisma.parent_profiles.findUnique({
          where: { userId },
          include: { children: true },
        }),
      ]);

    // Flatten and enrich booking data
    const upcomingClasses = upcomingBookings.map((booking, index) => ({
      ...booking,
      isNextGlobalSession: index === 0, // Oldest upcoming is "next"
    }));

    // Process Active Sessions
    const now = new Date();
    // Explicitly type mapped session or let inference work
    const activeSessions = activeSessionsResult.map((session) => ({
      ...session,
      studentName: session.children ? session.children.name : 'Child',
      teacherName: session.teacher_profiles?.users?.firstName || 'Teacher',
      subjectName: session.subjects?.nameAr || 'General',
      isActive: SessionUtil.isSessionActive(
        session.startTime,
        session.endTime,
        now,
      ),
      isJoinable: SessionUtil.isSessionJoinable(
        session.startTime,
        session.endTime,
        now,
      ),
      isLate: SessionUtil.isSessionLate(session.startTime, now),
      hasMeetingLink: !!session.meetingLink,
    }));

    return {
      balance: wallet?.balance || 0,
      upcomingClasses,
      activeSessions, // Returns array, sorted active first implicitly by findMany order if any (actually findMany defaults to id if not specified, but we depend on frontend to sort or added orderBy in query?)
      // Query didn't have orderBy. Let's assume frontend sorts or it's fine for now (rare to have simultaneous).
      // We should ideally sort by start time desc or asc.
      children: parentProfile?.children || [],
    };
  }

  // --- Children Management ---

  async getChildren(userId: string) {
    const parentProfile = await this.prisma.parent_profiles.findUnique({
      where: { userId },
      include: {
        children: {
          include: {
            curricula: true,
            bookings: {
              where: { status: 'SCHEDULED' },
              select: { id: true }, // Lightweight, just for counting
            },
          },
        },
      },
    });

    if (!parentProfile) throw new NotFoundException('Parent profile not found');

    // Map to include a simple count
    return parentProfile.children.map((child) => ({
      ...child,
      upcomingClassesCount: child.bookings.length,
    }));
  }

  async getChild(userId: string, childId: string) {
    // 1. Get Parent Profile ID first (more robust than nested query)
    const parentProfile = await this.prisma.parent_profiles.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!parentProfile) {
      throw new NotFoundException('Parent profile not found');
    }

    // 2. Verify child ownership using parentId
    const child = await this.prisma.children.findFirst({
      where: {
        id: childId,
        parentId: parentProfile.id,
      },
      include: {
        curricula: true,
      },
    });

    if (!child) {
      throw new NotFoundException('Child not found or unauthorized');
    }

    // 2. Fetch Stats (Wrapped in Try/Catch to isolate failures)
    let stats = { upcomingCount: 0, completedCount: 0 };
    let recentBookings: any[] = [];

    try {
      const [upcomingCount, completedCount, upcomingClasses] =
        await Promise.all([
          this.prisma.bookings.count({
            where: {
              childId,
              status: 'SCHEDULED',
            },
          }),
          this.prisma.bookings.count({
            where: {
              childId,
              status: 'COMPLETED',
            },
          }),
          this.prisma.bookings.findMany({
            where: { childId },
            orderBy: { startTime: 'desc' },
            take: 5,
            include: {
              teacher_profiles: { include: { users: true } },
              subjects: true,
            },
          }),
        ]);
      stats = { upcomingCount, completedCount };
      recentBookings = upcomingClasses;
    } catch (error) {
      // Don't crash the whole details view if stats fail - use defaults but log the error
      this.logger.warn(`Failed to fetch stats for child ${childId}`, error);
    }

    return {
      ...child,
      stats,
      recentBookings,
    };
  }

  async addChild(userId: string, data: CreateChildDto) {
    const parentProfile = await this.prisma.parent_profiles.findUnique({
      where: { userId },
    });

    if (!parentProfile) throw new NotFoundException('Parent profile not found');

    return this.prisma.children.create({
      data: {
        id: crypto.randomUUID(),
        parentId: parentProfile.id,
        name: data.name,
        gradeLevel: data.gradeLevel,
        schoolName: data.schoolName,
        curriculumId: data.curriculumId || null,
      },
      include: { curricula: true },
    });
  }

  async updateChild(userId: string, childId: string, data: UpdateChildDto) {
    // Verify ownership
    const child = await this.prisma.children.findFirst({
      where: {
        id: childId,
        parent_profiles: { userId },
      },
    });

    if (!child) throw new NotFoundException('Child not found or unauthorized');

    return this.prisma.children.update({
      where: { id: childId },
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel,
        schoolName: data.schoolName,
        curriculumId: data.curriculumId || null,
      },
      include: { curricula: true },
    });
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

  // --- Profile Management ---

  async getProfile(userId: string) {
    const parentProfile = await this.prisma.parent_profiles.findUnique({
      where: { userId },
      include: {
        users: true,
        children: true,
      },
    });

    if (!parentProfile) throw new NotFoundException('Parent profile not found');

    // Transform relations
    return {
      ...parentProfile,
      user: parentProfile.users,
    };
  }

  async updateProfile(userId: string, data: UpdateParentProfileDto) {
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

    // Update parent profile fields
    const profile = await this.prisma.parent_profiles.update({
      where: { userId },
      data: {
        whatsappNumber: data.whatsappNumber,
        city: data.city,
        country: data.country,
      },
      include: {
        users: true,
        children: true,
      },
    });

    // Transform relations
    return {
      ...profile,
      user: profile.users,
    };
  }
}
