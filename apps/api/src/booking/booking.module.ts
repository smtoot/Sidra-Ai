import { Module, forwardRef } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingCreationService } from './booking-creation.service';
import { BookingCancellationService } from './booking-cancellation.service';
import { BookingPaymentService } from './booking-payment.service';
import { BookingRescheduleService } from './booking-reschedule.service';
import { BookingCompletionService } from './booking-completion.service';
import { BookingSystemSettingsService } from './booking-system-settings.service';
import { BookingQueryService } from './booking-query.service';
import { BookingUpdateService } from './booking-update.service';
import { BookingRatingService } from './booking-rating.service';
import { BookingMeetingService } from './booking-meeting.service';
import { BookingCronService } from './booking-cron.service';
import { BookingService } from './booking.service';
import { EscrowSchedulerService } from './escrow-scheduler.service';
import { BookingStatusValidatorService } from './booking-status-validator.service';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';
import { PackageModule } from '../package/package.module';
import { ReadableIdModule } from '../common/readable-id/readable-id.module';
import { TeacherModule } from '../teacher/teacher.module';
import { AdminModule } from '../admin/admin.module';
import { JitsiModule } from '../jitsi/jitsi.module';

@Module({
  imports: [
    WalletModule,
    NotificationModule,
    PackageModule,
    ReadableIdModule,
    JitsiModule,
    forwardRef(() => TeacherModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [BookingController],
  providers: [
    BookingCreationService,
    BookingCancellationService,
    BookingPaymentService,
    BookingRescheduleService,
    BookingSystemSettingsService,
    BookingCompletionService,
    BookingQueryService,
    BookingUpdateService,
    BookingRatingService,
    BookingMeetingService,
    BookingCronService,
    BookingService,
    EscrowSchedulerService,
    BookingStatusValidatorService,
  ],
  exports: [BookingService],
})
export class BookingModule {}
