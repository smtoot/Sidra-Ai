import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { TeacherAdminController } from './teacher.admin.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Assuming path for PrismaModule
import { WalletModule } from '../wallet/wallet.module'; // Assuming path for WalletModule
import { AdminModule } from '../admin/admin.module'; // Import AdminModule for SystemSettingsService

@Module({
  imports: [PrismaModule, WalletModule, AdminModule],
  controllers: [TeacherController, TeacherAdminController],
  providers: [TeacherService],
})
export class TeacherModule { }
