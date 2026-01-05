import { Controller, Get, Param } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { Public } from '../auth/public.decorator';

@Public()
@Controller('curricula')
export class CurriculumController {
  constructor(private readonly curriculaService: CurriculumService) {}

  @Get()
  findAll() {
    return this.curriculaService.findAll();
  }

  @Get(':id/hierarchy')
  getHierarchy(@Param('id') id: string) {
    return this.curriculaService.getHierarchy(id);
  }
}
