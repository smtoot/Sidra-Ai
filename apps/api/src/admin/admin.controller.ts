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
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  UserRole,
  CreatePackageTierDto,
  UpdatePackageTierDto,
  ProposeInterviewSlotsDto,
} from '@sidra/shared';
import { AuditService } from '../common/audit/audit.service';
import { SystemSettingsService } from './system-settings.service';
import { AuditAction } from '@prisma/client';
import { PackageService } from '../package/package.service';
import { LedgerAuditService } from '../wallet/ledger-audit.service';
import { EmailPreviewService } from '../notification/email-preview.service';

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
    private readonly ledgerAuditService: LedgerAuditService,
    private readonly emailPreviewService: EmailPreviewService,
  ) { }

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('analytics/financial')
  getFinancialAnalytics() {
    return this.adminService.getFinancialAnalytics();
  }

  // =================== ADVANCED ANALYTICS ===================

  /**
   * Get comprehensive student analytics with filtering
   * Filters: curriculum, grade, school, city, country, date range
   */
  @Get('analytics/students')
  getStudentAnalytics(
    @Query('curriculumId') curriculumId?: string,
    @Query('gradeLevel') gradeLevel?: string,
    @Query('schoolName') schoolName?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('hasBookings') hasBookings?: string,
    @Query('hasPackages') hasPackages?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getStudentAnalytics({
      curriculumId,
      gradeLevel,
      schoolName,
      city,
      country,
      hasBookings: hasBookings === 'true' ? true : hasBookings === 'false' ? false : undefined,
      hasPackages: hasPackages === 'true' ? true : hasPackages === 'false' ? false : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  /**
   * Get comprehensive teacher analytics with filtering
   * Filters: subject, curriculum, grade, application status, city, country, rating, experience
   */
  @Get('analytics/teachers')
  getTeacherAnalytics(
    @Query('subjectId') subjectId?: string,
    @Query('curriculumId') curriculumId?: string,
    @Query('gradeLevelId') gradeLevelId?: string,
    @Query('applicationStatus') applicationStatus?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('minRating') minRating?: string,
    @Query('minExperience') minExperience?: string,
    @Query('hasBookings') hasBookings?: string,
    @Query('isOnVacation') isOnVacation?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getTeacherAnalytics({
      subjectId,
      curriculumId,
      gradeLevelId,
      applicationStatus,
      city,
      country,
      minRating: minRating ? parseFloat(minRating) : undefined,
      minExperience: minExperience ? parseInt(minExperience) : undefined,
      hasBookings: hasBookings === 'true' ? true : hasBookings === 'false' ? false : undefined,
      isOnVacation: isOnVacation === 'true' ? true : isOnVacation === 'false' ? false : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  /**
   * Get comprehensive booking analytics with filtering
   * Filters: subject, curriculum, teacher, status, date range, price range
   */
  @Get('analytics/bookings')
  getBookingAnalytics(
    @Query('subjectId') subjectId?: string,
    @Query('curriculumId') curriculumId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
    @Query('beneficiaryType') beneficiaryType?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('hasRating') hasRating?: string,
    @Query('hasHomework') hasHomework?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    return this.adminService.getBookingAnalytics({
      subjectId,
      curriculumId,
      teacherId,
      status,
      beneficiaryType,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      hasRating: hasRating === 'true' ? true : hasRating === 'false' ? false : undefined,
      hasHomework: hasHomework === 'true' ? true : hasHomework === 'false' ? false : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      groupBy: groupBy as 'subject' | 'curriculum' | 'teacher' | 'status' | 'day' | 'week' | 'month' | undefined,
    });
  }

  /**
   * Get parent analytics with filtering
   * Filters: city, country, children count, bookings, packages
   */
  @Get('analytics/parents')
  getParentAnalytics(
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('minChildren') minChildren?: string,
    @Query('hasBookings') hasBookings?: string,
    @Query('hasPackages') hasPackages?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getParentAnalytics({
      city,
      country,
      minChildren: minChildren ? parseInt(minChildren) : undefined,
      hasBookings: hasBookings === 'true' ? true : hasBookings === 'false' ? false : undefined,
      hasPackages: hasPackages === 'true' ? true : hasPackages === 'false' ? false : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  /**
   * Get filter options (curricula, subjects, grades, cities) for analytics UI
   */
  @Get('analytics/filter-options')
  getAnalyticsFilterOptions() {
    return this.adminService.getAnalyticsFilterOptions();
  }

  /**
   * Export analytics data as CSV
   */
  @Get('analytics/export')
  async exportAnalytics(
    @Query('type') type: 'students' | 'teachers' | 'bookings' | 'parents',
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Query() filters: Record<string, string>,
  ) {
    return this.adminService.exportAnalytics(type, format, filters);
  }

  @Get('bookings')
  getAllBookings(@Query('status') status?: string) {
    return this.adminService.getAllBookings(status);
  }

  @Get('bookings/:id')
  getBooking(@Param('id') id: string) {
    return this.adminService.getBookingById(id);
  }

  @Patch('bookings/:id/cancel')
  cancelBooking(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { reason?: string },
  ) {
    return this.adminService.cancelBooking(id, req.user.userId, dto.reason);
  }

  @Post('bookings/:id/complete')
  completeBooking(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.adminService.completeBooking(id, req.user.userId);
  }

  @Patch('bookings/:id/reschedule')
  rescheduleBooking(
    @Param('id') id: string,
    @Body() dto: { newStartTime: string },
  ) {
    const date = new Date(dto.newStartTime);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    return this.adminService.rescheduleBooking(id, date);
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
      cancellationPolicies?: Record<string, unknown>; // JSON object for policy config
      jitsiConfig?: Record<string, unknown>; // JSON object for Jitsi config
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

  @Patch('teachers/:id/profile')
  updateTeacherProfile(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body()
    dto: {
      displayName?: string;
      fullName?: string;
      bio?: string;
      introVideoUrl?: string;
      whatsappNumber?: string;
      city?: string;
      country?: string;
    },
  ) {
    return this.adminService.updateTeacherProfile(req.user.userId, id, dto);
  }

  @Post('teacher-applications/:id/propose-interview-slots')
  proposeInterviewSlots(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: ProposeInterviewSlotsDto,
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

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Delete('users/:id/permanent')
  hardDeleteUser(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.adminService.hardDeleteUser(req.user.userId, id);
  }

  // =================== LEDGER AUDIT ===================

  @Get('ledger-audit')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  getLedgerAudits(@Query('limit') limit?: string) {
    return this.ledgerAuditService.getRecentAudits(
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('ledger-audit/:id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  getLedgerAuditById(@Param('id') id: string) {
    return this.ledgerAuditService.getAuditById(id);
  }

  @Post('ledger-audit/run')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  runLedgerAudit() {
    return this.ledgerAuditService.runAudit();
  }

  @Patch('ledger-audit/:id/resolve')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  resolveLedgerAudit(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { note: string },
  ) {
    return this.ledgerAuditService.resolveAudit(id, req.user.userId, body.note);
  }

  // =================== WALLET MANAGEMENT ===================

  @Post('wallets/:userId/adjust')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  adjustWalletBalance(
    @Req() req: AuthRequest,
    @Param('userId') userId: string,
    @Body() body: { amount: number; reason: string; type: 'CREDIT' | 'DEBIT' },
  ) {
    return this.adminService.adjustWalletBalance(
      req.user.userId,
      userId,
      body.amount,
      body.reason,
      body.type,
    );
  }

  // =================== EMAIL PREVIEWS ===================

  @Get('emails/templates')
  getEmailTemplates() {
    return this.emailPreviewService.getAvailableTemplates();
  }

  @Get('emails/preview/:templateId')
  getEmailPreview(@Param('templateId') templateId: string) {
    return this.emailPreviewService.renderTemplate(templateId);
  }
}
