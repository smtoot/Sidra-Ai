import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TeachingApproachService } from './teaching-approach.service';
import {
  CreateTagDto,
  UpdateTagDto,
  UpdateTeachingApproachDto,
} from './teaching-approach.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@sidra/shared';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachingApproachController {
  constructor(private readonly service: TeachingApproachService) {}

  // --- Admin Endpoints ---

  @Get('admin/tags')
  @Roles(UserRole.ADMIN)
  async getAllTags() {
    return this.service.findAllTags(true); // Include inactive
  }

  @Post('admin/tags')
  @Roles(UserRole.ADMIN)
  async createTag(@Body() dto: CreateTagDto) {
    return this.service.createTag(dto);
  }

  @Patch('admin/tags/:id')
  @Roles(UserRole.ADMIN)
  async updateTag(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.service.updateTag(id, dto);
  }

  @Delete('admin/tags/:id')
  @Roles(UserRole.ADMIN)
  async deleteTag(@Param('id') id: string) {
    return this.service.deleteTag(id);
  }

  // --- Teacher Endpoints ---

  @Get('teacher/me/teaching-approach-tags')
  @Roles(UserRole.TEACHER)
  async getTeacherAvailableTags() {
    return this.service.findAllTags(false); // Active only
  }

  @Patch('teacher/me/profile/teaching-approach')
  @Roles(UserRole.TEACHER)
  async updateTeachingApproach(
    @Request() req: any,
    @Body() dto: UpdateTeachingApproachDto,
  ) {
    return this.service.updateTeacherProfile(req.user.userId, dto);
  }
}
