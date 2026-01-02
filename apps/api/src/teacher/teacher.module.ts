import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { TeacherAdminController } from './teacher.admin.controller';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { WorkExperienceController } from './work-experience.controller';
import { WorkExperienceService } from './work-experience.service';
import { VacationScheduler } from './vacation.scheduler';
import { PrismaModule } from '../prisma/prisma.module'; // Assuming path for PrismaModule
import { WalletModule } from '../wallet/wallet.module'; // Assuming path for WalletModule
import { AdminModule } from '../admin/admin.module'; // Import AdminModule for SystemSettingsService
import { PackageModule } from '../package/package.module'; // Import PackageModule for Smart Pack settings
import { NotificationModule } from '../notification/notification.module'; // For vacation scheduler

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    AdminModule,
    PackageModule,
    NotificationModule,
  ],
  controllers: [
    TeacherController,
    TeacherAdminController,
    SkillsController,
    WorkExperienceController,
  ],
  providers: [
    TeacherService,
    SkillsService,
    WorkExperienceService,
    VacationScheduler,
  ],
})
export class TeacherModule {}
