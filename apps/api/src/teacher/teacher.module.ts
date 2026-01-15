import { Module, forwardRef } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { AvailabilitySlotService } from './availability-slot.service';
import { TeacherController } from './teacher.controller';
import { TeacherAdminController } from './teacher.admin.controller';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { WorkExperienceController } from './work-experience.controller';
import { WorkExperienceService } from './work-experience.service';
import { VacationScheduler } from './vacation.scheduler';
import { SlotScheduler } from './slots.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdminModule } from '../admin/admin.module';
import { PackageModule } from '../package/package.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    AdminModule,
    forwardRef(() => PackageModule),
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
    AvailabilitySlotService,
    SkillsService,
    WorkExperienceService,
    VacationScheduler,
    SlotScheduler,
  ],
  exports: [TeacherService, AvailabilitySlotService],
})
export class TeacherModule {}
