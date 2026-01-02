import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WorkExperienceService } from './work-experience.service';
import {
  CreateWorkExperienceDto,
  UpdateWorkExperienceDto,
  UserRole,
} from '@sidra/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApprovalGuard } from '../auth/approval.guard';

/**
 * Work Experience Controller
 * Manages teacher work experience CRUD operations
 * Following same patterns as qualifications endpoints
 */
@Controller('teacher/work-experiences')
@UseGuards(JwtAuthGuard, RolesGuard, ApprovalGuard)
@Roles(UserRole.TEACHER)
export class WorkExperienceController {
  constructor(
    private readonly workExperienceService: WorkExperienceService,
  ) {}

  /**
   * GET /teacher/work-experiences
   * Get all work experiences for authenticated teacher
   * Sorted by: isCurrent DESC, startDate DESC, createdAt DESC
   */
  @Get()
  getWorkExperiences(@Request() req: any) {
    return this.workExperienceService.getWorkExperiences(req.user.userId);
  }

  /**
   * POST /teacher/work-experiences
   * Add a new work experience
   * Rate limited to prevent spam
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 experiences per minute
  addWorkExperience(
    @Request() req: any,
    @Body() dto: CreateWorkExperienceDto,
  ) {
    return this.workExperienceService.addWorkExperience(req.user.userId, dto);
  }

  /**
   * PATCH /teacher/work-experiences/:id
   * Update an existing work experience
   * Returns corrected values after auto-fix rules applied
   */
  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 updates per minute
  updateWorkExperience(
    @Request() req: any,
    @Param('id') experienceId: string,
    @Body() dto: UpdateWorkExperienceDto,
  ) {
    return this.workExperienceService.updateWorkExperience(
      req.user.userId,
      experienceId,
      dto,
    );
  }

  /**
   * DELETE /teacher/work-experiences/:id
   * Remove a work experience
   */
  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 deletions per minute
  deleteWorkExperience(
    @Request() req: any,
    @Param('id') experienceId: string,
  ) {
    return this.workExperienceService.deleteWorkExperience(
      req.user.userId,
      experienceId,
    );
  }
}
