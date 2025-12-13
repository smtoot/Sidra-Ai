import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CreateCurriculumDto, UpdateCurriculumDto, CreateSubjectDto, UpdateSubjectDto, UserRole, SearchTeachersDto } from '@sidra/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) { }

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
}
