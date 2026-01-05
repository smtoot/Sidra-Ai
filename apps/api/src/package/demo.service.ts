import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_POLICY } from './demo-policy.constants';

export type DemoEligibility = {
  allowed: boolean;
  reason?:
  | 'QUOTA_EXCEEDED'
  | 'TEACHER_ALREADY_USED'
  | 'PENDING_EXISTS'
  | 'DEMO_DISABLED'
  | 'FEATURE_DISABLED';
  details?: string;
};

export type DemoOwnerType = 'PARENT' | 'STUDENT';

@Injectable()
export class DemoService {
  constructor(private prisma: PrismaService) { }

  // =====================================================
  // CHECK DEMO ELIGIBILITY (Anti-Abuse Hardened)
  // Uses demoOwnerId (Parent or Student) for quota
  // =====================================================

  async canBookDemo(
    demoOwnerId: string,
    teacherId: string,
  ): Promise<DemoEligibility> {
    // 1. Check if demo feature is globally enabled
    const settings = await this.prisma.system_settings.findFirst();
    if (settings && !settings.demosEnabled) {
      return { allowed: false, reason: 'FEATURE_DISABLED' };
    }

    // 2. Check if teacher has demos enabled
    const demoSettings = await this.prisma.teacher_demo_settings.findUnique({
      where: { teacherId },
    });

    if (!demoSettings || !demoSettings.demoEnabled) {
      return { allowed: false, reason: 'DEMO_DISABLED' };
    }

    // 3. LIFETIME CHECK: One demo per owner-teacher (any status)
    const existingDemo = await this.prisma.demo_sessions.findUnique({
      where: {
        demoOwnerId_teacherId: { demoOwnerId, teacherId },
      },
    });

    if (existingDemo) {
      return {
        allowed: false,
        reason: 'TEACHER_ALREADY_USED',
        details: 'You have already had a demo with this teacher',
      };
    }

    // 4. MONTHLY QUOTA CHECK: Only count COMPLETED demos (not CANCELLED)
    // SECURITY FIX: Cancelled demos should NOT count toward quota
    // This allows users to retry if a demo was cancelled
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usedDemosThisMonth = await this.prisma.demo_sessions.count({
      where: {
        demoOwnerId,
        status: 'COMPLETED', // Only completed demos count toward quota
        createdAt: { gte: startOfMonth },
      },
    });

    if (usedDemosThisMonth >= DEMO_POLICY.maxDemosPerOwnerPerMonth) {
      return {
        allowed: false,
        reason: 'QUOTA_EXCEEDED',
        details: `You have used ${usedDemosThisMonth}/${DEMO_POLICY.maxDemosPerOwnerPerMonth} demos this month`,
      };
    }

    // 5. Check for pending demo with this teacher (shouldn't exist due to unique constraint)
    const pendingDemo = await this.prisma.demo_sessions.findFirst({
      where: {
        demoOwnerId,
        teacherId,
        status: 'SCHEDULED',
      },
    });

    if (pendingDemo) {
      return { allowed: false, reason: 'PENDING_EXISTS' };
    }

    return { allowed: true };
  }

  // =====================================================
  // CREATE DEMO SESSION RECORD
  // Called when demo booking is created
  // =====================================================

  async createDemoRecord(
    demoOwnerId: string,
    demoOwnerType: DemoOwnerType,
    teacherId: string,
    beneficiaryId?: string,
  ) {
    // Verify eligibility first
    const eligibility = await this.canBookDemo(demoOwnerId, teacherId);
    if (!eligibility.allowed) {
      throw new BadRequestException(
        `Cannot book demo: ${eligibility.reason}. ${eligibility.details || ''}`,
      );
    }

    // Create record with status = SCHEDULED
    return this.prisma.demo_sessions.create({
      data: {
        id: crypto.randomUUID(),
        demoOwnerId,
        demoOwnerType,
        teacherId,
        beneficiaryId,
        status: 'SCHEDULED',
        rescheduleCount: 0,
      },
    });
  }

  // =====================================================
  // MARK DEMO AS COMPLETED
  // Called only when demo booking status → COMPLETED
  // =====================================================

  async markDemoCompleted(demoOwnerId: string, teacherId: string) {
    const demoSession = await this.prisma.demo_sessions.findUnique({
      where: {
        demoOwnerId_teacherId: { demoOwnerId, teacherId },
      },
    });

    if (!demoSession) {
      throw new NotFoundException('Demo session record not found');
    }

    if (demoSession.status === 'COMPLETED') {
      // Idempotent
      return demoSession;
    }

    return this.prisma.demo_sessions.update({
      where: { id: demoSession.id },
      data: {
        status: 'COMPLETED',
        usedAt: new Date(),
      },
    });
  }

  // =====================================================
  // CANCEL DEMO - Now deletes the record to allow retry
  // SECURITY FIX: Cancelled demos no longer count toward quota
  // =====================================================

