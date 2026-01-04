import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { LedgerAuditService } from './ledger-audit.service';
import { NotificationModule } from '../notification/notification.module';
import { ReadableIdModule } from '../common/readable-id/readable-id.module';

@Module({
  imports: [NotificationModule, ReadableIdModule],
  controllers: [WalletController],
  providers: [WalletService, LedgerAuditService],
  exports: [WalletService, LedgerAuditService],
})
export class WalletModule {}
