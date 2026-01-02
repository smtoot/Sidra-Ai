import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import {
  CreateCurriculumDto,
  UpdateCurriculumDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  UserRole,
  SearchTeachersDto,
} from '@sidra/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) { }

  // --- Platform Configuration (Public) ---
  @Public()
  @Get('config')
  getPlatformConfig() {
    return this.marketplaceService.getPlatformConfig();
  }

  // --- Search ---
  @Public()
  @Get('teachers')
  searchTeachers(@Query() query: SearchTeachersDto) {
    return this.marketplaceService.searchTeachers(query);
  }

  // --- Curricula ---

  @Post('curricula')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createCurriculum(@Body() dto: CreateCurriculumDto) {
    return this.marketplaceService.createCurriculum(dto);
  }

  @Public()
  @Get('curricula')
  findAllCurricula(@Query('all') all?: string) {
    // Public endpoint, but allow admin to filter
    // ideally we might want to check role here if 'all' is requested, but for MVP simpler:
    const includeInactive = all === 'true';
    return this.marketplaceService.findAllCurricula(includeInactive);
  }

  @Public()
  @Get('curricula/:id')
  findOneCurriculum(@Param('id') id: string) {
    return this.marketplaceService.findOneCurriculum(id);
  }

  @Patch('curricula/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateCurriculum(@Param('id') id: string, @Body() dto: UpdateCurriculumDto) {
    return this.marketplaceService.updateCurriculum(id, dto);
  }

  @Delete('curricula/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeCurriculum(@Param('id') id: string) {
    return this.marketplaceService.softDeleteCurriculum(id);
  }

  @Delete('curricula/:id/permanent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  hardDeleteCurriculum(@Param('id') id: string) {
    return this.marketplaceService.hardDeleteCurriculum(id);
  }

  // --- Subjects ---

  @Post('subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createSubject(@Body() dto: CreateSubjectDto) {
    return this.marketplaceService.createSubject(dto);
  }

  @Public()
  @Get('subjects')
  findAllSubjects(@Query('all') all?: string) {
    const includeInactive = all === 'true';
    return this.marketplaceService.findAllSubjects(includeInactive);
  }

  @Public()
  @Get('subjects/:id')
  findOneSubject(@Param('id') id: string) {
    return this.marketplaceService.findOneSubject(id);
  }

  @Patch('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.marketplaceService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeSubject(@Param('id') id: string) {
    return this.marketplaceService.softDeleteSubject(id);
  }

  @Delete('subjects/:id/permanent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  hardDeleteSubject(@Param('id') id: string) {
    return this.marketplaceService.hardDeleteSubject(id);
  }

  // --- Educational Stages ---

  @Post('stages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createStage(
    @Body()
    dto: {
      curriculumId: string;
      nameAr: string;
      nameEn: string;
      sequence: number;
    },
  ) {
    return this.marketplaceService.createStage(dto);
  }

  @Public()
  @Get('stages')
  findAllStages(
    @Query('curriculumId') curriculumId?: string,
    @Query('all') all?: string,
  ) {
    const includeInactive = all === 'true';
    return this.marketplaceService.findAllStages(curriculumId, includeInactive);
  }

  @Public()
  @Get('stages/:id')
  findOneStage(@Param('id') id: string) {
    return this.marketplaceService.findOneStage(id);
  }

  @Patch('stages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStage(
    @Param('id') id: string,
    @Body()
    dto: {
      nameAr?: string;
      nameEn?: string;
      sequence?: number;
      isActive?: boolean;
    },
  ) {
    return this.marketplaceService.updateStage(id, dto);
  }

  @Delete('stages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeStage(@Param('id') id: string) {
    return this.marketplaceService.softDeleteStage(id);
  }

  @Delete('stages/:id/permanent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  hardDeleteStage(@Param('id') id: string) {
    return this.marketplaceService.hardDeleteStage(id);
  }

  // --- Grade Levels ---

  @Post('grades')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createGrade(
    @Body()
    dto: {
      stageId: string;
      nameAr: string;
      nameEn: string;
      code: string;
      sequence: number;
    },
  ) {
    return this.marketplaceService.createGrade(dto);
  }

  @Public()
  @Get('grades')
  findAllGrades(
    @Query('stageId') stageId?: string,
    @Query('all') all?: string,
  ) {
    const includeInactive = all === 'true';
    return this.marketplaceService.findAllGrades(stageId, includeInactive);
  }

  @Public()
  @Get('grades/:id')
  findOneGrade(@Param('id') id: string) {
    return this.marketplaceService.findOneGrade(id);
  }

  @Patch('grades/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateGrade(
    @Param('id') id: string,
    @Body()
    dto: {
      nameAr?: string;
      nameEn?: string;
      code?: string;
      sequence?: number;
      isActive?: boolean;
    },
  ) {
    return this.marketplaceService.updateGrade(id, dto);
  }

  @Delete('grades/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeGrade(@Param('id') id: string) {
    return this.marketplaceService.softDeleteGrade(id);
  }

  @Delete('grades/:id/permanent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  hardDeleteGrade(@Param('id') id: string) {
    return this.marketplaceService.hardDeleteGrade(id);
  }

  // --- Teacher Public Profile ---

  @Public()
  @Get('teachers/:teacherId/profile')
  getTeacherPublicProfile(@Param('teacherId') teacherId: string) {
    return this.marketplaceService.getTeacherPublicProfile(teacherId);
  }

  @Public()
  @Get('teachers/:teacherId/availability')
  getTeacherAvailability(@Param('teacherId') teacherId: string) {
    return this.marketplaceService.getTeacherAvailability(teacherId);
  }

  @Public()
  @Get('teachers/:teacherId/available-slots')
  getAvailableSlots(
    @Param('teacherId') teacherId: string,
    @Query('date') dateStr: string,
    @Query('userTimezone') userTimezone?: string,
  ) {
    return this.marketplaceService.getAvailableSlots(
      teacherId,
      dateStr,
      userTimezone,
    );
  }

  @Public()
  @Get('teachers/:teacherId/next-available')
  getNextAvailableSlot(@Param('teacherId') teacherId: string) {
    return this.marketplaceService.getNextAvailableSlot(teacherId);
  }

  @Public()
  @Get('teachers/:teacherId/availability-calendar')
  getAvailabilityCalendar(
    @Param('teacherId') teacherId: string,
    @Query('month') month: string,
  ) {
    return this.marketplaceService.getAvailabilityCalendar(teacherId, month);
  }

  @Public()
  @Get('teachers/:teacherId/availability/check-recurring')
  checkRecurringAvailability(
    @Param('teacherId') teacherId: string,
    @Query('weekday') weekday: string,
    @Query('time') time: string,
    @Query('sessionCount') sessionCount: string,
    @Query('duration') duration: string,
  ) {
    return this.marketplaceService.checkRecurringAvailability(
      teacherId,
      weekday,
      time,
      parseInt(sessionCount, 10),
      parseInt(duration, 10),
    );
  }

  @Public()
  @Get('teachers/:teacherId/ratings')
  getTeacherRatings(
    @Param('teacherId') teacherId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getTeacherRatings(
      teacherId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
