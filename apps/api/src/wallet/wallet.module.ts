import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { NotificationModule } from '../notification/notification.module';
import { ReadableIdModule } from '../common/readable-id/readable-id.module';

@Module({
    imports: [NotificationModule, ReadableIdModule],
    controllers: [WalletController],
    providers: [WalletService],
    exports: [WalletService],
})
export class WalletModule { }
