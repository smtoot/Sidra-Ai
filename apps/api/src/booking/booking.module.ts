import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { EscrowSchedulerService } from './escrow-scheduler.service';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';
import { PackageModule } from '../package/package.module';
import { ReadableIdModule } from '../common/readable-id/readable-id.module';

@Module({
  imports: [WalletModule, NotificationModule, PackageModule, ReadableIdModule],
  controllers: [BookingController],
  providers: [BookingService, EscrowSchedulerService],
  exports: [BookingService],
})
export class BookingModule {}
