import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CreateCurriculumDto, UpdateCurriculumDto, CreateSubjectDto, UpdateSubjectDto, UserRole, SearchTeachersDto } from '@sidra/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) { }

  // --- Platform Configuration (Public) ---
  @Get('config')
  getPlatformConfig() {
    return this.marketplaceService.getPlatformConfig();
  }

  // --- Search ---
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

  @Get('curricula')
  findAllCurricula(@Query('all') all?: string) {
    // Public endpoint, but allow admin to filter
    // ideally we might want to check role here if 'all' is requested, but for MVP simpler:
    const includeInactive = all === 'true';
    return this.marketplaceService.findAllCurricula(includeInactive);
  }

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

  // --- Subjects ---

  @Post('subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createSubject(@Body() dto: CreateSubjectDto) {
    return this.marketplaceService.createSubject(dto);
  }

  @Get('subjects')
  findAllSubjects(@Query('all') all?: string) {
    const includeInactive = all === 'true';
    return this.marketplaceService.findAllSubjects(includeInactive);
  }

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

  // --- Educational Stages ---

  @Post('stages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createStage(@Body() dto: { curriculumId: string; nameAr: string; nameEn: string; sequence: number }) {
    return this.marketplaceService.createStage(dto);
  }

  @Get('stages')
  findAllStages(@Query('curriculumId') curriculumId?: string, @Query('all') all?: string) {
    const includeInactive = all === 'true';
    return this.marketplaceService.findAllStages(curriculumId, includeInactive);
  }

  @Get('stages/:id')
  findOneStage(@Param('id') id: string) {
    return this.marketplaceService.findOneStage(id);
  }

  @Patch('stages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStage(@Param('id') id: string, @Body() dto: { nameAr?: string; nameEn?: string; sequence?: number; isActive?: boolean }) {
    return this.marketplaceService.updateStage(id, dto);
  }

  @Delete('stages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeStage(@Param('id') id: string) {
    return this.marketplaceService.softDeleteStage(id);
  }

  // --- Grade Levels ---

  @Post('grades')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createGrade(@Body() dto: { stageId: string; nameAr: string; nameEn: string; code: string; sequence: number }) {
    return this.marketplaceService.createGrade(dto);
  }

  @Get('grades')
  findAllGrades(@Query('stageId') stageId?: string, @Query('all') all?: string) {
    const includeInactive = all === 'true';
    return this.marketplaceService.findAllGrades(stageId, includeInactive);
  }

  @Get('grades/:id')
  findOneGrade(@Param('id') id: string) {
    return this.marketplaceService.findOneGrade(id);
  }

  @Patch('grades/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateGrade(@Param('id') id: string, @Body() dto: { nameAr?: string; nameEn?: string; code?: string; sequence?: number; isActive?: boolean }) {
    return this.marketplaceService.updateGrade(id, dto);
  }

  @Delete('grades/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeGrade(@Param('id') id: string) {
    return this.marketplaceService.softDeleteGrade(id);
  }

  // --- Teacher Public Profile ---

  @Get('teachers/:teacherId/profile')
  getTeacherPublicProfile(@Param('teacherId') teacherId: string) {
    return this.marketplaceService.getTeacherPublicProfile(teacherId);
  }

  @Get('teachers/:teacherId/availability')
  getTeacherAvailability(@Param('teacherId') teacherId: string) {
    return this.marketplaceService.getTeacherAvailability(teacherId);
  }

  @Get('teachers/:teacherId/available-slots')
  getAvailableSlots(
    @Param('teacherId') teacherId: string,
    @Query('date') dateStr: string,
    @Query('userTimezone') userTimezone?: string
  ) {
    return this.marketplaceService.getAvailableSlots(teacherId, dateStr, userTimezone);
  }

  @Get('teachers/:teacherId/ratings')
  getTeacherRatings(
    @Param('teacherId') teacherId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.marketplaceService.getTeacherRatings(
      teacherId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10
    );
  }
}
