import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto, UpdateCurriculumDto, CreateSubjectDto, UpdateSubjectDto, SearchTeachersDto, DayOfWeek } from '@sidra/shared';
import { format } from 'date-fns';
import {
  buildUtcWindowForUserDate,
  getTeacherDatesInUtcWindow,
  parseTimeInTimezoneToUTC,
  formatInTimezone,
  SlotWithTimezone
} from '../common/utils/timezone.util';
import { toZonedTime } from 'date-fns-tz';

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
    if (dto.gradeLevelId) {
      whereClause.grades = {
        some: {
          gradeLevelId: dto.gradeLevelId
        }
      };
    }
    if (dto.maxPrice) {
      whereClause.pricePerHour = { lte: dto.maxPrice };
    }

    const results = await this.prisma.teacherSubject.findMany({
      where: whereClause,
      include: {
        teacherProfile: true,
        subject: true,
        curriculum: true,
      },
    });

    return results;
  }

  // --- Curricula ---
  async createCurriculum(dto: CreateCurriculumDto) {
    return this.prisma.curriculum.create({
      data: {
        code: dto.code,
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
    await this.findOneCurriculum(id);
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

  // --- Educational Stages ---
  async createStage(dto: { curriculumId: string; nameAr: string; nameEn: string; sequence: number }) {
    // Verify curriculum exists
    await this.findOneCurriculum(dto.curriculumId);
    return this.prisma.educationalStage.create({
      data: {
        curriculumId: dto.curriculumId,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        sequence: dto.sequence,
        isActive: true,
      },
    });
  }

  async findAllStages(curriculumId?: string, includeInactive = false) {
    const where: any = {};
    if (curriculumId) where.curriculumId = curriculumId;
    if (!includeInactive) where.isActive = true;

    return this.prisma.educationalStage.findMany({
      where,
      include: {
        curriculum: { select: { nameAr: true, nameEn: true } },
        grades: { orderBy: { sequence: 'asc' } }
      },
      orderBy: { sequence: 'asc' }
    });
  }

  async findOneStage(id: string) {
    const stage = await this.prisma.educationalStage.findUnique({
      where: { id },
      include: {
        curriculum: true,
        grades: { orderBy: { sequence: 'asc' } }
      }
    });
    if (!stage) throw new NotFoundException(`Stage with ID ${id} not found`);
    return stage;
  }

  async updateStage(id: string, dto: { nameAr?: string; nameEn?: string; sequence?: number; isActive?: boolean }) {
    await this.findOneStage(id);
    return this.prisma.educationalStage.update({
      where: { id },
      data: dto,
    });
  }

  async softDeleteStage(id: string) {
    await this.findOneStage(id);
    return this.prisma.educationalStage.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // --- Grade Levels ---
  async createGrade(dto: { stageId: string; nameAr: string; nameEn: string; code: string; sequence: number }) {
    // Verify stage exists
    await this.findOneStage(dto.stageId);
    return this.prisma.gradeLevel.create({
      data: {
        stageId: dto.stageId,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        code: dto.code,
        sequence: dto.sequence,
        isActive: true,
      },
    });
  }

  async findAllGrades(stageId?: string, includeInactive = false) {
    const where: any = {};
    if (stageId) where.stageId = stageId;
    if (!includeInactive) where.isActive = true;

    return this.prisma.gradeLevel.findMany({
      where,
      include: {
        stage: {
          include: { curriculum: { select: { nameAr: true, nameEn: true } } }
        }
      },
      orderBy: { sequence: 'asc' }
    });
  }

  async findOneGrade(id: string) {
    const grade = await this.prisma.gradeLevel.findUnique({
      where: { id },
      include: { stage: { include: { curriculum: true } } }
    });
    if (!grade) throw new NotFoundException(`Grade with ID ${id} not found`);
    return grade;
  }

  async updateGrade(id: string, dto: { nameAr?: string; nameEn?: string; code?: string; sequence?: number; isActive?: boolean }) {
    await this.findOneGrade(id);
    return this.prisma.gradeLevel.update({
      where: { id },
      data: dto,
    });
  }

  async softDeleteGrade(id: string) {
    await this.findOneGrade(id);
    return this.prisma.gradeLevel.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async getTeacherPublicProfile(idOrSlug: string) {
    // Determine if it's a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const teacher = await this.prisma.teacherProfile.findFirst({
      where: isUUID
        ? { id: idOrSlug }
        : { slug: idOrSlug },
      include: {
        user: {
          select: { email: true }
        },
        subjects: {
          include: {
            subject: { select: { id: true, nameAr: true, nameEn: true } },
            curriculum: { select: { id: true, nameAr: true, nameEn: true } },
            grades: {
              include: {
                gradeLevel: {
                  include: { stage: true }
                }
              }
            }
          }
        },
        teachingTags: {
          include: { tag: true },
          where: { tag: { isActive: true } }
        },
        availability: true,
        // Include demo settings
        demoSettings: true,
        studentPackages: {
          select: { id: true, tierId: true } as any
        }
      }
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Get completed sessions count
    const completedSessions = await this.prisma.booking.count({
      where: {
        teacherId: teacher.id,
        status: 'COMPLETED' as any
      }
    });

    // Get global system settings
    const systemSettings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });

    // Get teacher demo settings
    const teacherDemoSettings = await this.prisma.teacherDemoSettings.findUnique({
      where: { teacherId: teacher.id }
    });

    // Get active package tiers
    const packageTiers = await this.prisma.packageTier.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    return {
      id: teacher.id,
      userId: teacher.userId,
      displayName: teacher.displayName,
      profilePhotoUrl: teacher.profilePhotoUrl,
      introVideoUrl: teacher.introVideoUrl,
      bio: teacher.bio,
      education: teacher.education,
      yearsOfExperience: teacher.yearsOfExperience,
      gender: teacher.gender,
      averageRating: teacher.averageRating,
      totalReviews: teacher.totalReviews,
      totalSessions: completedSessions,
      timezone: teacher.timezone,
      globalSettings: {
        packagesEnabled: systemSettings?.packagesEnabled ?? true,
        demosEnabled: systemSettings?.demosEnabled ?? true,
      },
      teacherSettings: {
        demoEnabled: teacherDemoSettings?.demoEnabled ?? false,
      },
      packageTiers: packageTiers.map(t => ({
        id: t.id,
        sessionCount: t.sessionCount,
        discountPercent: Number(t.discountPercent),
      })),
      subjects: (teacher as any).subjects.map((s: any) => ({
        id: s.id,
        pricePerHour: s.pricePerHour.toString(),
        // Map structured grades to simplified codes/names for frontend
        grades: s.grades.map((g: any) => ({
          id: g.gradeLevel.id,
          nameAr: g.gradeLevel.nameAr,
          nameEn: g.gradeLevel.nameEn,
          code: g.gradeLevel.code,
          stageNameAr: g.gradeLevel.stage.nameAr,
          stageNameEn: g.gradeLevel.stage.nameEn
        })),
        gradeLevels: s.grades.map((g: any) => g.gradeLevel.code),
        subject: s.subject,
        curriculum: s.curriculum
      })),

      availability: (teacher as any).availability,
      applicationStatus: teacher.applicationStatus, // Verified Badge Source
      teachingApproach: ((teacher as any).teachingStyle || ((teacher as any).teachingTags && (teacher as any).teachingTags.length > 0)) ? {
        text: (teacher as any).teachingStyle,
        tags: (teacher as any).teachingTags?.map((tt: any) => ({
          id: tt.tag?.id,
          labelAr: tt.tag?.labelAr
        })) || []
      } : null
    };
  }

  // --- Teacher Availability (Public) ---
  async getTeacherAvailability(teacherId: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: {
        availability: true,
        availabilityExceptions: true
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

  // --- Teacher Ratings (Public) ---
  async getTeacherRatings(teacherId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await this.prisma.rating.count({
      where: {
        teacherId,
        isVisible: true
      }
    });

    // Get ratings with user info (for display name)
    const ratings = await this.prisma.rating.findMany({
      where: {
        teacherId,
        isVisible: true
      },
      include: {
        ratedByUser: {
          select: {
            id: true,
            role: true,
            parentProfile: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    return {
      ratings: ratings.map(r => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        // Show generic name for privacy
        raterType: r.ratedByUser.role === 'PARENT' ? 'ولي أمر' : 'طالب'
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  // ============================================================================
  // AVAILABLE SLOTS - UTC-FIRST ARCHITECTURE
  // ============================================================================

  /**
   * Get available slots for a teacher on a specific date.
   * 
   * Architecture: UTC-First
   * 1. Build UTC window for user's selected day
   * 2. Find which teacher-local days overlap with that window
   * 3. Generate slots from teacher's weekly availability
   * 4. Filter out exceptions and bookings (all in UTC)
   * 5. Return slots with startTimeUtc as canonical identifier
   *
   * @param teacherId Teacher's profile ID
   * @param dateStr User's selected date (YYYY-MM-DD) - interpreted in userTimezone
   * @param userTimezone User's IANA timezone (e.g., "Asia/Riyadh")
   */
  async getAvailableSlots(teacherId: string, dateStr: string, userTimezone?: string) {
    if (!dateStr) {
      throw new NotFoundException('Date query parameter is required');
    }

    // Step 1: Get teacher's timezone
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      select: { timezone: true }
    });
    const teacherTimezone = teacher?.timezone || 'UTC';

    // Default to teacher's timezone if user doesn't specify
    const effectiveUserTimezone = userTimezone || teacherTimezone;

    // Step 2: Build UTC window for user's selected day
    // This handles day boundaries correctly
    const utcWindow = buildUtcWindowForUserDate(dateStr, effectiveUserTimezone);

    // Step 3: Find which teacher-local dates we need to check
    // (The user's day might span multiple teacher days due to timezone difference)
    const teacherDates = getTeacherDatesInUtcWindow(utcWindow, teacherTimezone);

    // Step 4: Get teacher's weekly availability for all relevant days
    const allSlots: SlotWithTimezone[] = [];

    for (const teacherDateStr of teacherDates) {
      // Get day of week for this teacher date
      const teacherLocalDate = toZonedTime(new Date(teacherDateStr + 'T12:00:00Z'), teacherTimezone);
      const dayOfWeek = this.getDayOfWeek(teacherLocalDate);

      // Get weekly slots for this day
      const weeklySlots = await this.prisma.availability.findMany({
        where: {
          teacherId,
          dayOfWeek: dayOfWeek as DayOfWeek
        }
      });

      // Generate individual time slots
      for (const slot of weeklySlots) {
        const timeSlots = this.expandToHourlySlots(slot.startTime, slot.endTime);

        for (const timeStr of timeSlots) {
          // Convert teacher's local time to UTC
          const slotUtc = parseTimeInTimezoneToUTC(timeStr, teacherDateStr, teacherTimezone);

          // Only include if slot falls within user's day (UTC window)
          if (slotUtc >= utcWindow.start && slotUtc <= utcWindow.end) {
            allSlots.push({
              startTimeUtc: slotUtc.toISOString(),
              label: formatInTimezone(slotUtc, effectiveUserTimezone, 'h:mm a'),
              userDate: dateStr
            });
          }
        }
      }
    }

    // Step 5: Filter out exceptions
    const filteredSlots = await this.filterExceptions(allSlots, teacherId, utcWindow, teacherTimezone);

    // Step 6: Filter out existing bookings
    const availableSlots = await this.filterBookings(filteredSlots, teacherId, utcWindow);

    // Step 7: Sort by time
    availableSlots.sort((a, b) =>
      new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime()
    );

    // Return with metadata
    return {
      slots: availableSlots,
      teacherTimezone,
      userTimezone: effectiveUserTimezone
    };
  }

  /**
   * Filter out slots blocked by exceptions.
   * All comparisons happen in UTC.
   */
  private async filterExceptions(
    slots: SlotWithTimezone[],
    teacherId: string,
    utcWindow: { start: Date; end: Date },
    teacherTimezone: string
  ): Promise<SlotWithTimezone[]> {
    // Get exceptions that overlap with our UTC window
    const exceptions = await this.prisma.availabilityException.findMany({
      where: {
        teacherId,
        startDate: { lte: utcWindow.end },
        endDate: { gte: utcWindow.start }
      }
    });

    if (exceptions.length === 0) return slots;

    return slots.filter(slot => {
      const slotTime = new Date(slot.startTimeUtc);

      for (const exception of exceptions) {
        // ALL_DAY: Check if slot falls within exception date range
        if (exception.type === 'ALL_DAY') {
          if (slotTime >= exception.startDate && slotTime <= exception.endDate) {
            return false; // Blocked
          }
        }

        // PARTIAL_DAY: Convert exception times to UTC and compare
        if (exception.type === 'PARTIAL_DAY' && exception.startTime && exception.endTime) {
          // Get the date portion from exception
          const exceptionDateStr = format(exception.startDate, 'yyyy-MM-dd');

          // Convert exception times to UTC
          const exceptionStartUtc = parseTimeInTimezoneToUTC(
            exception.startTime,
            exceptionDateStr,
            teacherTimezone
          );
          const exceptionEndUtc = parseTimeInTimezoneToUTC(
            exception.endTime,
            exceptionDateStr,
            teacherTimezone
          );

          // Check if slot falls within exception window
          if (slotTime >= exceptionStartUtc && slotTime < exceptionEndUtc) {
            return false; // Blocked
          }
        }
      }

      return true; // Not blocked
    });
  }

  /**
   * Filter out slots that already have bookings.
   * All comparisons happen in UTC.
   */
  private async filterBookings(
    slots: SlotWithTimezone[],
    teacherId: string,
    utcWindow: { start: Date; end: Date }
  ): Promise<SlotWithTimezone[]> {
    // Get bookings in our UTC window
    const bookings = await this.prisma.booking.findMany({
      where: {
        teacherId,
        startTime: { gte: utcWindow.start, lte: utcWindow.end },
        status: { in: ['SCHEDULED', 'PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT'] as any }
      }
    });

    if (bookings.length === 0) return slots;

    // Create set of booked time slots (as ISO strings for easy comparison)
    const bookedTimes = new Set(
      bookings.map(b => b.startTime.toISOString())
    );

    return slots.filter(slot => !bookedTimes.has(slot.startTimeUtc));
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

  /**
   * Expand a time range into 30-minute slots.
   * 
   * @param startTime Start time in HH:mm format (teacher's local time)
   * @param endTime End time in HH:mm format (teacher's local time)
   * @returns Array of time strings (HH:mm)
   */
  private expandToHourlySlots(startTime: string, endTime: string): string[] {
    const slots: string[] = [];
    const [startHour, startMinute = 0] = startTime.split(':').map(Number);
    const [endHour, endMinute = 0] = endTime.split(':').map(Number);

    // Convert to total minutes for easier calculation
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    // Generate 30-minute slots
    for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }

    return slots;
  }
}
