import { Module } from '@nestjs/common';
import { TeachingApproachController } from './teaching-approach.controller';
import { TeachingApproachService } from './teaching-approach.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeachingApproachController],
  providers: [TeachingApproachService],
  exports: [TeachingApproachService],
})
export class TeachingApproachModule {}
