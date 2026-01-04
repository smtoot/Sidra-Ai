import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCurriculumDto,
  UpdateCurriculumDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  SearchTeachersDto,
  DayOfWeek,
  SearchSortBy,
} from '@sidra/shared';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  buildUtcWindowForUserDate,
  getTeacherDatesInUtcWindow,
  parseTimeInTimezoneToUTC,
  formatInTimezone,
  SlotWithTimezone,
} from '../common/utils/timezone.util';
import { toZonedTime } from 'date-fns-tz';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(private prisma: PrismaService) { }

  /**
   * Get public platform configuration (for frontend booking UI)
   */
  async getPlatformConfig() {
    const settings = await this.prisma.system_settings.findUnique({
      where: { id: 'default' },
    });

    // Return only public-facing settings
    return {
      defaultSessionDurationMinutes:
        settings?.defaultSessionDurationMinutes || 60,
      allowedSessionDurations: settings?.allowedSessionDurations || [60],
      searchConfig: settings?.searchConfig || {
        enableGenderFilter: true, // Default enablement
        enablePriceFilter: true,
      },
    };
  }

  // --- Search ---
  async searchTeachers(dto: SearchTeachersDto) {
    const whereClause: any = {
      // CRITICAL: Only show approved teachers in search results
      teacher_profiles: {
        applicationStatus: 'APPROVED',
        // Only show teachers with at least one availability slot
        availability: {
          some: {},
        },
      },
    };

    if (dto.subjectId) {
      whereClause.subjectId = dto.subjectId;
    }
    if (dto.curriculumId) {
      whereClause.curriculumId = dto.curriculumId;
    }
    if (dto.gradeLevelId) {
      whereClause.grades = {
        some: {
          gradeLevelId: dto.gradeLevelId,
        },
      };
    }

    // Price range
    if (dto.maxPrice || dto.minPrice) {
      whereClause.pricePerHour = {};
      if (dto.maxPrice) whereClause.pricePerHour.lte = dto.maxPrice;
      if (dto.minPrice) whereClause.pricePerHour.gte = dto.minPrice;
    }

    // Gender filter (on TeacherProfile) - merge with existing teacher_profiles filter
    if (dto.gender) {
      whereClause.teacher_profiles = {
        ...whereClause.teacher_profiles,
        gender: dto.gender,
      };
    }

    // Sorting Logic
    let orderBy: any = {};
    if (dto.sortBy) {
      switch (dto.sortBy) {
        case SearchSortBy.PRICE_ASC:
          orderBy = { pricePerHour: 'asc' };
          break;
        case SearchSortBy.PRICE_DESC:
          orderBy = { pricePerHour: 'desc' };
          break;
        case SearchSortBy.RATING_DESC:
          orderBy = { teacher_profiles: { averageRating: 'desc' } };
          break;
        case SearchSortBy.RECOMMENDED:
        default:
          // Recommended: combination of high rating and sessions count
          // Prisma doesn't support complex sorting easily without raw query
          // Fallback to averageRating desc for now as "Recommended"
          orderBy = { teacher_profiles: { averageRating: 'desc' } };
          break;
      }
    } else {
      // Default sort
      orderBy = { teacher_profiles: { averageRating: 'desc' } };
    }

    const results = await this.prisma.teacher_subjects.findMany({
      where: whereClause,
      include: {
        teacher_profiles: true,
        subjects: true,
        curricula: true,
      },
      orderBy: orderBy,
    });

    return results;
  }

  // --- Curricula ---
  async createCurriculum(dto: CreateCurriculumDto) {
    try {
      return await this.prisma.curricula.create({
        data: {
          id: crypto.randomUUID(),
          code: dto.code,
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'يوجد منهج بنفس الرمز. الرجاء استخدام رمز مختلف.',
        );
      }
      throw error;
    }
  }

  async findAllCurricula(includeInactive = false) {
    return this.prisma.curricula.findMany({
      where: includeInactive ? {} : { isActive: true },
    });
  }

  async findOneCurriculum(id: string) {
    const curr = await this.prisma.curricula.findUnique({ where: { id } });
    if (!curr)
      throw new NotFoundException(`Curriculum with ID ${id} not found`);
    return curr;
  }

  async updateCurriculum(id: string, dto: UpdateCurriculumDto) {
    await this.findOneCurriculum(id);
    try {
      return await this.prisma.curricula.update({
        where: { id },
        data: dto,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'يوجد منهج بنفس الرمز. الرجاء استخدام رمز مختلف.',
        );
      }
      throw error;
    }
  }

  async softDeleteCurriculum(id: string) {
    await this.findOneCurriculum(id);
    return this.prisma.curricula.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDeleteCurriculum(id: string) {
    await this.findOneCurriculum(id);

    // Check if curricula is being used
    const [stagesCount, teacher_subjectssCount, studentsCount, childrenCount] =
      await Promise.all([
        this.prisma.educational_stages.count({ where: { curriculumId: id } }),
        this.prisma.teacher_subjects.count({ where: { curriculumId: id } }),
        this.prisma.student_profiles.count({ where: { curriculumId: id } }),
        this.prisma.children.count({ where: { curriculumId: id } }),
      ]);

    if (stagesCount > 0) {
      throw new ConflictException(
        `لا يمكن حذف المنهج لأنه يحتوي على ${stagesCount} مرحلة تعليمية. قم بحذف المراحل أولاً.`,
      );
    }
    if (teacher_subjectssCount > 0) {
      throw new ConflictException(
        `لا يمكن حذف المنهج لأنه مرتبط بـ ${teacher_subjectssCount} معلم. قم بإزالة ارتباط المعلمين أولاً.`,
      );
    }
    if (studentsCount > 0) {
      throw new ConflictException(
        `لا يمكن حذف المنهج لأنه مرتبط بـ ${studentsCount} طالب.`,
      );
    }
    if (childrenCount > 0) {
      throw new ConflictException(
        `لا يمكن حذف المنهج لأنه مرتبط بـ ${childrenCount} طفل.`,
      );
    }

    await this.prisma.curricula.delete({ where: { id } });
    return { deleted: true, message: 'تم حذف المنهج نهائياً' };
  }

  // --- Subjects ---
  async createSubject(dto: CreateSubjectDto) {
    try {
      return await this.prisma.subjects.create({
        data: {
          id: crypto.randomUUID(),
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'يوجد مادة بنفس الاسم. الرجاء استخدام اسم مختلف.',
        );
      }
      throw error;
    }
  }

  async findAllSubjects(includeInactive = false) {
    return this.prisma.subjects.findMany({
      where: includeInactive ? {} : { isActive: true },
    });
  }

  async findOneSubject(id: string) {
    const sub = await this.prisma.subjects.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException(`Subject with ID ${id} not found`);
    return sub;
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    await this.findOneSubject(id);
    try {
      return await this.prisma.subjects.update({
        where: { id },
        data: dto,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'يوجد مادة بنفس الاسم. الرجاء استخدام اسم مختلف.',
        );
      }
      throw error;
    }
  }

  async softDeleteSubject(id: string) {
    await this.findOneSubject(id);
    return this.prisma.subjects.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDeleteSubject(id: string) {
    await this.findOneSubject(id);

    // Check if subject is being used
    const [teacher_subjectssCount, bookingsCount, packagesCount] =
      await Promise.all([
        this.prisma.teacher_subjects.count({ where: { subjectId: id } }),
        this.prisma.bookings.count({ where: { subjectId: id } }),
        this.prisma.student_packages.count({ where: { subjectId: id } }),
      ]);

    if (teacher_subjectssCount > 0) {
      throw new ConflictException(
        `لا يمكن حذف المادة لأنها مرتبطة بـ ${teacher_subjectssCount} معلم.`,
      );
    }
    if (bookingsCount > 0) {
      throw new ConflictException(
        `لا يمكن حذف المادة لأنها مرتبطة بـ ${bookingsCount} حجز.`,
      );
    }
    if (packagesCount > 0) {
      throw new ConflictException(
        `لا يمكن حذف المادة لأنها مرتبطة بـ ${packagesCount} باقة طالب.`,
      );
    }

    // Also delete curricula-subject associations
    await this.prisma.curriculum_subjects.deleteMany({
      where: { subjectId: id },
    });
    await this.prisma.subjects.delete({ where: { id } });
    return { deleted: true, message: 'تم حذف المادة نهائياً' };
  }

  // --- Educational Stages ---
  async createStage(dto: {
    curriculumId: string;
    nameAr: string;
    nameEn: string;
    sequence: number;
  }) {
    // Verify curricula exists
    await this.findOneCurriculum(dto.curriculumId);
    try {
      return await this.prisma.educational_stages.create({
        data: {
          curriculumId: dto.curriculumId,
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          sequence: dto.sequence,
          isActive: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'يوجد مرحلة تعليمية بنفس البيانات. الرجاء التحقق من المدخلات.',
        );
      }
      throw error;
    }
  }

  async findAllStages(curriculumId?: string, includeInactive = false) {
    const where: any = {};
    if (curriculumId) where.curriculumId = curriculumId;
    if (!includeInactive) where.isActive = true;

    return this.prisma.educational_stages.findMany({
      where,
      include: {
        curricula: { select: { nameAr: true, nameEn: true } },
        grade_levels: { orderBy: { sequence: 'asc' } },
      },
      orderBy: { sequence: 'asc' },
    });
  }

  async findOneStage(id: string) {
    const stage = await this.prisma.educational_stages.findUnique({
      where: { id },
      include: {
        curricula: true,
        grade_levels: { orderBy: { sequence: 'asc' } },
      },
    });
    if (!stage) throw new NotFoundException(`Stage with ID ${id} not found`);
    return stage;
  }

  async updateStage(
    id: string,
    dto: {
      nameAr?: string;
      nameEn?: string;
      sequence?: number;
      isActive?: boolean;
    },
  ) {
    await this.findOneStage(id);
    try {
      return await this.prisma.educational_stages.update({
        where: { id },
        data: dto,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'يوجد مرحلة تعليمية بنفس البيانات. الرجاء التحقق من المدخلات.',
        );
      }
      throw error;
    }
  }

  async softDeleteStage(id: string) {
    await this.findOneStage(id);
    return this.prisma.educational_stages.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDeleteStage(id: string) {
    await this.findOneStage(id);

    // Check if stage has grades
    const gradesCount = await this.prisma.grade_levels.count({
      where: { stageId: id },
    });

    if (gradesCount > 0) {
      throw new ConflictException(
        `لا يمكن حذف المرحلة لأنها تحتوي على ${gradesCount} صف دراسي. قم بحذف الصفوف أولاً.`,
      );
    }

    await this.prisma.educational_stages.delete({ where: { id } });
    return { deleted: true, message: 'تم حذف المرحلة التعليمية نهائياً' };
  }

  // --- Grade Levels ---
  async createGrade(dto: {
    stageId: string;
    nameAr: string;
    nameEn: string;
    code: string;
    sequence: number;
  }) {
    // Verify stage exists
    await this.findOneStage(dto.stageId);
    try {
      return await this.prisma.grade_levels.create({
        data: {
          stageId: dto.stageId,
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          code: dto.code,
          sequence: dto.sequence,
          isActive: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'يوجد صف آخر بنفس الرمز في هذه المرحلة. الرجاء استخدام رمز مختلف.',
        );
      }
      throw error;
    }
  }

  async findAllGrades(stageId?: string, includeInactive = false) {
    const where: any = {};
    if (stageId) where.stageId = stageId;
    if (!includeInactive) where.isActive = true;

    return this.prisma.grade_levels.findMany({
      where,
      include: {
        educational_stages: {
          include: { curricula: { select: { nameAr: true, nameEn: true } } },
        },
      },
      orderBy: { sequence: 'asc' },
    });
  }

  async findOneGrade(id: string) {
    const grade = await this.prisma.grade_levels.findUnique({
      where: { id },
      include: { educational_stages: { include: { curricula: true } } },
    });
    if (!grade) throw new NotFoundException(`Grade with ID ${id} not found`);
    return grade;
  }

  async updateGrade(
    id: string,
    dto: {
      nameAr?: string;
      nameEn?: string;
      code?: string;
      sequence?: number;
      isActive?: boolean;
    },
  ) {
    await this.findOneGrade(id);
    try {
      return await this.prisma.grade_levels.update({
        where: { id },
        data: dto,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'يوجد صف آخر بنفس الرمز في هذه المرحلة. الرجاء استخدام رمز مختلف.',
        );
      }
      throw error;
    }
  }

  async softDeleteGrade(id: string) {
    await this.findOneGrade(id);
    return this.prisma.grade_levels.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDeleteGrade(id: string) {
    await this.findOneGrade(id);

    // Check if grade is being used by teachers
    const teacherGradesCount = await this.prisma.teacher_subject_grades.count({
      where: { gradeLevelId: id },
    });

    if (teacherGradesCount > 0) {
      throw new ConflictException(
        `لا يمكن حذف الصف لأنه مرتبط بـ ${teacherGradesCount} معلم. قم بإزالة ارتباط المعلمين أولاً.`,
      );
    }

    await this.prisma.grade_levels.delete({ where: { id } });
    return { deleted: true, message: 'تم حذف الصف الدراسي نهائياً' };
  }

  async getTeacherPublicProfile(idOrSlug: string) {
    // Determine if it's a UUID or slug
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const teacher = await this.prisma.teacher_profiles.findFirst({
      where: isUUID ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        users: {
          select: { email: true },
        },
        teacher_subjects: {
          include: {
            subjects: { select: { id: true, nameAr: true, nameEn: true } },
            curricula: { select: { id: true, nameAr: true, nameEn: true } },
            teacher_subject_grades: {
              include: {
                grade_levels: {
                  include: { educational_stages: true },
                },
              },
            },
          },
        },
        teacher_teaching_approach_tags: {
          include: { teaching_approach_tags: true },
          where: { teaching_approach_tags: { isActive: true } },
        },
        teacher_qualifications: {
          where: { verified: true },
          orderBy: { graduationYear: 'desc' },
        },
        // Skills sorted by proficiency DESC, name ASC for public profile
        teacher_skills: {
          orderBy: [{ proficiency: 'desc' }, { name: 'asc' }],
        },
        // Work experiences sorted by current first, then by start date
        teacher_work_experiences: {
          orderBy: [
            { isCurrent: 'desc' },
            { startDate: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        availability: true,
        // Include demo settings
        teacher_demo_settings: true,
        student_packages: {
          select: { id: true },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    try {
      // Get completed sessions count
      const completedSessions = await this.prisma.bookings.count({
        where: {
          teacherId: teacher.id,
          status: 'COMPLETED' as any,
        },
      });

      // Get global system settings
      const system_settings = await this.prisma.system_settings.findUnique({
        where: { id: 'default' },
      });

      // Get teacher demo settings
      const teacherDemoSettings =
        await this.prisma.teacher_demo_settings.findUnique({
          where: { teacherId: teacher.id },
        });

      // Get active package tiers
      const packageTiers = await this.prisma.package_tiers.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      });

      return {
        id: teacher.id,
        userId: teacher.userId,
        displayName: teacher.displayName,
        profilePhotoUrl: teacher.profilePhotoUrl,
        introVideoUrl: teacher.introVideoUrl,
        bio: teacher.bio,
        // REMOVED: education field - replaced by qualifications
        yearsOfExperience: teacher.yearsOfExperience,
        gender: teacher.gender,
        averageRating: teacher.averageRating,
        totalReviews: teacher.totalReviews,
        totalSessions: completedSessions,
        timezone: teacher.timezone,
        globalSettings: {
          packagesEnabled: system_settings?.packagesEnabled ?? true,
          demosEnabled: system_settings?.demosEnabled ?? true,
        },
        teacherSettings: {
          demoEnabled: teacherDemoSettings?.demoEnabled ?? false,
        },
        packageTiers: packageTiers.map((t) => ({
          id: t.id,
          sessionCount: t.sessionCount,
          discountPercent: Number(t.discountPercent),
        })),
        subjects: (teacher as any).teacher_subjects.map((s: any) => ({
          id: s.id,
          pricePerHour: s.pricePerHour ? s.pricePerHour.toString() : '0',
          // Map structured grades to simplified codes/names for frontend
          grades:
            s.teacher_subject_grades?.map((g: any) => ({
              id: g.grade_levels?.id,
              nameAr: g.grade_levels?.nameAr,
              nameEn: g.grade_levels?.nameEn,
              code: g.grade_levels?.code,
              stageNameAr: g.grade_levels?.educational_stages?.nameAr,
              stageNameEn: g.grade_levels?.educational_stages?.nameEn,
            })) || [],
          gradeLevels: s.teacher_subject_grades?.map((g: any) => g.grade_levels?.code) || [],
          subject: s.subjects,
          curricula: s.curricula,
        })),

        // Academic qualifications (verified only)
        qualifications:
          (teacher as any).teacher_qualifications?.map((q: any) => ({
            id: q.id,
            degreeName: q.degreeName,
            institution: q.institution,
            fieldOfStudy: q.fieldOfStudy,
            status: q.status,
            graduationYear: q.graduationYear,
            startDate: q.startDate,
            endDate: q.endDate,
            verified: q.verified,
          })) || [],

        // Skills (sorted by proficiency DESC, name ASC)
        skills:
          (teacher as any).teacher_skills?.map((s: any) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            proficiency: s.proficiency,
          })) || [],

        // Work experiences (sorted by isCurrent DESC, startDate DESC)
        workExperiences:
          (teacher as any).teacher_work_experiences?.map((e: any) => ({
            id: e.id,
            title: e.title,
            organization: e.organization,
            experienceType: e.experienceType,
            startDate: e.startDate,
            endDate: e.endDate,
            isCurrent: e.isCurrent,
            description: e.description,
            subjects: e.subjects,
          })) || [],

        availability: (teacher as any).availability,
        applicationStatus: teacher.applicationStatus, // Verified Badge Source
        // Vacation Mode (for disabling booking button)
        isOnVacation: teacher.isOnVacation,
        vacationEndDate: teacher.vacationEndDate,
        teachingApproach:
          (teacher as any).teachingStyle ||
            ((teacher as any).teacher_teaching_approach_tags &&
              (teacher as any).teacher_teaching_approach_tags.length > 0)
            ? {
              text: (teacher as any).teachingStyle,
              tags:
                (teacher as any).teacher_teaching_approach_tags?.map((tt: any) => ({
                  id: tt.teaching_approach_tags?.id,
                  labelAr: tt.teaching_approach_tags?.labelAr,
                })) || [],
            }
            : null,
      };
    } catch (error) {
      this.logger.error(
        'CRITICAL ERROR in getTeacherPublicProfile mapping:',
        error,
      );
      throw new InternalServerErrorException(
        `Public Profile Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // --- Teacher Availability (Public) ---
  async getTeacherAvailability(teacherId: string) {
    const teacher = await this.prisma.teacher_profiles.findUnique({
      where: { id: teacherId },
      include: {
        availability: true,
        availability_exceptions: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      weeklySchedule: teacher.availability,
      exceptions: teacher.availability_exceptions,
    };
  }

  // --- Teacher Ratings (Public) ---
  async getTeacherRatings(
    teacherId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await this.prisma.ratings.count({
      where: {
        teacherId,
        isVisible: true,
      },
    });

    // Get ratings with user info (for display name)
    const ratings = await this.prisma.ratings.findMany({
      where: {
        teacherId,
        isVisible: true,
      },
      include: {
        users: {
          select: {
            id: true,
            role: true,
            parent_profiles: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      ratings: ratings.map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        // Show generic name for privacy
        raterType: r.users.role === 'PARENT' ? 'ولي أمر' : 'طالب',
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
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
  async getAvailableSlots(
    teacherId: string,
    dateStr: string,
    userTimezone?: string,
  ) {
    if (!dateStr) {
      throw new NotFoundException('Date query parameter is required');
    }

    // Step 1: Get teacher's timezone
    const teacher = await this.prisma.teacher_profiles.findUnique({
      where: { id: teacherId },
      select: { timezone: true },
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
      const teacherLocalDate = toZonedTime(
        new Date(teacherDateStr + 'T12:00:00Z'),
        teacherTimezone,
      );
      const dayOfWeek = this.getDayOfWeek(teacherLocalDate);

      // Get weekly slots for this day
      const weeklySlots = await this.prisma.availability.findMany({
        where: {
          teacherId,
          dayOfWeek: dayOfWeek as DayOfWeek,
        },
      });

      // Generate individual time slots
      for (const slot of weeklySlots) {
        const timeSlots = this.expandToHourlySlots(
          slot.startTime,
          slot.endTime,
        );

        for (const timeStr of timeSlots) {
          // Convert teacher's local time to UTC
          const slotUtc = parseTimeInTimezoneToUTC(
            timeStr,
            teacherDateStr,
            teacherTimezone,
          );

          // Only include if slot falls within user's day (UTC window)
          if (slotUtc >= utcWindow.start && slotUtc <= utcWindow.end) {
            allSlots.push({
              startTimeUtc: slotUtc.toISOString(),
              label: formatInTimezone(slotUtc, effectiveUserTimezone, 'h:mm a'),
              userDate: dateStr,
            });
          }
        }
      }
    }

    // Step 5: Filter out exceptions
    const filteredSlots = await this.filterExceptions(
      allSlots,
      teacherId,
      utcWindow,
      teacherTimezone,
    );

    // Step 6: Filter out existing bookings
    const availableSlots = await this.filterBookings(
      filteredSlots,
      teacherId,
      utcWindow,
    );

    // Step 7: Sort by time
    availableSlots.sort(
      (a, b) =>
        new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime(),
    );

    // Step 8: Filter out slots in the past
    // This is critical to prevent showing 1:00 AM slots when it's currently 5:00 PM
    const now = new Date();
    const futureSlots = availableSlots.filter(
      (slot) => new Date(slot.startTimeUtc) > now,
    );

    // Return with metadata
    return {
      slots: futureSlots,
      teacherTimezone,
      userTimezone: effectiveUserTimezone,
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
    teacherTimezone: string,
  ): Promise<SlotWithTimezone[]> {
    // Get exceptions that overlap with our UTC window
    const exceptions = await this.prisma.availability_exceptions.findMany({
      where: {
        teacherId,
        startDate: { lte: utcWindow.end },
        endDate: { gte: utcWindow.start },
      },
    });

    if (exceptions.length === 0) return slots;

    return slots.filter((slot) => {
      const slotTime = new Date(slot.startTimeUtc);

      for (const exception of exceptions) {
        // ALL_DAY: Check if slot falls within exception date range
        if (exception.type === 'ALL_DAY') {
          if (
            slotTime >= exception.startDate &&
            slotTime <= exception.endDate
          ) {
            return false; // Blocked
          }
        }

        // PARTIAL_DAY: Convert exception times to UTC and compare
        if (
          exception.type === 'PARTIAL_DAY' &&
          exception.startTime &&
          exception.endTime
        ) {
          // Get the date portion from exception
          const exceptionDateStr = format(exception.startDate, 'yyyy-MM-dd');

          // Convert exception times to UTC
          const exceptionStartUtc = parseTimeInTimezoneToUTC(
            exception.startTime,
            exceptionDateStr,
            teacherTimezone,
          );
          const exceptionEndUtc = parseTimeInTimezoneToUTC(
            exception.endTime,
            exceptionDateStr,
            teacherTimezone,
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
   * IMPORTANT: Now accounts for booking duration - a booking blocks multiple 30-min slots
   */
  private async filterBookings(
    slots: SlotWithTimezone[],
    teacherId: string,
    utcWindow: { start: Date; end: Date },
  ): Promise<SlotWithTimezone[]> {
    // Get bookings in our UTC window
    const bookings = await this.prisma.bookings.findMany({
      where: {
        teacherId,
        startTime: { gte: utcWindow.start, lte: utcWindow.end },
        status: {
          in: [
            'SCHEDULED',
            'PENDING_TEACHER_APPROVAL',
            'WAITING_FOR_PAYMENT',
          ] as any,
        },
      },
    });

    if (bookings.length === 0) return slots;

    // Filter out slots that conflict with ANY existing booking
    // A slot conflicts if it falls within [booking.startTime, booking.endTime)
    return slots.filter((slot) => {
      const slotTime = new Date(slot.startTimeUtc);

      for (const booking of bookings) {
        // Check if slot falls within booking window
        // Slot is blocked if: booking.startTime <= slotTime < booking.endTime
        if (slotTime >= booking.startTime && slotTime < booking.endTime) {
          return false; // Slot is blocked by this booking
        }
      }

      return true; // Slot is available
    });
  }

  private getDayOfWeek(date: Date): string {
    const dayMap: { [key: number]: string } = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
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
    for (
      let minutes = startTotalMinutes;
      minutes < endTotalMinutes;
      minutes += 30
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      slots.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      );
    }

    return slots;
  }

  /**
   * Check if a teacher has consecutive availability for a recurring pattern
   * Used for Smart Pack package purchases
   */
  async checkRecurringAvailability(
    teacherId: string,
    weekday: string,
    time: string,
    sessionCount: number,
    duration: number,
  ) {
    // Get teacher profile with availability
    const teacher = await this.prisma.teacher_profiles.findUnique({
      where: { id: teacherId },
      include: {
        availability: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const teacherTimezone = teacher.timezone || 'Africa/Khartoum';

    // Check if teacher has availability on this weekday
    const dayAvailability = teacher.availability.find(
      (a) => a.dayOfWeek === weekday,
    );

    if (!dayAvailability) {
      return {
        available: false,
        conflicts: [],
        suggestedDates: [],
        message: `المعلم غير متاح يوم ${weekday}`,
      };
    }

    // Check if the requested time falls within teacher's availability
    const requestedTimeMinutes = this.timeToMinutes(time);
    const availStartMinutes = this.timeToMinutes(dayAvailability.startTime);
    const availEndMinutes = this.timeToMinutes(dayAvailability.endTime);

    const requestedEndMinutes = requestedTimeMinutes + duration;

    if (
      requestedTimeMinutes < availStartMinutes ||
      requestedEndMinutes > availEndMinutes
    ) {
      return {
        available: false,
        conflicts: [],
        suggestedDates: [],
        message: `الوقت ${time} خارج أوقات عمل المعلم (${dayAvailability.startTime} - ${dayAvailability.endTime})`,
      };
    }

    // Generate suggested dates for consecutive weeks
    const today = new Date();
    const suggestedDates: string[] = [];
    const conflicts: Array<{ date: string; reason: string }> = [];

    // Find the first occurrence of the weekday (with 48h minimum notice)
    const minNoticeDate = new Date(today.getTime() + 48 * 60 * 60 * 1000);
    const currentDate = new Date(minNoticeDate);

    // Map weekday string to day number
    const weekdayMap: { [key: string]: number } = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    const targetDayNum = weekdayMap[weekday];

    // Find first occurrence of target weekday
    while (currentDate.getDay() !== targetDayNum) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Check availability for sessionCount consecutive weeks
    for (let week = 0; week < sessionCount; week++) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');

      // CRITICAL: Use parseTimeInTimezoneToUTC to correctly convert teacher's local time to UTC
      // The time parameter is in teacher's local timezone
      const sessionDateTime = parseTimeInTimezoneToUTC(
        time,
        dateStr,
        teacherTimezone,
      );

      const sessionEndDateTime = new Date(
        sessionDateTime.getTime() + duration * 60 * 1000,
      );

      // Check for conflicts with existing bookings
      const existingBookings = await this.prisma.bookings.findMany({
        where: {
          teacherId,
          startTime: {
            lt: sessionEndDateTime.toISOString(),
          },
          endTime: {
            gt: sessionDateTime.toISOString(),
          },
          status: {
            in: [
              'SCHEDULED',
              'PENDING_CONFIRMATION',
              'PENDING_TEACHER_APPROVAL',
              'WAITING_FOR_PAYMENT',
            ],
          },
        },
      });

      if (existingBookings.length > 0) {
        conflicts.push({
          date: dateStr,
          reason: 'محجوز بالفعل',
        });
      } else {
        suggestedDates.push(sessionDateTime.toISOString());
      }

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    // Check if we have enough available dates
    const available =
      conflicts.length === 0 && suggestedDates.length === sessionCount;

    // Calculate package end date
    const packageEndDate =
      suggestedDates.length > 0
        ? new Date(suggestedDates[suggestedDates.length - 1])
        : null;

    return {
      available,
      conflicts,
      suggestedDates,
      packageEndDate: packageEndDate ? packageEndDate.toISOString() : null,
      message: available
        ? `متاح لـ ${sessionCount} أسابيع متتالية`
        : `يوجد ${conflicts.length} تعارض(ات). جرب يوم أو وقت آخر.`,
    };
  }

  /**
   * Convert time string (HH:mm) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get availability calendar for a teacher for a given month
   * Returns available dates and fully booked dates
   */
  async getAvailabilityCalendar(idOrSlug: string, month: string) {
    // Parse month (YYYY-MM format)
    const [year, monthNum] = month.split('-').map(Number);
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0);

    // Determine if it's a UUID or slug
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    // Get teacher profile with availability and timezone
    const teacher = await this.prisma.teacher_profiles.findFirst({
      where: isUUID ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        availability: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const teacherTimezone = teacher.timezone || 'Africa/Khartoum';
    const teacherId = teacher.id;

    // Get all bookings for this teacher in the month
    const bookings = await this.prisma.bookings.findMany({
      where: {
        teacherId,
        startTime: {
          gte: startOfMonth.toISOString(),
          lte: endOfMonth.toISOString(),
        },
        status: {
          in: [
            'SCHEDULED',
            'PENDING_CONFIRMATION',
            'PENDING_TEACHER_APPROVAL',
            'WAITING_FOR_PAYMENT',
          ],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const availableDates: string[] = [];
    const fullyBookedDates: string[] = [];
    // Use today's date at midnight as the minimum (don't show past dates)
    // The 48h notice period is handled per-slot in available-slots endpoint
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map weekday string to day number
    const weekdayMap: { [key: string]: number } = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    // Create a map of teacher's availability by day of week
    const availabilityByDay = new Map<number, any[]>();
    teacher.availability.forEach((avail) => {
      const dayNum = weekdayMap[avail.dayOfWeek];
      if (!availabilityByDay.has(dayNum)) {
        availabilityByDay.set(dayNum, []);
      }
      availabilityByDay.get(dayNum)?.push(avail);
    });

    // Iterate through each day of the month
    const currentDate = new Date(startOfMonth);
    while (currentDate <= endOfMonth) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayOfWeek = currentDate.getDay();

      // Skip dates in the past
      if (currentDate < today) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check if teacher has any availability on this day of week
      const dayAvailability = availabilityByDay.get(dayOfWeek);
      if (!dayAvailability || dayAvailability.length === 0) {
        // No availability on this day of week
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check if there are any available time slots on this date
      let hasAvailableSlots = false;

      for (const avail of dayAvailability) {
        // Expand availability into 30-minute slots
        const slots = this.expandToHourlySlots(avail.startTime, avail.endTime);

        for (const slotTime of slots) {
          // Convert slot time to UTC
          const slotDateTime = parseTimeInTimezoneToUTC(
            slotTime,
            dateStr,
            teacherTimezone,
          );
          const slotEndDateTime = new Date(
            slotDateTime.getTime() + 30 * 60 * 1000,
          );

          // Check if this slot conflicts with any booking
          const hasConflict = bookings.some((booking) => {
            return (
              slotDateTime >= booking.startTime &&
              slotDateTime < booking.endTime
            );
          });

          if (!hasConflict) {
            hasAvailableSlots = true;
            break;
          }
        }

        if (hasAvailableSlots) break;
      }

      if (hasAvailableSlots) {
        availableDates.push(dateStr);
      } else {
        // Has availability but all slots are booked
        fullyBookedDates.push(dateStr);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Find next available slot
    let nextAvailableSlot = null;

    // Iterate through available dates to find the first one with valid FUTURE slots
    // (A date might be "available" but all its slots are in the past)
    if (availableDates.length > 0) {
      for (const dateStr of availableDates) {
        try {
          const slotsResponse = await this.getAvailableSlots(
            teacherId,
            dateStr,
            teacherTimezone,
          );

          if (slotsResponse.slots && slotsResponse.slots.length > 0) {
            const firstSlot = slotsResponse.slots[0];

            // Format time in Arabic
            const slotDateUtc = new Date(firstSlot.startTimeUtc);
            // Re-convert to teacher timezone for display
            const zonedSlotDate = toZonedTime(slotDateUtc, teacherTimezone);

            const arabicTime = format(zonedSlotDate, 'h:mm a', { locale: ar })
              .replace('AM', 'صباحاً')
              .replace('PM', 'مساءً')
              .replace('am', 'صباحاً')
              .replace('pm', 'مساءً');

            nextAvailableSlot = {
              date: dateStr,
              time: arabicTime,
              startTimeUtc: firstSlot.startTimeUtc, // Pass UTC time for frontend timezone handling
              display: this.formatNextAvailableDisplay(dateStr, arabicTime),
            };

            // Found a valid slot, stop searching
            break;
          }
        } catch (error) {
          this.logger.error(
            `Failed to check slots for date ${dateStr}:`,
            error,
          );
        }
      }
    }

    return {
      availableDates,
      fullyBookedDates,
      nextAvailableSlot,
    };
  }

  /**
   * Format next available slot for display
   */
  private formatNextAvailableDisplay(date: string, time: string): string {
    const slotDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    slotDate.setHours(0, 0, 0, 0);

    if (slotDate.getTime() === today.getTime()) {
      return `اليوم في ${time}`;
    } else if (slotDate.getTime() === tomorrow.getTime()) {
      return `غداً في ${time}`;
    } else {
      return `${format(slotDate, 'yyyy-MM-dd')} في ${time}`;
    }
  }

  /**
   * Get the absolute next available slot for a teacher
   * Scans current month and next month
   */
  async getNextAvailableSlot(teacherId: string) {
    const today = new Date();
    const currentMonthStr = format(today, 'yyyy-MM');
    const nextMonthDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1,
    );
    const nextMonthStr = format(nextMonthDate, 'yyyy-MM');

    // Check current month
    const currentMonthData = await this.getAvailabilityCalendar(
      teacherId,
      currentMonthStr,
    );

    if (currentMonthData.nextAvailableSlot) {
      return currentMonthData.nextAvailableSlot;
    }

    // Check next month
    const nextMonthData = await this.getAvailabilityCalendar(
      teacherId,
      nextMonthStr,
    );

    return nextMonthData.nextAvailableSlot;
  }
}
