import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  UserRole,
  CreatePackageTierDto,
  UpdatePackageTierDto,
} from '@sidra/shared';
import { AuditService } from '../common/audit/audit.service';
import { SystemSettingsService } from './system-settings.service';
import { AuditAction } from '@prisma/client';
import { PackageService } from '../package/package.service';

/**
 * Authenticated request interface for JWT-protected endpoints
 */
interface AuthRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly settingsService: SystemSettingsService,
    private readonly auditService: AuditService,
    private readonly packageService: PackageService,
  ) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('analytics/financial')
  getFinancialAnalytics() {
    return this.adminService.getFinancialAnalytics();
  }

  @Get('bookings')
  getAllBookings(@Query('status') status?: string) {
    return this.adminService.getAllBookings(status);
  }

  @Patch('bookings/:id/cancel')
  cancelBooking(@Param('id') id: string, @Body() dto: { reason?: string }) {
    return this.adminService.cancelBooking(id, dto.reason);
  }

  // =================== DISPUTE MANAGEMENT ===================

  @Get('disputes')
  getDisputes(@Query('status') status?: string) {
    return this.adminService.getDisputes(status);
  }

  @Get('disputes/:id')
  getDisputeById(@Param('id') id: string) {
    return this.adminService.getDisputeById(id);
  }

  @Patch('disputes/:id/resolve')
  resolveDispute(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body()
    dto: {
      resolutionType: 'DISMISSED' | 'TEACHER_WINS' | 'STUDENT_WINS' | 'SPLIT';
      resolutionNote: string;
      splitPercentage?: number;
    },
  ) {
    return this.adminService.resolveDispute(
      req.user.userId,
      id,
      dto.resolutionType,
      dto.resolutionNote,
      dto.splitPercentage,
    );
  }

  @Patch('disputes/:id/review')
  markDisputeUnderReview(@Param('id') id: string) {
    return this.adminService.markDisputeUnderReview(id);
  }

  // =================== SYSTEM SETTINGS ===================

  @Get('settings')
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch('settings')
  updateSettings(
    @Req() req: AuthRequest,
    @Body()
    dto: {
      platformFeePercent?: number;
      autoReleaseHours?: number;
      paymentWindowHours?: number;
      minHoursBeforeSession?: number;
      packagesEnabled?: boolean;
      demosEnabled?: boolean;
      maxPricePerHour?: number;
      defaultSessionDurationMinutes?: number;
      allowedSessionDurations?: number[];
      searchConfig?: Record<string, unknown>; // JSON object for dynamic search configuration
    },
  ) {
    return this.settingsService.updateSettings(req.user.userId, dto);
  }

  // =================== AUDIT LOGS ===================

  @Get('audit-logs')
  getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: AuditAction,
    @Query('actorId') actorId?: string,
  ) {
    return this.auditService.getLogs({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      action,
      actorId,
    });
  }

  // =================== TEACHER APPLICATION MANAGEMENT ===================

  @Get('teacher-applications')
  getTeacherApplications(@Query('status') status?: string) {
    return this.adminService.getTeacherApplications(status);
  }

  @Get('teacher-applications/:id')
  getTeacherApplication(@Param('id') id: string) {
    return this.adminService.getTeacherApplication(id);
  }

  @Patch('teacher-applications/:id/approve')
  approveApplication(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.adminService.approveApplication(req.user.userId, id);
  }

  @Patch('teacher-applications/:id/reject')
  rejectApplication(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { reason: string },
  ) {
    return this.adminService.rejectApplication(req.user.userId, id, dto.reason);
  }

  @Patch('teacher-applications/:id/request-changes')
  requestChanges(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { reason: string },
  ) {
    return this.adminService.requestChanges(req.user.userId, id, dto.reason);
  }

  @Post('teacher-applications/:id/propose-interview-slots')
  proposeInterviewSlots(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { timeSlots: { dateTime: string; meetingLink: string }[] },
  ) {
    return this.adminService.proposeInterviewSlots(
      req.user.userId,
      id,
      dto.timeSlots,
    );
  }

  @Get('teacher-applications/:id/interview-slots')
  getInterviewTimeSlots(@Param('id') id: string) {
    return this.adminService.getInterviewTimeSlots(id);
  }

  // =================== PASSWORD RECOVERY (ADMIN-ASSISTED) ===================

  @Patch('users/:id/reset-password')
  async resetUserPassword(
    @Req() req: AuthRequest,
    @Param('id') userId: string,
    @Body() dto: { temporaryPassword?: string; forceChange?: boolean },
  ) {
    return this.adminService.resetUserPassword(
      req.user.userId, // admin ID for audit
      userId,
      dto.temporaryPassword,
      dto.forceChange !== false, // Default: true
    );
  }

  // =================== PACKAGE TIER MANAGEMENT (Smart Pack) ===================

  @Get('package-tiers')
  getPackageTiers() {
    return this.packageService.getActiveTiers();
  }

  @Get('package-tiers/all')
  getAllPackageTiers() {
    return this.packageService.getAllTiers();
  }

  @Get('package-tiers/:id')
  getPackageTierById(@Param('id') id: string) {
    return this.packageService.getTierById(id);
  }

  @Post('package-tiers')
  createPackageTier(@Body() dto: CreatePackageTierDto) {
    return this.packageService.createTier(dto);
  }

  @Patch('package-tiers/:id')
  updatePackageTier(
    @Param('id') id: string,
    @Body() dto: UpdatePackageTierDto,
  ) {
    return this.packageService.updateTier(id, dto);
  }

  @Delete('package-tiers/:id')
  deletePackageTier(@Param('id') id: string) {
    return this.packageService.deleteTier(id);
  }

  @Get('package-stats')
  getPackageStats() {
    return this.packageService.getAdminStats();
  }

  // =================== STUDENT PACKAGES (Purchased Packages) ===================

  @Get('student-packages')
  async getAllStudentPackages(@Query('status') status?: string) {
    return this.packageService.getAllStudentPackages(status);
  }

  @Get('student-packages/:id')
  async getStudentPackageById(@Param('id') id: string) {
    return this.packageService.getPackageById(id);
  }

  // =================== USER MANAGEMENT ===================

  @Get('users')
  getAllUsers(@Query('role') role?: string, @Query('search') search?: string) {
    return this.adminService.getAllUsers(role, search);
  }

  @Delete('users/:id/permanent')
  hardDeleteUser(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.adminService.hardDeleteUser(req.user.userId, id);
  }
}
