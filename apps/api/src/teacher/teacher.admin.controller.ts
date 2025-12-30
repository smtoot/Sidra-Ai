import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@sidra/shared';

@Controller('admin/teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TeacherAdminController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get()
  getPendingTeachers(@Query('status') status: string) {
    // Currently ignoring status query as service fetches PENDING hardcoded
    // In future, pass status to service if needed
    return this.teacherService.getPendingTeachers();
  }

  @Patch(':id/verify')
  verifyTeacher(@Param('id') id: string) {
    return this.teacherService.verifyTeacher(id);
  }

  @Delete(':id/reject') // Using Delete as per service logic implementation
  rejectTeacher(@Param('id') id: string) {
    return this.teacherService.rejectTeacher(id);
  }
}
