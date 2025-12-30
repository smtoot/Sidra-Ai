import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@sidra/shared';

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('dashboard')
  getDashboardStats(@Request() req: any) {
    return this.studentService.getDashboardStats(req.user.userId);
  }

  @Get('profile')
  getProfile(@Request() req: any) {
    return this.studentService.getProfile(req.user.userId);
  }

  @Patch('profile')
  updateProfile(@Request() req: any, @Body() data: any) {
    return this.studentService.updateProfile(req.user.userId, data);
  }

  @Get('curricula')
  getCurricula() {
    return this.studentService.getCurricula();
  }
}
