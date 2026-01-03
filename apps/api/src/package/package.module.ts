import { Module, forwardRef } from '@nestjs/common';
import { TeacherModule } from '../teacher/teacher.module';
import { PackageService } from './package.service';
import { DemoService } from './demo.service';
import { PackageController } from './package.controller';
import { PackageScheduler } from './package.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ReadableIdModule } from '../common/readable-id/readable-id.module';

@Module({
  imports: [
    PrismaModule,
    ReadableIdModule,
    NotificationModule,
    forwardRef(() => TeacherModule),
  ],
  controllers: [PackageController],
  providers: [PackageService, DemoService, PackageScheduler],
  exports: [PackageService, DemoService],
})
export class PackageModule { }
