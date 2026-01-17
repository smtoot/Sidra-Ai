import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingErrorMessages } from './booking-error-messages';

@Injectable()
export class BookingUpdateService {
  constructor(private prisma: PrismaService) {}

  async updateTeacherNotes(
    teacherUserId: string,
    bookingId: string,
    dto: { teacherPrepNotes?: string; teacherSummary?: string },
  ) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { teacher_profiles: true },
    });

    if (!booking)
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);

    const teacherProfile = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacherProfile || booking.teacherId !== teacherProfile.id) {
      throw new ForbiddenException(
        'Not authorized to update notes for this session',
      );
    }

    return this.prisma.bookings.update({
      where: { id: bookingId },
      data: {
        teacherPrepNotes: dto.teacherPrepNotes,
        teacherSummary: dto.teacherSummary,
      },
    });
  }

  async updateMeetingLink(
    teacherUserId: string,
    bookingId: string,
    dto: { meetingLink: string },
  ) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { teacher_profiles: true },
    });

    if (!booking)
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);

    const teacherProfile = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacherProfile || booking.teacherId !== teacherProfile.id) {
      throw new ForbiddenException(
        'Not authorized to update meeting link for this session',
      );
    }

    const meetingLink = dto.meetingLink?.trim();

    if (meetingLink) {
      try {
        if (meetingLink.length > 2048) {
          throw new BadRequestException(
            'رابط الاجتماع طويل جداً. يرجى إدخال رابط صحيح.',
          );
        }

        const url = new URL(meetingLink);

        if (url.protocol !== 'https:') {
          throw new BadRequestException(
            'رابط الاجتماع يجب أن يبدأ بـ https://',
          );
        }

        if (!url.hostname) {
          throw new BadRequestException(
            BookingErrorMessages.INVALID_MEETING_LINK_FORMAT_AR,
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        throw new BadRequestException(
          BookingErrorMessages.INVALID_MEETING_LINK_FORMAT_EN,
        );
      }
    }

    return this.prisma.bookings.update({
      where: { id: bookingId },
      data: {
        meetingLink: meetingLink || null,
      },
    });
  }
}
