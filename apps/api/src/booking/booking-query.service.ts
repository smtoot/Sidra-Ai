import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingErrorMessages } from './booking-error-messages';

@Injectable()
export class BookingQueryService {
  constructor(private prisma: PrismaService) {}

  private redactUserPII(user: any) {
    if (!user) return user;
    const { email, phoneNumber, ...rest } = user;
    return rest;
  }

  private transformBooking(booking: any) {
    if (!booking) return null;

    const transformed = {
      ...booking,
      teacherProfile: booking.teacher_profiles
        ? {
            ...booking.teacher_profiles,
            user: this.redactUserPII(booking.teacher_profiles.users),
          }
        : undefined,
      bookedByUser: this.redactUserPII(
        booking.users_bookings_bookedByUserIdTousers,
      ),
      studentUser: booking.users_bookings_studentUserIdTousers
        ? {
            ...this.redactUserPII(booking.users_bookings_studentUserIdTousers),
            studentProfile: booking.users_bookings_studentUserIdTousers
              .student_profiles
              ? {
                  ...booking.users_bookings_studentUserIdTousers
                    .student_profiles,
                  curriculum:
                    booking.users_bookings_studentUserIdTousers.student_profiles
                      .curricula,
                }
              : undefined,
          }
        : undefined,
      child: booking.children
        ? {
            ...booking.children,
            curriculum: booking.children.curricula,
          }
        : undefined,
      subject: booking.subjects,
      jitsiEnabled: !!booking.jitsiEnabled,
    };

    return transformed;
  }

  async getTeacherRequests(teacherUserId: string) {
    const teacherProfile = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacherProfile)
      throw new NotFoundException('Teacher profile not found');

    const bookings = await this.prisma.bookings.findMany({
      where: {
        teacherId: teacherProfile.id,
        status: 'PENDING_TEACHER_APPROVAL',
      },
      include: {
        users_bookings_bookedByUserIdTousers: {
          include: { parent_profiles: { include: { users: true } } },
        },
        users_bookings_studentUserIdTousers: {
          include: { student_profiles: { include: { curricula: true } } },
        },
        subjects: true,
        children: { include: { curricula: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return bookings.map((b) => this.transformBooking(b));
  }

  async getTeacherRequestsCount(teacherUserId: string): Promise<number> {
    const teacherProfile = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });

    if (!teacherProfile)
      throw new NotFoundException('Teacher profile not found');

    return this.prisma.bookings.count({
      where: {
        teacherId: teacherProfile.id,
        status: 'PENDING_TEACHER_APPROVAL',
      },
    });
  }

  async getTeacherSessions(teacherUserId: string) {
    const teacherProfile = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacherProfile)
      throw new NotFoundException('Teacher profile not found');

    const bookings = await this.prisma.bookings.findMany({
      where: { teacherId: teacherProfile.id },
      include: {
        users_bookings_bookedByUserIdTousers: {
          include: { parent_profiles: { include: { users: true } } },
        },
        users_bookings_studentUserIdTousers: {
          include: { student_profiles: { include: { curricula: true } } },
        },
        subjects: true,
        children: { include: { curricula: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    return bookings.map((b) => this.transformBooking(b));
  }

  async getAllTeacherBookings(
    teacherUserId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const teacherProfile = await this.prisma.teacher_profiles.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacherProfile)
      throw new NotFoundException('Teacher profile not found');

    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const total = await this.prisma.bookings.count({
      where: { teacherId: teacherProfile.id },
    });

    const bookings = await this.prisma.bookings.findMany({
      where: { teacherId: teacherProfile.id },
      include: {
        users_bookings_bookedByUserIdTousers: {
          include: { parent_profiles: { include: { users: true } } },
        },
        users_bookings_studentUserIdTousers: {
          include: { student_profiles: { include: { curricula: true } } },
        },
        subjects: true,
        children: { include: { curricula: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    });

    const pendingTierIds = [
      ...new Set(
        bookings.map((b) => b.pendingTierId).filter((id): id is string => !!id),
      ),
    ];

    const tiers =
      pendingTierIds.length > 0
        ? await this.prisma.package_tiers.findMany({
            where: { id: { in: pendingTierIds } },
          })
        : [];

    const tierMap = new Map(tiers.map((t) => [t.id, t.sessionCount]));

    const enrichedBookings = bookings.map((booking) => {
      const enriched = {
        ...booking,
        pendingTierSessionCount: booking.pendingTierId
          ? tierMap.get(booking.pendingTierId) || null
          : null,
        isDemo: Number(booking.price) === 0,
      };
      return this.transformBooking(enriched);
    });

    return {
      data: enrichedBookings,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getParentBookings(
    parentUserId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const parentProfile = await this.prisma.parent_profiles.findUnique({
      where: { userId: parentUserId },
    });

    if (!parentProfile) throw new NotFoundException('Parent profile not found');

    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const total = await this.prisma.bookings.count({
      where: { bookedByUserId: parentUserId },
    });

    const bookings = await this.prisma.bookings.findMany({
      where: { bookedByUserId: parentUserId },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: {
          include: { parent_profiles: { include: { users: true } } },
        },
        users_bookings_studentUserIdTousers: true,
        subjects: true,
        children: true,
        ratings: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    });

    const pendingTierIds = [
      ...new Set(
        bookings.map((b) => b.pendingTierId).filter((id): id is string => !!id),
      ),
    ];

    const tiers =
      pendingTierIds.length > 0
        ? await this.prisma.package_tiers.findMany({
            where: { id: { in: pendingTierIds } },
          })
        : [];

    const tierMap = new Map(tiers.map((t) => [t.id, t.sessionCount]));

    const enrichedBookings = bookings.map((booking) => {
      const enriched = {
        ...booking,
        pendingTierSessionCount: booking.pendingTierId
          ? tierMap.get(booking.pendingTierId) || null
          : null,
      };
      return this.transformBooking(enriched);
    });

    return {
      data: enrichedBookings,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getStudentBookings(studentUserId: string) {
    const studentProfile = await this.prisma.student_profiles.findUnique({
      where: { userId: studentUserId },
    });

    if (!studentProfile)
      throw new NotFoundException('Student profile not found');

    const bookings = await this.prisma.bookings.findMany({
      where: { bookedByUserId: studentUserId },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: true,
        subjects: true,
        ratings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => this.transformBooking(b));
  }

  async getBookingById(userId: string, userRole: string, bookingId: string) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        teacher_profiles: { include: { users: true } },
        users_bookings_bookedByUserIdTousers: true,
        users_bookings_studentUserIdTousers: true,
        subjects: true,
        children: true,
      },
    });

    if (!booking)
      throw new NotFoundException(BookingErrorMessages.BOOKING_NOT_FOUND);

    if (userRole === 'TEACHER') {
      const teacherProfile = await this.prisma.teacher_profiles.findUnique({
        where: { userId },
      });
      if (!teacherProfile || booking.teacherId !== teacherProfile.id) {
        throw new ForbiddenException('Not authorized to view this booking');
      }
    } else if (userRole === 'PARENT' || userRole === 'STUDENT') {
      if (booking.bookedByUserId !== userId) {
        throw new ForbiddenException('Not authorized to view this booking');
      }
    } else if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to view bookings');
    }

    return this.transformBooking(booking);
  }
}
