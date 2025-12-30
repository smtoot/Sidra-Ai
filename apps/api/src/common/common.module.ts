import { Module, Global } from '@nestjs/common';
import { ReadableIdService } from './readable-id.service';
import { SlugService } from './slug.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [ReadableIdService, SlugService],
  exports: [ReadableIdService, SlugService],
})
export class CommonModule {}
