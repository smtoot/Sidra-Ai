import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingErrorMessages } from './booking-error-messages';

@Injectable()
export class BookingMeetingService {
  private readonly logger = new Logger(BookingMeetingService.name);

  constructor(private prisma: PrismaService) {}

  private getSafeDisplayName(user: any, fallback: string) {
    if (!user) return fallback;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.displayName || fallback;
  }

  async logMeetingEvent(
    userId: string,
    bookingId: string,
    eventType:
      | 'PARTICIPANT_JOINED'
      | 'PARTICIPANT_LEFT'
      | 'MEETING_STARTED'
      | 'MEETING_ENDED',
    metadata?: Record<string, any>,
  ) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: { teacher_profiles: true },
    });

    if (!booking) {
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);
    }

    const isTeacher = booking.teacher_profiles?.userId === userId;
    const isBooker = booking.bookedByUserId === userId;
    const isStudent = booking.studentUserId === userId;

    if (!isTeacher && !isBooker && !isStudent) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    let userRole: string;
    if (isTeacher) userRole = 'teacher';
    else if (isStudent) userRole = 'student';
    else userRole = 'parent';

    const event = await this.prisma.meeting_events.create({
      data: {
        bookingId,
        userId,
        eventType,
        userRole,
        metadata: metadata || {},
      },
    });

    this.logger.log(
      `Meeting event logged: ${eventType} by ${userRole} (${userId}) for booking ${bookingId}`,
    );

    return event;
  }

  async getMeetingEvents(bookingId: string) {
    const events = await this.prisma.meeting_events.findMany({
      where: { bookingId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return events.map((event) => ({
      id: event.id,
      bookingId: event.bookingId,
      userId: event.userId,
      userName: this.getSafeDisplayName(event.users, 'مستخدم'),
      userRole: event.userRole,
      eventType: event.eventType,
      metadata: event.metadata,
      createdAt: event.createdAt,
    }));
  }
}
