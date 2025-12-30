import { Module } from '@nestjs/common';
import { ReadableIdService } from './readable-id.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReadableIdService],
  exports: [ReadableIdService],
})
export class ReadableIdModule {}
