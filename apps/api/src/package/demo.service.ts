import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_POLICY } from './demo-policy.constants';

export type DemoEligibility = {
    allowed: boolean;
    reason?: 'QUOTA_EXCEEDED' | 'TEACHER_ALREADY_USED' | 'PENDING_EXISTS' | 'DEMO_DISABLED' | 'FEATURE_DISABLED';
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
        teacherId: string
    ): Promise<DemoEligibility> {
        // 1. Check if demo feature is globally enabled
        const settings = await this.prisma.systemSettings.findFirst();
        if (settings && !settings.demosEnabled) {
            return { allowed: false, reason: 'FEATURE_DISABLED' };
        }

        // 2. Check if teacher has demos enabled
        const demoSettings = await this.prisma.teacherDemoSettings.findUnique({
            where: { teacherId }
        });

        if (!demoSettings || !demoSettings.demoEnabled) {
            return { allowed: false, reason: 'DEMO_DISABLED' };
        }

        // 3. LIFETIME CHECK: One demo per owner-teacher (any status)
        const existingDemo = await this.prisma.demoSession.findUnique({
            where: {
                demoOwnerId_teacherId: { demoOwnerId, teacherId }
            }
        });

        if (existingDemo) {
            return {
                allowed: false,
                reason: 'TEACHER_ALREADY_USED',
                details: 'You have already had a demo with this teacher'
            };
        }

        // 4. MONTHLY QUOTA CHECK: Count COMPLETED + CANCELLED this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const usedDemosThisMonth = await this.prisma.demoSession.count({
            where: {
                demoOwnerId,
                status: { in: ['COMPLETED', 'CANCELLED'] },
                createdAt: { gte: startOfMonth }
            }
        });

        if (usedDemosThisMonth >= DEMO_POLICY.maxDemosPerOwnerPerMonth) {
            return {
                allowed: false,
                reason: 'QUOTA_EXCEEDED',
                details: `You have used ${usedDemosThisMonth}/${DEMO_POLICY.maxDemosPerOwnerPerMonth} demos this month`
            };
        }

        // 5. Check for pending demo with this teacher (shouldn't exist due to unique constraint)
        const pendingDemo = await this.prisma.demoSession.findFirst({
            where: {
                demoOwnerId,
                teacherId,
                status: 'SCHEDULED'
            }
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
        beneficiaryId?: string
    ) {
        // Verify eligibility first
        const eligibility = await this.canBookDemo(demoOwnerId, teacherId);
        if (!eligibility.allowed) {
            throw new BadRequestException(`Cannot book demo: ${eligibility.reason}. ${eligibility.details || ''}`);
        }

        // Create record with status = SCHEDULED
        return this.prisma.demoSession.create({
            data: {
                demoOwnerId,
                demoOwnerType,
                teacherId,
                beneficiaryId,
                status: 'SCHEDULED',
                rescheduleCount: 0
            }
        });
    }

    // =====================================================
    // MARK DEMO AS COMPLETED
    // Called only when demo booking status → COMPLETED
    // =====================================================

    async markDemoCompleted(demoOwnerId: string, teacherId: string) {
        const demoSession = await this.prisma.demoSession.findUnique({
            where: {
                demoOwnerId_teacherId: { demoOwnerId, teacherId }
            }
        });

        if (!demoSession) {
            throw new NotFoundException('Demo session record not found');
        }

        if (demoSession.status === 'COMPLETED') {
            // Idempotent
            return demoSession;
        }

        return this.prisma.demoSession.update({
            where: { id: demoSession.id },
            data: {
                status: 'COMPLETED',
                usedAt: new Date()
            }
        });
    }

    // =====================================================
    // CANCEL DEMO (COUNTS TOWARD QUOTA - NO DELETE)
    // =====================================================

    async cancelDemoRecord(demoOwnerId: string, teacherId: string) {
        const demoSession = await this.prisma.demoSession.findUnique({
            where: {
                demoOwnerId_teacherId: { demoOwnerId, teacherId }
            }
        });

        if (!demoSession) {
            return; // Nothing to cancel
        }

        if (demoSession.status === 'CANCELLED') {
            // Idempotent
            return demoSession;
        }

        // CRITICAL: Do NOT delete - mark as cancelled (counts toward quota)
        return this.prisma.demoSession.update({
            where: { id: demoSession.id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date()
            }
        });
    }

    // =====================================================
    // RESCHEDULE DEMO (MAX 1 ALLOWED)
    // =====================================================

    async rescheduleDemoSession(
        demoOwnerId: string,
        teacherId: string,
        newStartTime: Date
    ) {
        const demoSession = await this.prisma.demoSession.findUnique({
            where: {
                demoOwnerId_teacherId: { demoOwnerId, teacherId }
            }
        });

        if (!demoSession) {
            throw new NotFoundException('Demo session not found');
        }

        if (demoSession.status !== 'SCHEDULED') {
            throw new ForbiddenException(`Cannot reschedule: demo status is ${demoSession.status}`);
        }

        if (demoSession.rescheduleCount >= DEMO_POLICY.demoMaxReschedules) {
            throw new ForbiddenException(
                `Maximum ${DEMO_POLICY.demoMaxReschedules} reschedule(s) allowed per demo`
            );
        }

        return this.prisma.demoSession.update({
            where: { id: demoSession.id },
            data: {
                rescheduleCount: { increment: 1 }
            }
        });
    }

    // =====================================================
    // GET OWNER'S DEMO USAGE STATS
    // =====================================================

    async getDemoUsageStats(demoOwnerId: string) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [usedThisMonth, totalLifetime] = await Promise.all([
            this.prisma.demoSession.count({
                where: {
                    demoOwnerId,
                    status: { in: ['COMPLETED', 'CANCELLED'] },
                    createdAt: { gte: startOfMonth }
                }
            }),
            this.prisma.demoSession.count({
                where: { demoOwnerId }
            })
        ]);

        return {
            usedThisMonth,
            remainingThisMonth: Math.max(0, DEMO_POLICY.maxDemosPerOwnerPerMonth - usedThisMonth),
            totalLifetime
        };
    }

    // =====================================================
    // TEACHER DEMO SETTINGS
    // =====================================================

    async getDemoSettings(teacherId: string) {
        return this.prisma.teacherDemoSettings.findUnique({
            where: { teacherId }
        });
    }

    async updateDemoSettings(teacherId: string, demoEnabled: boolean) {
        return this.prisma.teacherDemoSettings.upsert({
            where: { teacherId },
            create: { teacherId, demoEnabled },
            update: { demoEnabled }
        });
    }

    async isTeacherDemoEnabled(teacherId: string): Promise<boolean> {
        const settings = await this.prisma.teacherDemoSettings.findUnique({
            where: { teacherId }
        });
        return settings?.demoEnabled ?? false;
    }

    // =====================================================
    // ADMIN: LIST ALL DEMO SESSIONS
    // =====================================================

    async getAllDemoSessions() {
        return this.prisma.demoSession.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        phoneNumber: true,
                        role: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePhotoUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
