import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TeacherService } from './teacher.service';
import { SlugService } from '../common/slug.service';
import {
  UpdateTeacherProfileDto,
  CreateTeacherSubjectDto,
  CreateAvailabilityDto,
  AcceptTermsDto,
  UserRole
} from '@sidra/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApprovalGuard } from '../auth/approval.guard';
import { RequiresApproval } from '../auth/requires-approval.decorator';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard, ApprovalGuard)
@Roles(UserRole.TEACHER)
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly slugService: SlugService,
  ) { }

  @Get('me')
  getProfile(@Request() req: any) {
    return this.teacherService.getProfile(req.user.userId);
  }

  @Get('dashboard')
  getDashboardStats(@Request() req: any) {
    return this.teacherService.getDashboardStats(req.user.userId);
  }

  // SECURITY: Rate limit profile updates to prevent abuse
  @Patch('me')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 updates per minute
  updateProfile(@Request() req: any, @Body() dto: UpdateTeacherProfileDto) {
    return this.teacherService.updateProfile(req.user.userId, dto);
  }

  // SECURITY: Rate limit subject additions to prevent spam
  @Post('me/subjects')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 subjects per minute
  addSubject(@Request() req: any, @Body() dto: CreateTeacherSubjectDto) {
    return this.teacherService.addSubject(req.user.userId, dto);
  }

  @Delete('me/subjects/:id')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 deletions per minute
  removeSubject(@Request() req: any, @Param('id') id: string) {
    return this.teacherService.removeSubject(req.user.userId, id);
  }

  // SECURITY: Rate limit availability changes to prevent excessive updates
  // Note: Higher limits because teachers need to set up full weekly schedules (7 days × multiple slots)
  @Post('me/availability')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 slots per minute (enough for full weekly setup)
  @RequiresApproval()
  setAvailability(@Request() req: any, @Body() dto: CreateAvailabilityDto) {
    return this.teacherService.setAvailability(req.user.userId, dto);
  }

  @Post('me/availability/bulk')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 bulk updates per minute (teachers may adjust multiple times)
  @RequiresApproval()
  setBulkAvailability(@Request() req: any, @Body() dto: { slots: CreateAvailabilityDto[] }) {
    return this.teacherService.replaceAvailability(req.user.userId, dto.slots);
  }

  @Delete('me/availability/:id')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 deletions per minute (clearing old schedule)
  @RequiresApproval()
  removeAvailability(@Request() req: any, @Param('id') id: string) {
    return this.teacherService.removeAvailability(req.user.userId, id);
  }

  @Get('me/exceptions')
  getExceptions(@Request() req: any) {
    return this.teacherService.getExceptions(req.user.userId);
  }

  @Post('me/exceptions')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 exceptions per minute
  @RequiresApproval()
  addException(@Request() req: any, @Body() dto: any) {
    return this.teacherService.addException(req.user.userId, dto);
  }

  @Delete('me/exceptions/:id')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 deletions per minute
  @RequiresApproval()
  removeException(@Request() req: any, @Param('id') id: string) {
    return this.teacherService.removeException(req.user.userId, id);
  }

  // ============ Document Management ============

  @Get('me/documents')
  getDocuments(@Request() req: any) {
    return this.teacherService.getDocuments(req.user.userId);
  }

  @Post('me/documents')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 document uploads per minute
  addDocument(
    @Request() req: any,
    @Body() dto: { type: string; fileKey: string; fileName: string }
  ) {
    return this.teacherService.addDocument(req.user.userId, dto);
  }

  @Delete('me/documents/:id')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 deletions per minute
  removeDocument(@Request() req: any, @Param('id') id: string) {
    return this.teacherService.removeDocument(req.user.userId, id);
  }

  // ============ Application Status ============

  @Get('me/application-status')
  getApplicationStatus(@Request() req: any) {
    return this.teacherService.getApplicationStatus(req.user.userId);
  }

  // SECURITY: Rate limit terms acceptance to prevent abuse
  @Post('me/accept-terms')
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 acceptances per hour
  acceptTerms(@Request() req: any, @Body() dto: AcceptTermsDto) {
    return this.teacherService.acceptTerms(req.user.userId, dto.termsVersion);
  }

  // SECURITY: Rate limit application submissions to prevent spam
  @Post('me/submit')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 submissions per hour
  submitForReview(@Request() req: any) {
    return this.teacherService.submitForReview(req.user.userId);
  }

  // ============ Slug Management ============

  /**
   * Get current slug info (slug, locked status, suggested slug)
   */
  @Get('me/slug')
  async getSlugInfo(@Request() req: any) {
    const profile = await this.teacherService.getProfile(req.user.userId);
    const suggestedSlug = profile.displayName
      ? await this.slugService.generateUniqueSlug(profile.displayName, profile.id)
      : null;

    return {
      slug: profile.slug,
      slugLockedAt: profile.slugLockedAt,
      isLocked: !!profile.slugLockedAt,
      suggestedSlug,
    };
  }

  /**
   * Check if a slug is available
   */
  @Get('me/slug/check')
  async checkSlugAvailability(@Request() req: any, @Query('slug') slug: string) {
    const profile = await this.teacherService.getProfile(req.user.userId);

    // Validate format
    const validation = this.slugService.validateSlug(slug);
    if (!validation.valid) {
      return { available: false, error: validation.error };
    }

    // Check availability
    const available = await this.slugService.isSlugAvailable(slug, profile.id);
    return { available, slug };
  }

  /**
   * Update slug (only if not locked)
   */
  @Patch('me/slug')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 slug updates per minute
  async updateSlug(@Request() req: any, @Body() dto: { slug: string }) {
    const profile = await this.teacherService.getProfile(req.user.userId);
    return this.slugService.setTeacherSlug(profile.id, dto.slug, false);
  }

  /**
   * Confirm and lock slug (one-time action)
   */
  @Post('me/slug/confirm')
  @Throttle({ default: { limit: 2, ttl: 3600000 } }) // 2 confirmations per hour (should only happen once)
  async confirmSlug(@Request() req: any, @Body() dto: { slug: string }) {
    const profile = await this.teacherService.getProfile(req.user.userId);
    return this.slugService.setTeacherSlug(profile.id, dto.slug, true);
  }
}

