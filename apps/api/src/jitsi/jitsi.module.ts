import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JitsiService } from './jitsi.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FeatureFlagModule } from '../feature-flag/feature-flag.module';

@Module({
  imports: [ConfigModule, PrismaModule, FeatureFlagModule],
  providers: [JitsiService],
  exports: [JitsiService],
})
export class JitsiModule {}
