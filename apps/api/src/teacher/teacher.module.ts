import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { TeacherAdminController } from './teacher.admin.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Assuming path for PrismaModule
import { WalletModule } from '../wallet/wallet.module'; // Assuming path for WalletModule

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [TeacherController, TeacherAdminController],
  providers: [TeacherService],
})
export class TeacherModule { }
