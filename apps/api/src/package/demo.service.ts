import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type DemoEligibility = {
    allowed: boolean;
    reason?: 'ALREADY_USED' | 'PENDING_EXISTS' | 'DEMO_DISABLED' | 'NOT_ELIGIBLE';
};

@Injectable()
export class DemoService {
    constructor(private prisma: PrismaService) { }

    // =====================================================
    // CHECK DEMO ELIGIBILITY
    // =====================================================

    async canBookDemo(studentId: string, teacherId: string): Promise<DemoEligibility> {
        // Check if teacher has demo enabled
        const demoSettings = await this.prisma.teacherDemoSettings.findUnique({
            where: { teacherId }
        });

        if (!demoSettings || !demoSettings.demoEnabled) {
            return { allowed: false, reason: 'DEMO_DISABLED' };
        }

        // Check if demo already completed (usedAt is set)
        const completedDemo = await this.prisma.demoSession.findFirst({
            where: {
                studentId,
                teacherId,
                usedAt: { not: null } // Only count completed demos
            }
        });

        if (completedDemo) {
            return { allowed: false, reason: 'ALREADY_USED' };
        }

        // Check if there's a pending demo booking
        const pendingDemoBooking = await this.prisma.booking.findFirst({
            where: {
                studentUserId: studentId,
                teacherId,
                status: { in: ['PENDING_TEACHER_APPROVAL', 'SCHEDULED', 'WAITING_FOR_PAYMENT'] }
            }
        });

        // Also check for pending DemoSession records (created but not completed)
        const pendingDemoSession = await this.prisma.demoSession.findFirst({
            where: {
                studentId,
                teacherId,
                usedAt: null // Created but not completed
            }
        });

        if (pendingDemoBooking || pendingDemoSession) {
            return { allowed: false, reason: 'PENDING_EXISTS' };
        }

        return { allowed: true };
    }

    // =====================================================
    // CREATE DEMO SESSION RECORD
    // Called when demo booking is created
    // usedAt stays NULL until completion
    // =====================================================

    async createDemoRecord(studentId: string, teacherId: string) {
        // Verify eligibility first
        const eligibility = await this.canBookDemo(studentId, teacherId);
        if (!eligibility.allowed) {
            throw new BadRequestException(`Cannot book demo: ${eligibility.reason}`);
        }

        // Create record with usedAt = null
        return this.prisma.demoSession.create({
            data: {
                studentId,
                teacherId,
                usedAt: null // IMPORTANT: Set only on completion
            }
        });
    }

    // =====================================================
    // MARK DEMO AS COMPLETED
    // Called only when demo booking status → COMPLETED
    // =====================================================

    async markDemoCompleted(studentId: string, teacherId: string) {
        const demoSession = await this.prisma.demoSession.findUnique({
            where: {
                studentId_teacherId: { studentId, teacherId }
            }
        });

        if (!demoSession) {
            throw new NotFoundException('Demo session record not found');
        }

        if (demoSession.usedAt) {
            // Already marked as used - idempotent
            return demoSession;
        }

        return this.prisma.demoSession.update({
            where: { id: demoSession.id },
            data: { usedAt: new Date() }
        });
    }

    // =====================================================
    // CANCEL DEMO (if booking is cancelled)
    // Deletes the DemoSession record so student can try again
    // =====================================================

    async cancelDemoRecord(studentId: string, teacherId: string) {
        const demoSession = await this.prisma.demoSession.findUnique({
            where: {
                studentId_teacherId: { studentId, teacherId }
            }
        });

        if (!demoSession) {
            return; // Nothing to cancel
        }

        // Only delete if not already used
        if (!demoSession.usedAt) {
            await this.prisma.demoSession.delete({
                where: { id: demoSession.id }
            });
        }
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
            create: {
                teacherId,
                demoEnabled
            },
            update: {
                demoEnabled
            }
        });
    }

    // =====================================================
    // CHECK IF TEACHER HAS DEMO ENABLED
    // =====================================================

    async isTeacherDemoEnabled(teacherId: string): Promise<boolean> {
        const settings = await this.prisma.teacherDemoSettings.findUnique({
            where: { teacherId }
        });
        return settings?.demoEnabled ?? false;
    }
}
