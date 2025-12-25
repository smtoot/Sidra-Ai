import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuditService } from '../common/audit/audit.service';
import { SystemSettingsService } from './system-settings.service';
import { AdminController } from './admin.controller';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';
import { PackageModule } from '../package/package.module';

@Module({
    imports: [WalletModule, NotificationModule, PackageModule],
    controllers: [AdminController],
    providers: [AdminService, AuditService, SystemSettingsService],
})
export class AdminModule { }
