import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@sidra/shared';
import { PackageService } from './package.service';
import { DemoService } from './demo.service';

// =====================================================
// DTOs
// =====================================================

class PurchasePackageDto {
    studentId: string; // Session attendee (can be same as payer or different)
    teacherId: string;
    subjectId: string;
    tierId: string;
}

class UpdateDemoSettingsDto {
    demoEnabled: boolean;
}

// =====================================================
// CONTROLLER
// =====================================================

@Controller('packages')
@UseGuards(JwtAuthGuard)
export class PackageController {
    constructor(
        private packageService: PackageService,
        private demoService: DemoService
    ) { }

    // =====================================================
    // PUBLIC: Get available tiers
    // =====================================================

    @Get('tiers')
    async getTiers() {
        return this.packageService.getActiveTiers();
    }

    // =====================================================
    // PARENT/STUDENT: Purchase package
    // =====================================================

    @Post('purchase')
    @UseGuards(RolesGuard)
    @Roles(UserRole.PARENT, UserRole.STUDENT)
    async purchasePackage(@Req() req: any, @Body() dto: PurchasePackageDto) {
        const payerId = req.user.userId;
        const idempotencyKey = `PURCHASE_${payerId}_${dto.teacherId}_${dto.subjectId}_${dto.tierId}_${Date.now()}`;

        return this.packageService.purchasePackage(
            payerId,
            dto.studentId,
            dto.teacherId,
            dto.subjectId,
            dto.tierId,
            idempotencyKey
        );
    }

    // =====================================================
    // PARENT/STUDENT: Get my packages
    // =====================================================

    @Get('my')
    @UseGuards(RolesGuard)
    @Roles(UserRole.PARENT, UserRole.STUDENT)
    async getMyPackages(@Req() req: any) {
        // Get packages where user is either payer or student
        const userId = req.user.userId;
        return this.packageService.getStudentPackages(userId);
    }

    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.PARENT, UserRole.STUDENT, UserRole.ADMIN)
    async getPackageById(@Param('id') id: string) {
        return this.packageService.getPackageById(id);
    }

    // =====================================================
    // PARENT/STUDENT: Cancel package
    // =====================================================

    @Post(':id/cancel')
    @UseGuards(RolesGuard)
    @Roles(UserRole.PARENT, UserRole.STUDENT)
    async cancelPackage(@Req() req: any, @Param('id') id: string) {
        const idempotencyKey = `CANCEL_${id}_${Date.now()}`;
        await this.packageService.cancelPackage(id, 'STUDENT', idempotencyKey);
        return { success: true, message: 'Package cancelled and refunded' };
    }

    // =====================================================
    // DEMO: Check eligibility
    // =====================================================

    @Get('demo/check/:teacherId')
    async checkDemoEligibility(@Req() req: any, @Param('teacherId') teacherId: string) {
        const studentId = req.user.userId;
        return this.demoService.canBookDemo(studentId, teacherId);
    }

    // =====================================================
    // DEMO: Check if teacher has demo enabled (public)
    // =====================================================

    @Get('demo/teacher/:teacherId')
    async isTeacherDemoEnabled(@Param('teacherId') teacherId: string) {
        const enabled = await this.demoService.isTeacherDemoEnabled(teacherId);
        return { demoEnabled: enabled };
    }

    // =====================================================
    // TEACHER: Update demo settings
    // =====================================================

    @Post('demo/settings')
    @UseGuards(RolesGuard)
    @Roles(UserRole.TEACHER)
    async updateDemoSettings(@Req() req: any, @Body() dto: UpdateDemoSettingsDto) {
        const teacherProfile = await this.getTeacherProfile(req.user.userId);
        return this.demoService.updateDemoSettings(teacherProfile.id, dto.demoEnabled);
    }

    @Get('demo/settings')
    @UseGuards(RolesGuard)
    @Roles(UserRole.TEACHER)
    async getDemoSettings(@Req() req: any) {
        const teacherProfile = await this.getTeacherProfile(req.user.userId);
        return this.demoService.getDemoSettings(teacherProfile.id);
    }

    // Helper to get teacher profile ID from user ID
    private async getTeacherProfile(userId: string) {
        // This should be injected as a service, but for simplicity:
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const profile = await prisma.teacherProfile.findUnique({ where: { userId } });
        await prisma.$disconnect();
        if (!profile) throw new Error('Teacher profile not found');
        return profile;
    }
}