  async cancelDemoRecord(demoOwnerId: string, teacherId: string) {
    return this.cancelDemoRecordInternal(demoOwnerId, teacherId, this.prisma);
  }

  /**
   * Cancel demo record within an existing transaction
   * Used when booking cancellation needs to be atomic with demo cleanup
   */
  async cancelDemoRecordInTransaction(
    demoOwnerId: string,
    teacherId: string,
    tx: any, // Prisma.TransactionClient
  ) {
    return this.cancelDemoRecordInternal(demoOwnerId, teacherId, tx);
  }

  private async cancelDemoRecordInternal(
    demoOwnerId: string,
    teacherId: string,
    prisma: any,
  ) {
    const demoSession = await prisma.demo_sessions.findUnique({
      where: {
        demoOwnerId_teacherId: { demoOwnerId, teacherId },
      },
    });

    if (!demoSession) {
      return; // Nothing to cancel
    }

    // Only cancel SCHEDULED demos (not already completed)
    if (demoSession.status !== 'SCHEDULED') {
      return demoSession;
    }

    // SECURITY FIX: Delete the demo record to allow the user to try again
    // This enables users to book another demo with this teacher after cancellation
    await prisma.demo_sessions.delete({
      where: { id: demoSession.id },
    });

    return { deleted: true, demoSessionId: demoSession.id };
  }

  // =====================================================
  // RESCHEDULE DEMO (MAX 1 ALLOWED)
  // =====================================================

  async rescheduleDemoSession(
    demoOwnerId: string,
    teacherId: string,
    newStartTime: Date,
  ) {
    const demoSession = await this.prisma.demo_sessions.findUnique({
      where: {
        demoOwnerId_teacherId: { demoOwnerId, teacherId },
      },
    });

    if (!demoSession) {
      throw new NotFoundException('Demo session not found');
    }

    if (demoSession.status !== 'SCHEDULED') {
      throw new ForbiddenException(
        `Cannot reschedule: demo status is ${demoSession.status}`,
      );
    }

    if (demoSession.rescheduleCount >= DEMO_POLICY.demoMaxReschedules) {
      throw new ForbiddenException(
        `Maximum ${DEMO_POLICY.demoMaxReschedules} reschedule(s) allowed per demo`,
      );
    }

    return this.prisma.demo_sessions.update({
      where: { id: demoSession.id },
      data: {
        rescheduleCount: { increment: 1 },
      },
    });
  }

  // =====================================================
  // GET OWNER'S DEMO USAGE STATS
  // =====================================================

  async getDemoUsageStats(demoOwnerId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [completedThisMonth, totalCompleted, totalScheduled] =
      await Promise.all([
        // Only COMPLETED demos count toward monthly quota
        this.prisma.demo_sessions.count({
          where: {
            demoOwnerId,
            status: 'COMPLETED',
            createdAt: { gte: startOfMonth },
          },
        }),
        // Total completed ever
        this.prisma.demo_sessions.count({
          where: {
            demoOwnerId,
            status: 'COMPLETED',
          },
        }),
        // Currently scheduled (pending)
        this.prisma.demo_sessions.count({
          where: {
            demoOwnerId,
            status: 'SCHEDULED',
          },
        }),
      ]);

    return {
      usedThisMonth: completedThisMonth,
      remainingThisMonth: Math.max(
        0,
        DEMO_POLICY.maxDemosPerOwnerPerMonth - completedThisMonth,
      ),
      totalCompleted,
      scheduledCount: totalScheduled,
    };
  }

  // =====================================================
  // TEACHER DEMO SETTINGS
  // =====================================================

  async getDemoSettings(teacherId: string) {
    return this.prisma.teacher_demo_settings.findUnique({
      where: { teacherId },
    });
  }

  async updateDemoSettings(teacherId: string, demoEnabled: boolean) {
    return this.prisma.teacher_demo_settings.upsert({
      where: { teacherId },
      create: {
        id: crypto.randomUUID(),
        teacherId,
        demoEnabled,
        updatedAt: new Date(),
      },
      update: { demoEnabled },
    });
  }

  async isTeacherDemoEnabled(teacherId: string): Promise<boolean> {
    const settings = await this.prisma.teacher_demo_settings.findUnique({
      where: { teacherId },
    });
    return settings?.demoEnabled ?? false;
  }

  // =====================================================
  // ADMIN: LIST ALL DEMO SESSIONS
  // =====================================================

  async getAllDemoSessions() {
    const sessions = await this.prisma.demo_sessions.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
        },
        teacher_profiles: {
          select: {
            id: true,
            displayName: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to friendly names expected by frontend
    return sessions.map((s) => ({
      ...s,
      student: s.users,
      teacher: s.teacher_profiles,
    }));
  }
}
