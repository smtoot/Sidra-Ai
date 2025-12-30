import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ParentService } from './parent.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@sidra/shared';

@Controller('parent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get('dashboard')
  getDashboardStats(@Request() req: any) {
    return this.parentService.getDashboardStats(req.user.userId);
  }

  @Get('profile')
  getProfile(@Request() req: any) {
    return this.parentService.getProfile(req.user.userId);
  }

  @Patch('profile')
  updateProfile(@Request() req: any, @Body() data: any) {
    return this.parentService.updateProfile(req.user.userId, data);
  }

  @Get('children')
  getChildren(@Request() req: any) {
    return this.parentService.getChildren(req.user.userId);
  }

  @Post('children')
  addChild(
    @Request() req: any,
    @Body()
    body: {
      name: string;
      gradeLevel: string;
      schoolName?: string;
      curriculumId?: string;
    },
  ) {
    return this.parentService.addChild(req.user.userId, body);
  }

  @Patch('children/:id')
  updateChild(
    @Request() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      gradeLevel?: string;
      schoolName?: string;
      curriculumId?: string;
    },
  ) {
    return this.parentService.updateChild(req.user.userId, id, body);
  }

  @Get('curricula')
  getCurricula() {
    return this.parentService.getCurricula();
  }
}
