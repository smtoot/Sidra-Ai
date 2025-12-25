import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { SlugService } from '../common/slug.service';
import {
  UpdateTeacherProfileDto,
  CreateTeacherSubjectDto,
  CreateAvailabilityDto,
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

  @Patch('me')
  updateProfile(@Request() req: any, @Body() dto: UpdateTeacherProfileDto) {
    return this.teacherService.updateProfile(req.user.userId, dto);
  }

  @Post('me/subjects')
  addSubject(@Request() req: any, @Body() dto: CreateTeacherSubjectDto) {
    return this.teacherService.addSubject(req.user.userId, dto);
  }

  @Delete('me/subjects/:id')
  removeSubject(@Request() req: any, @Param('id') id: string) {
    return this.teacherService.removeSubject(req.user.userId, id);
  }

  @Post('me/availability')
  @RequiresApproval()
  setAvailability(@Request() req: any, @Body() dto: CreateAvailabilityDto) {
    return this.teacherService.setAvailability(req.user.userId, dto);
  }

  @Post('me/availability/bulk')
  @RequiresApproval()
  setBulkAvailability(@Request() req: any, @Body() dto: { slots: CreateAvailabilityDto[] }) {
    return this.teacherService.replaceAvailability(req.user.userId, dto.slots);
  }

  @Delete('me/availability/:id')
  @RequiresApproval()
  removeAvailability(@Request() req: any, @Param('id') id: string) {
    return this.teacherService.removeAvailability(req.user.userId, id);
  }

  @Get('me/exceptions')
  getExceptions(@Request() req: any) {
    return this.teacherService.getExceptions(req.user.userId);
  }

  @Post('me/exceptions')
  @RequiresApproval()
  addException(@Request() req: any, @Body() dto: any) {
    return this.teacherService.addException(req.user.userId, dto);
  }

  @Delete('me/exceptions/:id')
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
  addDocument(
    @Request() req: any,
    @Body() dto: { type: string; fileKey: string; fileName: string }
  ) {
    return this.teacherService.addDocument(req.user.userId, dto);
  }

  @Delete('me/documents/:id')
  removeDocument(@Request() req: any, @Param('id') id: string) {
    return this.teacherService.removeDocument(req.user.userId, id);
  }

  // ============ Application Status ============

  @Get('me/application-status')
  getApplicationStatus(@Request() req: any) {
    return this.teacherService.getApplicationStatus(req.user.userId);
  }

  @Post('me/submit')
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
  async updateSlug(@Request() req: any, @Body() dto: { slug: string }) {
    const profile = await this.teacherService.getProfile(req.user.userId);
    return this.slugService.setTeacherSlug(profile.id, dto.slug, false);
  }

  /**
   * Confirm and lock slug (one-time action)
   */
  @Post('me/slug/confirm')
  async confirmSlug(@Request() req: any, @Body() dto: { slug: string }) {
    const profile = await this.teacherService.getProfile(req.user.userId);
    return this.slugService.setTeacherSlug(profile.id, dto.slug, true);
  }
}

