import { Module, forwardRef } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuditService } from '../common/audit/audit.service';
import { SystemSettingsService } from './system-settings.service';
import { AdminController } from './admin.controller';
import { AdminTeamController } from './admin-team.controller';
import { AdminTeamService } from './admin-team.service';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';
import { PackageModule } from '../package/package.module';
import { AuthModule } from '../auth/auth.module';
import { PublicSystemSettingsController } from './public-system-settings.controller';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [
    WalletModule,
    NotificationModule,
    PackageModule,
    AuthModule,
    forwardRef(() => BookingModule),
  ],
  controllers: [
    AdminController,
    AdminTeamController,
    PublicSystemSettingsController,
  ],
  providers: [
    AdminService,
    AuditService,
    SystemSettingsService,
    AdminTeamService,
  ],
  exports: [SystemSettingsService], // Export for use in other modules
})
export class AdminModule {}
