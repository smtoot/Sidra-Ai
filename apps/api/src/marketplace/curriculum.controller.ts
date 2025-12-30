import { Controller, Get, Param } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { Public } from '../auth/public.decorator';

@Public()
@Controller('curricula')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get()
  findAll() {
    return this.curriculumService.findAll();
  }

  @Get(':id/hierarchy')
  getHierarchy(@Param('id') id: string) {
    return this.curriculumService.getHierarchy(id);
  }
}
