import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { CurriculumService } from './curriculum.service';
import { CurriculumController } from './curriculum.controller';

@Module({
  controllers: [MarketplaceController, CurriculumController],
  providers: [MarketplaceService, CurriculumService],
})
export class MarketplaceModule { }
