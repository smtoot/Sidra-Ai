import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notification/notification.service';
import { PackageService } from '../package/package.service';
import { BookingErrorMessages } from './booking-error-messages';
import { BookingStatusValidatorService } from './booking-status-validator.service';

@Injectable()
export class BookingPaymentService {
  private readonly logger = new Logger(BookingPaymentService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private packageService: PackageService,
    private bookingStatusValidator: BookingStatusValidatorService,
  ) {}

  async payForBooking(parentUserId: string, bookingId: string) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        users_bookings_bookedByUserIdTousers: {
          include: { parent_profiles: { include: { users: true } } },
        },
        teacher_profiles: { include: { users: true } },
        children: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
    }
    if (booking.users_bookings_bookedByUserIdTousers.id !== parentUserId) {
      throw new ForbiddenException(BookingErrorMessages.NOT_YOUR_BOOKING);
    }
    if (booking.status === 'SCHEDULED') return booking;
    if (booking.status !== 'WAITING_FOR_PAYMENT') {
      throw new BadRequestException(
        BookingErrorMessages.BOOKING_NOT_AWAITING_PAYMENT,
      );
    }
    this.bookingStatusValidator.validateTransition(booking.status, 'SCHEDULED');

    let updatedBooking: any;

    if (booking.pendingTierId) {
      this.logger.log(`Processing package purchase for booking ${bookingId}`);
      const studentId = booking.studentUserId || parentUserId;
      if (!studentId) throw new BadRequestException('Cannot determine student');

      try {
        const studentPackage = await this.packageService.purchasePackage(
          parentUserId,
          studentId,
          booking.teacherId,
          booking.subjectId,
          booking.pendingTierId,
          `pkgpurchase:${bookingId}`,
        );
        if (!studentPackage) {
          throw new BadRequestException('Package purchase failed');
        }

        await this.packageService.createRedemption(
          studentPackage.id,
          bookingId,
        );

        updatedBooking = await this.prisma.bookings.update({
          where: { id: bookingId },
          data: { pendingTierId: null, status: 'SCHEDULED' },
        });
      } catch (e: any) {
        this.logger.error('Package purchase failed', e);
        throw new BadRequestException(e.message || 'Failed package purchase');
      }
    } else {
      updatedBooking = await this.prisma.$transaction(
        async (tx) => {
          await this.walletService.lockFundsForBooking(
            parentUserId,
            bookingId,
            Number(booking.price),
            tx,
          );
          return tx.bookings.update({
            where: { id: bookingId, status: 'WAITING_FOR_PAYMENT' },
            data: { status: 'SCHEDULED' },
          });
        },
        { isolationLevel: 'Serializable' },
      );
    }

    const successTitle = 'تم الدفع بنجاح';
    const msg = booking.pendingTierId ? 'تم شراء الباقة.' : 'تم تأكيد الدفع.';

    await this.notificationService.notifyUser({
      userId: parentUserId,
      title: successTitle,
      message: msg,
      type: 'PAYMENT_SUCCESS',
      link: '/parent/bookings',
      dedupeKey: `PAYMENT_SUCCESS:${bookingId}:${parentUserId}`,
      metadata: { bookingId },
    });

    await this.notificationService.notifyUser({
      userId: booking.teacher_profiles.users.id,
      title: 'حجز جديد مؤكد',
      message: `تم تأكيد حجز جديد.`,
      type: 'PAYMENT_SUCCESS',
      link: '/teacher/sessions',
      dedupeKey: `PAYMENT_SUCCESS:${bookingId}:${booking.teacher_profiles.users.id}`,
      metadata: { bookingId },
    });

    return updatedBooking;
  }

  async releaseFundsOnCompletion(
    parentUserId: string,
    teacherUserId: string,
    bookingId: string,
    amount: number,
    commissionRate: number,
    tx?: Prisma.TransactionClient,
  ) {
    return this.walletService.releaseFundsOnCompletion(
      parentUserId,
      teacherUserId,
      bookingId,
      amount,
      commissionRate,
      tx,
    );
  }

  async settleCancellation(
    parentUserId: string,
    teacherUserId: string,
    bookingId: string,
    totalLockedAmount: number,
    refundAmount: number,
    teacherCompAmount: number,
    platformRevenue: number = 0,
    tx?: Prisma.TransactionClient,
  ) {
    return this.walletService.settleCancellation(
      parentUserId,
      teacherUserId,
      bookingId,
      totalLockedAmount,
      refundAmount,
      teacherCompAmount,
      platformRevenue,
      tx,
    );
  }
}
