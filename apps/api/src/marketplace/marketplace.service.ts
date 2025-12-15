import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto, UpdateCurriculumDto, CreateSubjectDto, UpdateSubjectDto, SearchTeachersDto, DayOfWeek } from '@sidra/shared';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) { }

  // --- Search ---
  async searchTeachers(dto: SearchTeachersDto) {
    const whereClause: any = {};

    if (dto.subjectId) {
      whereClause.subjectId = dto.subjectId;
    }
    if (dto.curriculumId) {
      whereClause.curriculumId = dto.curriculumId;
    }
    if (dto.maxPrice) {
      whereClause.pricePerHour = { lte: dto.maxPrice };
    }

    // Find TeacherSubjects matching criteria
    const results = await this.prisma.teacherSubject.findMany({
      where: whereClause,
      include: {
        teacherProfile: true, // Includes basics like displayName, bio
        subject: true,
        curriculum: true,
      },
    });

    // Group by Teacher? Or list offers?
    // Marketplace usually lists "Offers" (Teacher X teaching Subject Y at Price Z)
    // So current flat list is fine.
    return results;
  }

  // --- Curricula ---
  async createCurriculum(dto: CreateCurriculumDto) {
    return this.prisma.curriculum.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAllCurricula(includeInactive = false) {
    return this.prisma.curriculum.findMany({
      where: includeInactive ? {} : { isActive: true },
    });
  }

  async findOneCurriculum(id: string) {
    const curr = await this.prisma.curriculum.findUnique({ where: { id } });
    if (!curr) throw new NotFoundException(`Curriculum with ID ${id} not found`);
    return curr;
  }

  async updateCurriculum(id: string, dto: UpdateCurriculumDto) {
    await this.findOneCurriculum(id); // Ensure exists
    return this.prisma.curriculum.update({
      where: { id },
      data: dto,
    });
  }

  async softDeleteCurriculum(id: string) {
    await this.findOneCurriculum(id);
    return this.prisma.curriculum.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // --- Subjects ---
  async createSubject(dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAllSubjects(includeInactive = false) {
    return this.prisma.subject.findMany({
      where: includeInactive ? {} : { isActive: true },
    });
  }

  async findOneSubject(id: string) {
    const sub = await this.prisma.subject.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException(`Subject with ID ${id} not found`);
    return sub;
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    await this.findOneSubject(id);
    return this.prisma.subject.update({
      where: { id },
      data: dto,
    });
  }

  async softDeleteSubject(id: string) {
    await this.findOneSubject(id);
    return this.prisma.subject.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // --- Teacher Availability ---

  async getTeacherAvailability(teacherId: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: {
        availability: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
        },
        availabilityExceptions: {
          where: {
            endDate: { gte: new Date() } // Only future/current exceptions
          },
          orderBy: { startDate: 'asc' }
        }
      }
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      weeklySchedule: teacher.availability,
      exceptions: teacher.availabilityExceptions
    };
  }

  async getAvailableSlots(teacherId: string, dateStr: string) {
    if (!dateStr) {
      throw new NotFoundException('Date query parameter is required');
    }

    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = this.getDayOfWeek(date);

    // 1. Get weekly recurring availability for this day
    const weeklySlots = await this.prisma.availability.findMany({
      where: {
        teacherId,
        dayOfWeek: dayOfWeek as DayOfWeek
      }
    });

    // 2. Check for exceptions on this specific date
    const exceptions = await this.prisma.availabilityException.findMany({
      where: {
        teacherId,
        startDate: { lte: date },
        endDate: { gte: date }
      }
    });

    // 3. Get existing bookings for this date
    const startOfDay = new Date(dateStr + 'T00:00:00');
    const endOfDay = new Date(dateStr + 'T23:59:59');

    const bookings = await this.prisma.booking.findMany({
      where: {
        teacherId: teacherId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { in: ['SCHEDULED', 'PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT'] as any }
      }
    });

    // 4. Calculate truly available slots
    return this.calculateAvailableSlots(weeklySlots, exceptions, bookings, dateStr);
  }

  private getDayOfWeek(date: Date): string {
    const dayMap: { [key: number]: string } = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY'
    };
    return dayMap[date.getDay()];
  }

  private calculateAvailableSlots(
    weeklySlots: any[],
    exceptions: any[],
    bookings: any[],
    dateStr: string
  ) {
    // Check for ALL_DAY exceptions first
    const hasAllDayException = exceptions.some(e => e.type === 'ALL_DAY');
    if (hasAllDayException) {
      return []; // Entire day blocked
    }

    // Convert weekly slots to hourly time strings
    let availableSlots: string[] = [];
    for (const slot of weeklySlots) {
      const slots = this.expandToHourlySlots(slot.startTime, slot.endTime);
      availableSlots = [...availableSlots, ...slots];
    }

    // Remove PARTIAL_DAY exception slots
    for (const exception of exceptions) {
      if (exception.type === 'PARTIAL_DAY' && exception.startTime && exception.endTime) {
        const blockedSlots = this.expandToHourlySlots(exception.startTime, exception.endTime);
        availableSlots = availableSlots.filter(slot => !blockedSlots.includes(slot));
      }
    }

    // Remove already booked slots
    for (const booking of bookings) {
      const bookingTime = booking.startTime.toTimeString().substring(0, 5); // "HH:MM"
      availableSlots = availableSlots.filter(slot => {
        const [slotHour] = slot.split(':');
        const [bookingHour] = bookingTime.split(':');
        return slotHour !== bookingHour;
      });
    }

    // Convert to display format (9:00 AM, 10:00 AM, etc.)
    return availableSlots.map(time => this.formatTimeSlot(time));
  }

  private expandToHourlySlots(startTime: string, endTime: string): string[] {
    const slots: string[] = [];
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    return slots;
  }

  private formatTimeSlot(time: string): string {
    const [hour] = time.split(':').map(Number);

    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  }
}
