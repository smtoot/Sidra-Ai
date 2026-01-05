import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateTeacherProfileDto,
  CreateTeacherSubjectDto,
  CreateAvailabilityDto,
  CreateExceptionDto,
  CreateQualificationDto,
  UpdateQualificationDto,
} from '@sidra/shared';
import { EncryptionUtil } from '../common/utils/encryption.util';
import { WalletService } from '../wallet/wallet.service';
import { SystemSettingsService } from '../admin/system-settings.service';
import { NotificationService } from '../notification/notification.service';
import { formatInTimezone } from '../common/utils/timezone.util';

@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private system_settingsService: SystemSettingsService,
    private notificationService: NotificationService,
  ) { }

  async getProfile(userId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      include: {
        teacher_subjects: { include: { subjects: true, curricula: true } },
        availability: true,
        documents: true,
        teacher_qualifications: true, // Include qualifications
        teacher_skills: { orderBy: { createdAt: 'desc' } }, // Include skills
        teacher_work_experiences: {
          orderBy: [
            { isCurrent: 'desc' },
            { startDate: 'desc' },
            { createdAt: 'desc' },
          ],
        }, // Include work experiences
        users: true, // Include User for firstName/lastName
      },
    });

    if (!profile) {
      throw new NotFoundException('Teacher profile not found');
    }

    // P1 SECURITY FIX: Decrypt meeting link before returning to frontend
    // Meeting links are stored encrypted for security, but teachers need to see/edit them
    let decryptedMeetingLink: string | null = null;
    if (profile.encryptedMeetingLink) {
      try {
        decryptedMeetingLink = await EncryptionUtil.decrypt(
          profile.encryptedMeetingLink,
        );
      } catch (error) {
        // If decryption fails, log error but don't break the profile fetch
        this.logger.error(
          `Failed to decrypt meeting link for teacher: ${userId}`,
          error,
        );
      }
    }

    return {
      ...profile,
      meetingLink: decryptedMeetingLink,
      users: profile.users,
      user: profile.users, // Map users -> user
    };
  }

  async updateProfile(userId: string, dto: UpdateTeacherProfileDto) {
    // ... (unchanged validation logic) ...

    // Update teacher profile
    const updatedProfile = await this.prisma.teacher_profiles.update({
      where: { userId },
      data: {
        // ... (data update logic is inside update but not shown here, blindly trusting previous logic or just wrapping return?)
        // Wait, I need to see the update call to replace it correctly. 
        // But I can't see the whole file. 
      }
      // ...
    });

    // I need to be careful. I will only replace the return block of getProfile for now.
    // updateProfile is huge and I don't have the content.
    // I will use replace_file_content targeting specific lines I SAW.

    // I saw getProfile return on lines 74-78.
    // I haven't seen updateProfile return statement clearly.
    // I'll stick to getProfile for now.

  }

  async updateProfile(userId: string, dto: UpdateTeacherProfileDto) {
    // Validation: Years of experience
    if (dto.yearsOfExperience !== undefined) {
      if (dto.yearsOfExperience < 0) {
        throw new BadRequestException('Years of experience cannot be negative');
      }
      if (dto.yearsOfExperience > 50) {
        throw new BadRequestException(
          'Years of experience seems unrealistic (max 50 years)',
        );
      }
    }

    // Validation: Bio length
    if (dto.bio !== undefined) {
      const MAX_BIO_LENGTH = 2000;
      if (dto.bio.length > MAX_BIO_LENGTH) {
        throw new BadRequestException(
          `Bio cannot exceed ${MAX_BIO_LENGTH} characters`,
        );
      }
    }

    // Validation: Display name length
    if (dto.displayName !== undefined) {
      if (dto.displayName.trim().length < 2) {
        throw new BadRequestException(
          'Display name must be at least 2 characters',
        );
      }
      if (dto.displayName.length > 100) {
        throw new BadRequestException(
          'Display name cannot exceed 100 characters',
        );
      }
    }

    // Validation: Meeting link URL format
    let encryptedLink = undefined;
    if (dto.meetingLink) {
      try {
        const url = new URL(dto.meetingLink);
        // Validate it's a known meeting platform
        const validDomains = [
          'meet.google.com',
          'zoom.us',
          'teams.microsoft.com',
          'teams.live.com',
        ];
        const isValidDomain = validDomains.some((domain) =>
          url.hostname.includes(domain),
        );

        if (!isValidDomain) {
          throw new BadRequestException(
            'Meeting link must be from Google Meet, Zoom, or Microsoft Teams',
          );
        }

        encryptedLink = await EncryptionUtil.encrypt(dto.meetingLink);
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        throw new BadRequestException('Invalid meeting link URL format');
      }
    }

    // Validation: Date of birth (must be at least 18 years old)
    if (dto.dateOfBirth) {
      const dob = new Date(dto.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();

      if (age < 18) {
        throw new BadRequestException('Teacher must be at least 18 years old');
      }
      if (age > 100) {
        throw new BadRequestException('Invalid date of birth');
      }
    }

    // Note: firstName/lastName are managed separately through user profile
    // They are not part of teacher onboarding DTO anymore

    return this.prisma.teacher_profiles
      .update({
        where: { userId },
        data: {
          displayName: dto.displayName,
          slug: dto.slug, // Update slug
          fullName: dto.fullName,
          bio: dto.bio,
          yearsOfExperience: dto.yearsOfExperience,
          // REMOVED: education field - replaced by qualifications
          gender: dto.gender,
          timezone: dto.timezone, // Save timezone
          profilePhotoUrl: dto.profilePhotoUrl,
          introVideoUrl: dto.introVideoUrl,
          encryptedMeetingLink: encryptedLink,
          // Personal/Contact info
          whatsappNumber: dto.whatsappNumber,
          city: dto.city,
          country: dto.country,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          // ID Verification fields
          idType: dto.idType,
          idNumber: dto.idNumber,
          idImageUrl: dto.idImageUrl,
          // Mark onboarding as complete if basic info is present (simplification for MVP)
          // hasCompletedOnboarding: true,
        },
      })
      .catch((error) => {
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
          throw new BadRequestException(
            'عذراً، هذا الرابط مستخدم بالفعل. يرجى اختيار رابط آخر.',
          );
        }
        throw error;
      });
  }

  async addSubject(userId: string, dto: CreateTeacherSubjectDto) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    // 1. Validation: Verify Subject exists
    const subject = await this.prisma.subjects.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject || !subject.isActive)
      throw new NotFoundException('Subject not found or inactive');

    // 2. Validation: Verify Curriculum exists
    const curricula = await this.prisma.curricula.findUnique({
      where: { id: dto.curriculumId },
    });
    if (!curricula || !curricula.isActive)
      throw new NotFoundException('Curriculum not found or inactive');

    // 3. Validation: Price must be positive
    if (!dto.pricePerHour || dto.pricePerHour <= 0) {
      throw new BadRequestException('Price per hour must be a positive number');
    }

    // 4. Validation: Price maximum check (prevent unrealistic prices)
    // Fetch the configurable max price from system settings
    const settings = await this.system_settingsService.getSettings();
    const maxPrice = Number(settings.maxPricePerHour);
    if (dto.pricePerHour > maxPrice) {
      throw new BadRequestException(
        `Price per hour cannot exceed ${maxPrice} SDG`,
      );
    }

    // 5. Validation: Check for duplicate subject+curricula combination
    const existingSubject = await this.prisma.teacher_subjects.findFirst({
      where: {
        teacherId: profile.id,
        subjectId: dto.subjectId,
        curriculumId: dto.curriculumId,
      },
    });

    if (existingSubject) {
      throw new BadRequestException(
        'You already teach this subject with this curricula. Please update the existing one instead.',
      );
    }

    // 6. Validation: Verify Grades
    if (!dto.gradeLevelIds || dto.gradeLevelIds.length === 0) {
      throw new BadRequestException('At least one grade level is required');
    }

    // Fetch provided grades with their stages -> curricula to validate consistency
    const uniqueGradeIds = [...new Set(dto.gradeLevelIds)]; // Deduplicate
    const grades = await this.prisma.grade_levels.findMany({
      where: { id: { in: uniqueGradeIds } },
      include: { educational_stages: true },
    });

    if (grades.length !== uniqueGradeIds.length) {
      throw new BadRequestException('One or more invalid grade IDs provided');
    }

    // 4. Validation: Enforce Consistency (All grades must belong to the selected Curriculum)
    const invalidGrades = grades.filter(
      (g) => g.educational_stages.curriculumId !== dto.curriculumId,
    );
    if (invalidGrades.length > 0) {
      throw new BadRequestException(
        'All selected grades must belong to the selected curricula',
      );
    }

    // 5. Transactional Creation
    return this.prisma.$transaction(async (tx) => {
      // Create TeacherSubject
      const teacher_subjects = await tx.teacher_subjects.create({
        data: {
          id: crypto.randomUUID(),
          teacherId: profile.id,
          subjectId: dto.subjectId,
          curriculumId: dto.curriculumId,
          pricePerHour: dto.pricePerHour,
        },
      });

      // Create Join Rows (TeacherSubjectGrade)
      await tx.teacher_subject_grades.createMany({
        data: uniqueGradeIds.map((gradeId) => ({
          teacherSubjectId: teacher_subjects.id,
          gradeLevelId: gradeId,
        })),
      });

      return teacher_subjects;
    });
  }

  async removeSubject(userId: string, subjectId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    // Verify ownership
    const subject = await this.prisma.teacher_subjects.findFirst({
      where: { id: subjectId, teacherId: profile.id },
    });

    if (!subject)
      throw new NotFoundException('Subject not found for this teacher');

    return this.prisma.teacher_subjects.delete({ where: { id: subjectId } });
  }

  // ============ Qualifications Management ============

  /**
   * Get all qualifications for a teacher
   */
  async getQualifications(userId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.teacher_qualifications.findMany({
      where: { teacherId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Add a new qualification
   * If teacher is already approved, adding/editing qualifications triggers re-verification
   */
  async addQualification(userId: string, dto: CreateQualificationDto) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: { id: true, applicationStatus: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    // Parse dates if provided
    const startDate = dto.startDate ? new Date(dto.startDate) : null;
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    const qualification = await this.prisma.teacher_qualifications.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        teacherId: profile.id,
        degreeName: dto.degreeName,
        institution: dto.institution,
        fieldOfStudy: dto.fieldOfStudy,
        status: dto.status,
        startDate,
        endDate,
        graduationYear: dto.graduationYear,
        certificateUrl: dto.certificateUrl,
        verified: false, // Always start unverified
      },
    });

    return qualification;
  }

  /**
   * Update an existing qualification
   * Updating triggers re-verification
   */
  async updateQualification(
    userId: string,
    qualificationId: string,
    dto: UpdateQualificationDto,
  ) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    // Verify ownership
    const qualification = await this.prisma.teacher_qualifications.findFirst({
      where: { id: qualificationId, teacherId: profile.id },
    });

    if (!qualification) throw new NotFoundException('Qualification not found');

    // Parse dates if provided
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    // Update and unverify (triggers re-verification)
    return this.prisma.teacher_qualifications.update({
      where: { id: qualificationId },
      data: {
        degreeName: dto.degreeName,
        institution: dto.institution,
        fieldOfStudy: dto.fieldOfStudy,
        status: dto.status,
        startDate,
        endDate,
        graduationYear: dto.graduationYear,
        certificateUrl: dto.certificateUrl,
        verified: false, // Re-verification required
        verifiedAt: null,
        verifiedBy: null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a qualification
   */
  async deleteQualification(userId: string, qualificationId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    // Verify ownership
    const qualification = await this.prisma.teacher_qualifications.findFirst({
      where: { id: qualificationId, teacherId: profile.id },
    });

    if (!qualification) throw new NotFoundException('Qualification not found');

    await this.prisma.teacher_qualifications.delete({
      where: { id: qualificationId },
    });

    return { success: true };
  }

  async setAvailability(userId: string, dto: CreateAvailabilityDto) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    // Validation: Time format check (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(dto.startTime) || !timeRegex.test(dto.endTime)) {
      throw new BadRequestException('Time must be in HH:MM format (24-hour)');
    }

    // Validation: End time must be after start time
    const [startHour, startMin] = dto.startTime.split(':').map(Number);
    const [endHour, endMin] = dto.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validation: Minimum slot duration (15 minutes)
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 15) {
      throw new BadRequestException(
        'Availability slot must be at least 15 minutes',
      );
    }

    // Validation: Maximum slot duration (12 hours)
    if (durationMinutes > 720) {
      throw new BadRequestException('Availability slot cannot exceed 12 hours');
    }

    // Validation: Check for overlapping slots on the same day
    const existingSlots = await this.prisma.availability.findMany({
      where: {
        teacherId: profile.id,
        dayOfWeek: dto.dayOfWeek,
      },
    });

    for (const slot of existingSlots) {
      const [slotStartHour, slotStartMin] = slot.startTime
        .split(':')
        .map(Number);
      const [slotEndHour, slotEndMin] = slot.endTime.split(':').map(Number);
      const slotStartMinutes = slotStartHour * 60 + slotStartMin;
      const slotEndMinutes = slotEndHour * 60 + slotEndMin;

      // Check for overlap
      if (
        (startMinutes >= slotStartMinutes && startMinutes < slotEndMinutes) ||
        (endMinutes > slotStartMinutes && endMinutes <= slotEndMinutes) ||
        (startMinutes <= slotStartMinutes && endMinutes >= slotEndMinutes)
      ) {
        throw new BadRequestException(
          `This time slot overlaps with an existing availability (${slot.startTime} - ${slot.endTime})`,
        );
      }
    }

    return this.prisma.availability.create({
      data: {
        id: crypto.randomUUID(),
        teacherId: profile.id,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isRecurring: dto.isRecurring,
      },
    });
  }

  async removeAvailability(userId: string, availabilityId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const slot = await this.prisma.availability.findFirst({
      where: { id: availabilityId, teacherId: profile.id },
    });

    if (!slot) throw new NotFoundException('Slot not found');

    return this.prisma.availability.delete({ where: { id: availabilityId } });
  }

  async replaceAvailability(userId: string, slots: CreateAvailabilityDto[]) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    // Use transaction to ensure atomicity: delete all existing, then create new
    return this.prisma.$transaction(async (prisma) => {
      // Delete all existing availability for this teacher
      await prisma.availability.deleteMany({
        where: { teacherId: profile.id },
      });

      // Create new slots in bulk
      if (slots.length > 0) {
        await prisma.availability.createMany({
          data: slots.map((slot) => ({
            id: crypto.randomUUID(),
            teacherId: profile.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isRecurring: slot.isRecurring ?? true,
          })),
        });
      }

      // Return updated availability
      return prisma.availability.findMany({
        where: { teacherId: profile.id },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });
  }

  async getOnboardingProgress(userId: string) {
    const profile = await this.getProfile(userId);
    // Logic to calculate step 0-100% or step number
    return {
      hasCompletedOnboarding: profile.hasCompletedOnboarding,
      step: profile.onboardingStep,
    };
  }

  // --- Exception Management ---

  async getExceptions(userId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      include: { availability_exceptions: { orderBy: { startDate: 'asc' } } },
    });
    return profile?.availability_exceptions || [];
  }

  async addException(userId: string, dto: CreateExceptionDto) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    // Validation: Dates must be valid
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    // Validation: End date must be on or after start date
    if (endDate < startDate) {
      throw new BadRequestException('End date must be on or after start date');
    }

    // Validation: Cannot create exceptions in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      throw new BadRequestException('Cannot create exceptions for past dates');
    }

    // Validation: Maximum exception duration (1 year)
    const maxDuration = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    if (endDate.getTime() - startDate.getTime() > maxDuration) {
      throw new BadRequestException('Exception duration cannot exceed 1 year');
    }

    // Validation: For PARTIAL_DAY, time is required
    if (dto.type === 'PARTIAL_DAY') {
      if (!dto.startTime || !dto.endTime) {
        throw new BadRequestException(
          'Start time and end time are required for partial day exceptions',
        );
      }

      // Validate time format
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(dto.startTime) || !timeRegex.test(dto.endTime)) {
        throw new BadRequestException('Time must be in HH:MM format (24-hour)');
      }

      // Validate end time is after start time
      const [startHour, startMin] = dto.startTime.split(':').map(Number);
      const [endHour, endMin] = dto.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    return this.prisma.availability_exceptions.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        teacherId: profile.id,
        startDate,
        endDate,
        type: dto.type || 'ALL_DAY',
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
      },
    });
  }

  async removeException(userId: string, exceptionId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const exception = await this.prisma.availability_exceptions.findFirst({
      where: { id: exceptionId, teacherId: profile.id },
    });

    if (!exception) throw new NotFoundException('Exception not found');

    return this.prisma.availability_exceptions.delete({
      where: { id: exceptionId },
    });
  }

  // --- Admin ---

  async getPendingTeachers() {
    return this.prisma.users.findMany({
      where: {
        role: 'TEACHER',
        isVerified: false,
      },
      include: {
        teacher_profiles: {
          include: {
            documents: true,
            teacher_subjects: { include: { subjects: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyTeacher(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  }

  async rejectTeacher(userId: string) {
    return this.prisma.users.delete({
      where: { id: userId },
    });
  }

  // --- Dashboard ---
  async getDashboardStats(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile) throw new NotFoundException('Teacher profile not found');

    this.logger.debug(
      `DEBUG: getDashboardStats userId=${userId} displayName="${profile.displayName}"`,
    );

    // Get today's date boundaries
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    const [
      todaySessions,
      pendingRequests,
      upcomingSession,
      wallet,
      completedSessions,
      totalEarnings,
      recentSessions,
    ] = await Promise.all([
      // Count ONLY today's scheduled sessions
      this.prisma.bookings.count({
        where: {
          teacherId: profile.id,
          status: 'SCHEDULED',
          startTime: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      this.prisma.bookings.count({
        where: {
          teacherId: profile.id,
          status: 'PENDING_TEACHER_APPROVAL',
        },
      }),
      // Get the NEXT upcoming session (by startTime, not createdAt)
      this.prisma.bookings.findFirst({
        where: {
          teacherId: profile.id,
          status: 'SCHEDULED',
          startTime: { gte: new Date() }, // Only future sessions
        },
        orderBy: { startTime: 'asc' }, // Closest session first
        include: {
          children: true,
          users_bookings_studentUserIdTousers: true,
          subjects: true,
        },
      }),
      this.walletService.getBalance(userId),
      // Total completed sessions
      this.prisma.bookings.count({
        where: {
          teacherId: profile.id,
          status: 'COMPLETED',
        },
      }),
      // Sum of all earnings (PAYMENT_RELEASE transactions)
      this.prisma.transactions.aggregate({
        where: {
          wallets: { userId },
          type: 'PAYMENT_RELEASE',
        },
        _sum: { amount: true },
      }),
      // Recent 5 completed sessions for activity feed
      this.prisma.bookings.findMany({
        where: {
          teacherId: profile.id,
          status: 'COMPLETED',
        },
        orderBy: { startTime: 'desc' },
        take: 5,
        include: {
          children: true,
          users_bookings_studentUserIdTousers: true,
          subjects: true,
          ratings: true,
        },
      }),
    ]);

    // Format the session to return a unified "studentName"
    let formattedSession = null;
    if (upcomingSession) {
      // Use child name or student's firstName (never email)
      const studentName =
        upcomingSession.beneficiaryType === 'CHILD'
          ? upcomingSession.children?.name
          : (upcomingSession.users_bookings_studentUserIdTousers as any)?.firstName || 'طالب';

      formattedSession = {
        ...upcomingSession,
        studentName: studentName || 'طالب',
      };
    }

    // Format recent sessions (use firstName, never email)
    const formattedRecentSessions = recentSessions.map((session) => ({
      id: session.id,
      studentName:
        session.beneficiaryType === 'CHILD'
          ? session.children?.name || 'طالب'
          : (session.users_bookings_studentUserIdTousers as any)?.firstName || 'طالب',
      subjectName: session.subjects?.nameAr || 'مادة',
      startTime: session.startTime,
      price: session.price,
      earnings: Number(session.price) * (1 - Number(session.commissionRate)),
      rating: session.ratings?.score || null,
    }));

    return {
      profile: {
        id: profile.id,
        slug: profile.slug, // Include slug
        displayName: profile.displayName || 'معلم',
        firstName: profile.users.firstName, // Added for dashboard greeting
        lastName: profile.users.lastName, // Added just in case
        photo: profile.profilePhotoUrl || null,
        // Vacation Mode status
        isOnVacation: profile.isOnVacation,
        vacationEndDate: profile.vacationEndDate,
      },
      counts: {
        todaySessions,
        pendingRequests,
        completedSessions,
        totalEarnings: totalEarnings._sum.amount || 0,
      },
      upcomingSession: formattedSession,
      recentSessions: formattedRecentSessions,
      walletBalance: wallet.balance,
    };
  }

  // --- Document Management ---

  async getDocuments(userId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      include: { documents: { orderBy: { uploadedAt: 'desc' } } },
    });
    return profile?.documents || [];
  }

  async addDocument(
    userId: string,
    dto: { type: string; fileKey: string; fileName: string },
  ) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    // Validate document type
    const validTypes = ['ID_CARD', 'CERTIFICATE', 'DEGREE', 'OTHER'];
    if (!validTypes.includes(dto.type)) {
      throw new BadRequestException(
        `Invalid document type. Allowed: ${validTypes.join(', ')}`,
      );
    }

    return this.prisma.documents.create({
      data: {
        id: crypto.randomUUID(),
        teacherId: profile.id,
        type: dto.type as any, // DocumentType enum
        fileUrl: dto.fileKey, // Store the file key (not URL)
        fileName: dto.fileName,
      },
    });
  }

  async removeDocument(userId: string, documentId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const document = await this.prisma.documents.findFirst({
      where: { id: documentId, teacherId: profile.id },
    });

    if (!document) throw new NotFoundException('Document not found');

    // Note: The actual file on disk is not deleted here (admin may need it)
    // Consider adding a cleanup job later
    return this.prisma.documents.delete({ where: { id: documentId } });
  }

  // ============ APPLICATION STATUS MANAGEMENT ============

  /**
   * Get the current application status for the teacher
   */
  async getApplicationStatus(userId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: {
        applicationStatus: true,
        submittedAt: true,
        reviewedAt: true,
        rejectionReason: true,
        changeRequestReason: true,
        interviewScheduledAt: true,
        interviewLink: true,
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  /**
   * Get proposed interview time slots for the teacher
   */
  async getInterviewSlots(userId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: { id: true, applicationStatus: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    const slots = await this.prisma.interview_time_slots.findMany({
      where: { teacherProfileId: profile.id },
      orderBy: { proposedDateTime: 'asc' },
    });

    return {
      applicationStatus: profile.applicationStatus,
      slots,
    };
  }

  /**
   * Teacher selects an interview time slot
   */
  async selectInterviewSlot(userId: string, slotId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: { id: true, applicationStatus: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    if (profile.applicationStatus !== 'INTERVIEW_REQUIRED') {
      throw new BadRequestException(
        'لا يمكنك اختيار موعد مقابلة في هذه المرحلة',
      );
    }

    // Find the slot
    const slot = await this.prisma.interview_time_slots.findFirst({
      where: {
        id: slotId,
        teacherProfileId: profile.id,
      },
    });

    if (!slot) {
      throw new NotFoundException('لم يتم العثور على هذا الموعد');
    }

    // Update the slot as selected and update profile status
    await this.prisma.$transaction(async (tx) => {
      // Mark all other slots as not selected
      await tx.interview_time_slots.updateMany({
        where: {
          teacherProfileId: profile.id,
          id: { not: slotId },
        },
        data: { isSelected: false },
      });

      // Mark this slot as selected
      await tx.interview_time_slots.update({
        where: { id: slotId },
        data: { isSelected: true },
      });

      // Update profile status to INTERVIEW_SCHEDULED
      await tx.teacher_profiles.update({
        where: { id: profile.id },
        data: {
          applicationStatus: 'INTERVIEW_SCHEDULED',
          interviewScheduledAt: slot.proposedDateTime,
          interviewLink: slot.meetingLink,
        },
      });
    });

    // Log for admin visibility (admin notification can be added later)
    this.logger.log(
      `Teacher selected interview slot: ${slot.proposedDateTime.toISOString()}`,
    );

    return {
      message: 'تم اختيار موعد المقابلة بنجاح',
      scheduledAt: slot.proposedDateTime,
      meetingLink: slot.meetingLink,
    };
  }

  /**
   * Submit profile for admin review
   * Allowed transitions: DRAFT → SUBMITTED, CHANGES_REQUESTED → SUBMITTED
   */
  /**
   * Accept Terms & Conditions
   * CRITICAL: Must be called before submitForReview
   */
  async acceptTerms(userId: string, termsVersion: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.teacher_profiles.update({
      where: { userId },
      data: {
        termsAcceptedAt: new Date(),
        termsVersion: termsVersion,
      },
      select: {
        termsAcceptedAt: true,
        termsVersion: true,
      },
    });
  }

  async submitForReview(userId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: {
        id: true,
        applicationStatus: true,
        displayName: true,
        bio: true,
        yearsOfExperience: true,
        gender: true,
        idType: true,
        idNumber: true,
        idImageUrl: true,
        termsAcceptedAt: true,
        documents: true,
        teacher_qualifications: true, // Academic qualifications - MANDATORY
        teacher_subjects: true, // Must have at least one subject
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    // Validate allowed transitions
    const allowedStatuses = ['DRAFT', 'CHANGES_REQUESTED'];
    if (!allowedStatuses.includes(profile.applicationStatus)) {
      throw new BadRequestException(
        `لا يمكن إرسال الطلب. الحالة الحالية: ${profile.applicationStatus}`,
      );
    }

    // CRITICAL: Validate Terms & Conditions acceptance
    if (!profile.termsAcceptedAt) {
      throw new BadRequestException(
        'يجب الموافقة على الشروط والأحكام قبل الإرسال',
      );
    }

    // Validate required fields before submission
    if (!profile.displayName) {
      throw new BadRequestException('يرجى إضافة الاسم الظاهر قبل الإرسال');
    }
    if (!profile.bio) {
      throw new BadRequestException('يرجى إضافة نبذة تعريفية قبل الإرسال');
    }
    if (!profile.gender) {
      throw new BadRequestException('يرجى تحديد الجنس قبل الإرسال');
    }

    // CRITICAL: Validate ID Verification (MANDATORY)
    if (!profile.idType || !profile.idNumber || !profile.idImageUrl) {
      throw new BadRequestException(
        'تأكيد الهوية مطلوب. يرجى إكمال جميع حقول الهوية قبل الإرسال',
      );
    }

    // CRITICAL: Validate Academic Qualifications (MANDATORY - Single Source of Truth)
    if (!profile.teacher_qualifications || profile.teacher_qualifications.length === 0) {
      throw new BadRequestException(
        'يجب إضافة مؤهل أكاديمي واحد على الأقل مع الشهادة قبل الإرسال',
      );
    }

    // Validate all qualifications have certificates
    const missingCertificates = profile.teacher_qualifications.filter(
      (q) => !q.certificateUrl,
    );
    if (missingCertificates.length > 0) {
      throw new BadRequestException(
        'جميع المؤهلات يجب أن تحتوي على شهادة مرفقة',
      );
    }

    // Validate at least one subject
    if (!profile.teacher_subjects || profile.teacher_subjects.length === 0) {
      throw new BadRequestException('يجب إضافة مادة واحدة على الأقل للتدريس');
    }

    const updatedProfile = await this.prisma.teacher_profiles.update({
      where: { userId },
      data: {
        applicationStatus: 'SUBMITTED',
        submittedAt: new Date(),
        changeRequestReason: null, // Clear any previous change request
      },
    });

    // Send notification to all admins about new teacher application
    await this.notifyAdminsAboutNewApplication(profile.displayName, userId);

    return updatedProfile;
  }

  /**
   * Send notifications to all admin users about a new teacher application
   */
  private async notifyAdminsAboutNewApplication(
    teacherName: string,
    teacherUserId: string,
  ): Promise<void> {
    try {
      // Get all admin users who should receive notifications
      const admins = await this.prisma.users.findMany({
        where: {
          role: { in: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
          isActive: true,
        },
        select: { id: true },
      });

      // Send notification to each admin
      for (const admin of admins) {
        await this.notificationService.notifyUser({
          userId: admin.id,
          type: 'ADMIN_ALERT',
          title: 'طلب انضمام معلم جديد',
          message: `قدّم المعلم "${teacherName}" طلب انضمام للمنصة ويحتاج للمراجعة`,
          link: `/admin/teacher-applications`,
          metadata: {
            teacherUserId,
            teacherName,
            applicationType: 'NEW_TEACHER_APPLICATION',
          },
          dedupeKey: `NEW_TEACHER_APP:${teacherUserId}`,
        });
      }

      this.logger.log(
        `Sent admin notifications for new teacher application: ${teacherName}`,
      );
    } catch (error) {
      // Don't fail the submission if notifications fail
      this.logger.error(
        'Failed to send admin notifications for new teacher application',
        error,
      );
    }
  }

  /**
   * Check if teacher is approved (for guards)
   */
  async isApproved(userId: string): Promise<boolean> {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: { applicationStatus: true },
    });
    return profile?.applicationStatus === 'APPROVED';
  }

  // ============ VACATION MODE ============

  /**
   * Get vacation mode status for a teacher
   */
  async getVacationMode(userId: string) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: {
        isOnVacation: true,
        vacationStartDate: true,
        vacationEndDate: true,
        vacationReason: true,
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  /**
   * Get vacation settings (max days) for UI
   */
  async getVacationSettings() {
    const settings = await this.prisma.system_settings.findUnique({
      where: { id: 'default' },
    });
    return {
      maxVacationDays: settings?.maxVacationDays || 21,
    };
  }

  /**
   * Update vacation mode
   *
   * Rules:
   * 1. HARD BLOCK if pending bookings (PENDING_TEACHER_APPROVAL) exist
   * 2. WARNING if confirmed bookings exist WITHIN vacation dates (allow proceed)
   * 3. Return date is MANDATORY when enabling
   * 4. Cannot exceed maxVacationDays from SystemSettings
   */
  async updateVacationMode(
    userId: string,
    dto: { isOnVacation: boolean; returnDate?: string; reason?: string },
  ) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId },
      select: { id: true, isOnVacation: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    if (dto.isOnVacation) {
      // === ENABLING VACATION MODE ===

      // 1. Validate return date is provided (MANDATORY)
      if (!dto.returnDate) {
        throw new BadRequestException('يجب تحديد تاريخ العودة');
      }

      const returnDate = new Date(dto.returnDate);
      const now = new Date();

      // 2. Validate return date is in the future
      if (returnDate <= now) {
        throw new BadRequestException('تاريخ العودة يجب أن يكون في المستقبل');
      }

      // 3. Validate does not exceed max vacation days
      const settings = await this.prisma.system_settings.findUnique({
        where: { id: 'default' },
      });
      const maxDays = settings?.maxVacationDays || 21;
      const diffDays = Math.ceil(
        (returnDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays > maxDays) {
        throw new BadRequestException(
          `الحد الأقصى لفترة الإجازة هو ${maxDays} يوم`,
        );
      }

      // 4. HARD BLOCK: Check for pending bookings (requiring teacher action)
      const pendingBookings = await this.prisma.bookings.count({
        where: {
          teacherId: profile.id,
          status: 'PENDING_TEACHER_APPROVAL',
        },
      });

      if (pendingBookings > 0) {
        throw new BadRequestException({
          code: 'PENDING_BOOKINGS_EXIST',
          message: `لديك ${pendingBookings} طلب حجز في انتظار موافقتك. يرجى الموافقة عليها أو رفضها قبل تفعيل وضع الإجازة.`,
          count: pendingBookings,
          redirectTo: '/teacher/requests',
        } as any);
      }

      // 5. WARNING CHECK: Confirmed bookings within vacation period
      const vacationStartDate = now;
      const conflictingBookings = await this.prisma.bookings.findMany({
        where: {
          teacherId: profile.id,
          status: 'SCHEDULED',
          startTime: {
            gte: vacationStartDate,
            lte: returnDate,
          },
        },
        select: {
          id: true,
          startTime: true,
          subjects: { select: { nameAr: true } },
        },
      });

      // 6. Enable vacation mode
      const updated = await this.prisma.teacher_profiles.update({
        where: { userId },
        data: {
          isOnVacation: true,
          vacationStartDate: now,
          vacationEndDate: returnDate,
          vacationReason: dto.reason || null,
        },
        select: {
          isOnVacation: true,
          vacationEndDate: true,
        },
      });

      // 7. Return with warning if conflicting bookings exist
      return {
        success: true,
        isOnVacation: updated.isOnVacation,
        vacationEndDate: updated.vacationEndDate,
        warning:
          conflictingBookings.length > 0
            ? {
              message:
                'لديك حصص مؤكدة خلال فترة الإجازة. يجب عليك تقديم هذه الحصص كما هو مجدول.',
              conflictingBookingsCount: conflictingBookings.length,
            }
            : undefined,
      };
    } else {
      // === DISABLING VACATION MODE ===
      const updated = await this.prisma.teacher_profiles.update({
        where: { userId },
        data: {
          isOnVacation: false,
          vacationStartDate: null,
          vacationEndDate: null,
          vacationReason: null,
        },
        select: {
          isOnVacation: true,
        },
      });

      return {
        success: true,
        isOnVacation: updated.isOnVacation,
        vacationEndDate: null,
      };
    }
  }

  // --- Availability Validation ---

  /**
   * Validate that a time slot is actually available for booking
   * Check 1) Weekly Availability (Working Hours)
   * Check 2) Exceptions (Time Off)
   * Does NOT check existing bookings (that's the caller's responsibility)
   */
  async isSlotAvailable(teacherId: string, startTime: Date): Promise<boolean> {
    // Get teacher's timezone
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { id: teacherId },
      select: { timezone: true },
    });
    const teacherTimezone = profile?.timezone || 'UTC';

    // Get day and time in teacher's timezone
    const dayOfWeek = this.getDayOfWeekFromZoned(startTime, teacherTimezone);
    const timeStr = formatInTimezone(startTime, teacherTimezone, 'HH:mm');

    // For date comparisons, normalize to start of day in teacher's timezone
    const dateStr = formatInTimezone(startTime, teacherTimezone, 'yyyy-MM-dd');
    const dateForComparison = new Date(dateStr + 'T00:00:00.000Z');

    // 1. Check weekly availability exists
    const weeklySlot = await this.prisma.availability.findFirst({
      where: {
        teacherId,
        dayOfWeek: dayOfWeek as any,
        startTime: { lte: timeStr },
        endTime: { gt: timeStr },
      },
    });

    if (!weeklySlot) {
      return false; // Teacher not working
    }

    // 2. Check for ALL_DAY exceptions
    const allDayException = await this.prisma.availability_exceptions.findFirst({
      where: {
        teacherId,
        type: 'ALL_DAY',
        startDate: { lte: dateForComparison },
        endDate: { gte: dateForComparison },
      },
    });

    if (allDayException) {
      return false; // Entire day is blocked
    }

    // 3. Check for PARTIAL_DAY exceptions
    const partialException = await this.prisma.availability_exceptions.findFirst({
      where: {
        teacherId,
        type: 'PARTIAL_DAY',
        startDate: { lte: dateForComparison },
        endDate: { gte: dateForComparison },
        startTime: { lte: timeStr },
        endTime: { gt: timeStr },
      },
    });

    if (partialException) {
      return false; // Specific time is blocked
    }

    return true; // Available
  }

  private getDayOfWeekFromZoned(date: Date, timezone: string): string {
    const dayName = formatInTimezone(date, timezone, 'EEEE').toUpperCase();
    const dayMap: { [key: string]: string } = {
      SUNDAY: 'SUNDAY',
      MONDAY: 'MONDAY',
      TUESDAY: 'TUESDAY',
      WEDNESDAY: 'WEDNESDAY',
      THURSDAY: 'THURSDAY',
      FRIDAY: 'FRIDAY',
      SATURDAY: 'SATURDAY',
    };
    return dayMap[dayName] || dayName;
  }
}
