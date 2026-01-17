import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from '@sidra/shared';
import { BookingErrorMessages } from './booking-error-messages';

@Injectable()
export class BookingRatingService {
  constructor(private prisma: PrismaService) {}

  async rateBooking(userId: string, bookingId: string, dto: CreateRatingDto) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.bookings.findUnique({
        where: { id: bookingId },
        include: {
          ratings: true,
          teacher_profiles: true,
        },
      });

      if (!booking) {
        throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
      }

      if (booking.status !== 'COMPLETED') {
        throw new ConflictException('يمكنك التقييم فقط بعد اكتمال الجلسة');
      }

      if (booking.bookedByUserId !== userId) {
        throw new ForbiddenException('لا يمكنك تقييم حجز لا يخصك');
      }

      if (booking.ratings) {
        throw new ConflictException('لقد قمت بتقييم هذه الجلسة مسبقاً');
      }

      const rating = await tx.ratings.create({
        data: {
          id: crypto.randomUUID(),
          bookingId,
          teacherId: booking.teacherId,
          ratedByUserId: userId,
          score: dto.score,
          comment: dto.comment || null,
        },
      });

      const currentAvg = booking.teacher_profiles.averageRating;
      const currentCount = booking.teacher_profiles.totalReviews;
      const newCount = currentCount + 1;
      const newAverage = (currentAvg * currentCount + dto.score) / newCount;
      const roundedAverage = Math.round(newAverage * 100) / 100;

      await tx.teacher_profiles.update({
        where: { id: booking.teacherId },
        data: {
          averageRating: roundedAverage,
          totalReviews: newCount,
        },
      });

      return rating;
    });
  }
}
