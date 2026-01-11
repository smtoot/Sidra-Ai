import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Patch,
  Delete,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import {
  UserRole,
  PurchaseSmartPackDto,
  CheckRecurringAvailabilityDto,
  CheckMultiSlotAvailabilityDto,
  BookFloatingSessionDto,
  RescheduleSessionDto,
  CreatePackageTierDto,
  UpdatePackageTierDto,
} from '@sidra/shared';
import { PackageService } from './package.service';
import { DemoService } from './demo.service';
import {
  IsBoolean,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

// =====================================================
// DTOs
// =====================================================

class PurchasePackageDto {
  @IsString()
  studentId: string; // Session attendee (can be same as payer or different)

  @IsString()
  teacherId: string;

  @IsString()
  subjectId: string;

  @IsString()
  tierId: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string; // SECURITY FIX: Client-generated idempotency key
}

class UpdateDemoSettingsDto {
  @IsBoolean()
  demoEnabled: boolean;
}

// Local DTOs removed - using shared DTOs from @sidra/shared instead

// =====================================================
// CONTROLLER
// =====================================================

@Controller('packages')
export class PackageController {
  constructor(
    private packageService: PackageService,
    private demoService: DemoService,
  ) {}

  // =====================================================
  // ADMIN: Manage Tiers & Stats
  // =====================================================

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminStats() {
    return this.packageService.getAdminStats();
  }

  @Get('admin/demo-sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminDemoSessions() {
    return this.demoService.getAllDemoSessions();
  }

  @Post('tiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createTier(@Body() dto: CreatePackageTierDto) {
    return this.packageService.createTier(dto);
  }

  @Get('tiers')
  @Public() // SECURITY: Public endpoint - guests can see available package tiers
  async getTiers(@Query('all') all?: boolean) {
    // Public endpoint returns active only. Admin might need all?
    // For now public calls simple getActiveTiers.
    // If admin needs all, we can add logic here or a separate endpoint.
    // Let's modify getActiveTiers in service or add getAllTiers if needed.
    // Given the requirement, admin usually sees everything.
    // I'll stick to basic public getTiers for now as defined before.
    return this.packageService.getActiveTiers();
  }

  // Admin specific get all tiers
  @Get('admin/tiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllTiers() {
    return this.packageService.getAllTiers();
  }

  @Patch('tiers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateTier(@Param('id') id: string, @Body() dto: UpdatePackageTierDto) {
    return this.packageService.updateTier(id, dto);
  }

  @Delete('tiers/:id') // Using Delete for soft-delete/deactivate
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteTier(@Param('id') id: string) {
    return this.packageService.deleteTier(id);
  }

  // =====================================================
  // PARENT/STUDENT: Purchase package
  // =====================================================

  @Post('purchase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  async purchasePackage(@Req() req: any, @Body() dto: PurchasePackageDto) {
    const payerId = req.user.userId;
    // SECURITY FIX: Use client-provided idempotency key if available, otherwise generate one
    // Client-generated keys provide better duplicate prevention for rapid clicks
    const idempotencyKey =
      dto.idempotencyKey ||
      `PURCHASE_${payerId}_${dto.teacherId}_${dto.subjectId}_${dto.tierId}_${Date.now()}`;

    return this.packageService.purchasePackage(
      payerId,
      dto.studentId,
      dto.teacherId,
      dto.subjectId,
      dto.tierId,
      idempotencyKey,
    );
  }

  // =====================================================
  // PARENT/STUDENT: Get my packages
  // =====================================================

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  async getMyPackages(@Req() req: any) {
    // Get packages where user is either payer or student
    const userId = req.user.userId;
    return this.packageService.getStudentPackages(userId);
  }

  // =====================================================
  // TEACHER: Get packages for this teacher (must be before :id)
  // =====================================================

  @Get('teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async getTeacherPackages(@Req() req: any) {
    const teacher_profiles = await this.getTeacherProfile(req.user.userId);
    return this.packageService.getTeacherPackages(teacher_profiles.id);
  }

  // =====================================================
  // TEACHER: Get available package tiers
  // =====================================================

  @Get('teacher/tiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async getTeacherTiers() {
    // Returns all available tier options (session counts and discounts)
    return this.packageService.getAllTiers();
  }

  // =====================================================
  // TEACHER: Update tier active status for their account
  // =====================================================

  @Patch('teacher/tiers/:tierId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async updateTeacherTierStatus(
    @Req() req: any,
    @Param('tierId') tierId: string,
    @Body() dto: { isEnabled: boolean },
  ) {
    // SECURITY FIX: Teachers can only toggle their OWN tier preferences
    // This updates TeacherPackageTierSetting, NOT the global PackageTier
    const teacher_profiles = await this.getTeacherProfile(req.user.userId);

    return this.packageService.updateTeacherTierSetting(
      teacher_profiles.id,
      tierId,
      { isEnabled: dto.isEnabled },
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT, UserRole.ADMIN, UserRole.TEACHER)
  async getPackageById(@Req() req: any, @Param('id') id: string) {
    const pkg = await this.packageService.getPackageById(id);
    const userId = req.user.userId;
    const userRole = req.user.role;

    // SECURITY FIX: Verify ownership before returning package details
    // Admins can view all packages
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return pkg;
    }

    // Teachers can only view packages where they are the teacher
    if (userRole === 'TEACHER') {
      const teacher_profiles = await this.getTeacherProfile(userId);
      if (pkg.teacherId !== teacher_profiles.id) {
        throw new ForbiddenException(
          'You are not authorized to view this package',
        );
      }
      return pkg;
    }

    // Parents/Students can only view packages where they are payer or student
    if (pkg.payerId !== userId && pkg.studentId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view this package',
      );
    }

    return pkg;
  }

  // =====================================================
  // PARENT/STUDENT: Schedule a session from package
  // =====================================================

  @Post(':id/schedule-session')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  async scheduleSession(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: { startTime: string; endTime: string; timezone: string },
  ) {
    const userId = req.user.userId;
    const idempotencyKey = `SCHEDULE_${id}_${dto.startTime}_${Date.now()}`;
    return this.packageService.schedulePackageSession(
      id,
      userId,
      new Date(dto.startTime),
      new Date(dto.endTime),
      dto.timezone,
      idempotencyKey,
    );
  }

  // =====================================================
  // PARENT/STUDENT: Cancel package
  // =====================================================

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard)
  async checkDemoEligibility(
    @Req() req: any,
    @Param('teacherId') teacherId: string,
  ) {
    const studentId = req.user.userId;
    return this.demoService.canBookDemo(studentId, teacherId);
  }

  // =====================================================
  // DEMO: Check if teacher has demo enabled (public)
  // =====================================================

  @Get('demo/teacher/:teacherId')
  @Public() // SECURITY: Public endpoint - guests can check if teacher offers demos
  async isTeacherDemoEnabled(@Param('teacherId') teacherId: string) {
    const enabled = await this.demoService.isTeacherDemoEnabled(teacherId);
    return { demoEnabled: enabled };
  }

  @Get('settings/teacher/:teacherId')
  @Public()
  async getTeacherSettings(@Param('teacherId') teacherId: string) {
    const settings = await this.demoService.getDemoSettings(teacherId);
    return {
      demoEnabled: settings?.demoEnabled ?? false,
      packagesEnabled: settings?.packagesEnabled ?? true,
    };
  }

  // =====================================================
  // TEACHER: Update demo settings
  // =====================================================

  @Post('demo/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async updateDemoSettings(
    @Req() req: any,
    @Body() dto: UpdateDemoSettingsDto,
  ) {
    const teacher_profiles = await this.getTeacherProfile(req.user.userId);
    return this.demoService.updateDemoSettings(
      teacher_profiles.id,
      dto.demoEnabled,
    );
  }

  @Get('demo/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async getDemoSettings(@Req() req: any) {
    const teacher_profiles = await this.getTeacherProfile(req.user.userId);
    return this.demoService.getDemoSettings(teacher_profiles.id);
  }

  // =====================================================
  // SMART PACK: Purchase with Recurring Pattern
  // =====================================================

  @Post('smart-pack/purchase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  async purchaseSmartPack(@Req() req: any, @Body() dto: PurchaseSmartPackDto) {
    // payerId is always the logged-in user (who pays)
    const payerId = req.user.userId;

    // For students, they are both payer and beneficiary
    // For parents, studentId should be provided (their child's ID)
    const studentId =
      req.user.role === 'STUDENT' ? req.user.userId : dto.studentId;

    return this.packageService.purchaseSmartPackage({
      ...dto,
      studentId,
      payerId, // Add payerId for wallet operations
    });
  }

  // =====================================================
  // SMART PACK: Check Recurring Availability (Legacy - Single Pattern)
  // =====================================================

  @Post('smart-pack/check-availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async checkRecurringAvailability(@Body() dto: CheckRecurringAvailabilityDto) {
    return this.packageService.checkRecurringAvailability(dto);
  }

  // =====================================================
  // SMART PACK: Check Multi-Slot Availability (NEW)
  // Supports 1-4 weekly patterns for faster package completion
  // =====================================================

  @Post('smart-pack/check-multi-slot-availability')
  @Public() // SECURITY: Public endpoint - guests can check availability before logging in
  async checkMultiSlotAvailability(@Body() dto: CheckMultiSlotAvailabilityDto) {
    return this.packageService.checkMultiSlotAvailability(dto);
  }

  // =====================================================
  // SMART PACK: Book Floating Session
  // =====================================================

  @Post('smart-pack/:packageId/book-floating')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.PARENT) // SECURITY FIX: Allow parents to book floating sessions for their children
  async bookFloatingSession(
    @Req() req: any,
    @Param('packageId') packageId: string,
    @Body() dto: BookFloatingSessionDto,
  ) {
    return this.packageService.bookFloatingSession(
      packageId,
      req.user.userId,
      dto,
    );
  }

  // =====================================================
  // SMART PACK: Reschedule Package Session
  // =====================================================

  @Patch('smart-pack/bookings/:bookingId/reschedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.PARENT) // SECURITY FIX: Allow parents to reschedule sessions for their children
  async reschedulePackageSession(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: RescheduleSessionDto,
  ) {
    return this.packageService.reschedulePackageSession(
      bookingId,
      req.user.userId,
      dto,
    );
  }

  // Helper to get teacher profile ID from user ID
  private async getTeacherProfile(userId: string) {
    // Accessing prisma through packageService (which has it protected/publicly)
    // If it's not accessible, we can add a method to PackageService
    const profile = await (
      this.packageService as any
    ).prisma.teacher_profiles.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Teacher profile not found');
    return profile;
  }
}
