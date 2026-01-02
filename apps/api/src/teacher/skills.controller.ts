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
import { SkillsService } from './skills.service';
import { CreateSkillDto, UpdateSkillDto, UserRole } from '@sidra/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApprovalGuard } from '../auth/approval.guard';

/**
 * Skills Controller
 * Manages teacher skills CRUD operations
 * Following same patterns as qualifications endpoints
 */
@Controller('teacher/skills')
@UseGuards(JwtAuthGuard, RolesGuard, ApprovalGuard)
@Roles(UserRole.TEACHER)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  /**
   * GET /teacher/skills
   * Get all skills for authenticated teacher
   * Sorted by: createdAt DESC
   */
  @Get()
  getSkills(@Request() req: any) {
    return this.skillsService.getSkills(req.user.userId);
  }

  /**
   * POST /teacher/skills
   * Add a new skill
   * Rate limited to prevent spam
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 skills per minute
  addSkill(@Request() req: any, @Body() dto: CreateSkillDto) {
    return this.skillsService.addSkill(req.user.userId, dto);
  }

  /**
   * PATCH /teacher/skills/:id
   * Update an existing skill
   */
  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 updates per minute
  updateSkill(
    @Request() req: any,
    @Param('id') skillId: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.skillsService.updateSkill(req.user.userId, skillId, dto);
  }

  /**
   * DELETE /teacher/skills/:id
   * Remove a skill
   */
  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 deletions per minute
  deleteSkill(@Request() req: any, @Param('id') skillId: string) {
    return this.skillsService.deleteSkill(req.user.userId, skillId);
  }
}
