import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import {
  UpdateTeacherProfileDto,
  CreateTeacherSubjectDto,
  CreateAvailabilityDto,
  UserRole
} from '@sidra/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) { }

  @Get('me')
  getProfile(@Request() req: any) {
    return this.teacherService.getProfile(req.user.userId);
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
  setAvailability(@Request() req: any, @Body() dto: CreateAvailabilityDto) {
    return this.teacherService.setAvailability(req.user.userId, dto);
  }

  @Delete('me/availability/:id')
  removeAvailability(@Request() req: any, @Param('id') id: string) {
    return this.teacherService.removeAvailability(req.user.userId, id);
  }
}
