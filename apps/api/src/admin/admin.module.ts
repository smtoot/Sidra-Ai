import { Module } from '@nestjs/common';
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

@Module({
    imports: [WalletModule, NotificationModule, PackageModule, AuthModule],
    controllers: [AdminController, AdminTeamController],
    providers: [AdminService, AuditService, SystemSettingsService, AdminTeamService],
    exports: [SystemSettingsService], // Export for use in other modules
})
export class AdminModule { }

