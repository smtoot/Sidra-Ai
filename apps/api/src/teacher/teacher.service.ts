import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateTeacherProfileDto,
  CreateTeacherSubjectDto,
  CreateAvailabilityDto,
  CreateExceptionDto
} from '@sidra/shared';
import { EncryptionUtil } from '../common/utils/encryption.util';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class TeacherService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService
  ) { }

  async getProfile(userId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      include: {
        subjects: { include: { subject: true, curriculum: true } },
        availability: true,
        documents: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Teacher profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateTeacherProfileDto) {
    let encryptedLink = undefined;
    if (dto.meetingLink) {
      encryptedLink = await EncryptionUtil.encrypt(dto.meetingLink);
    }

    return this.prisma.teacherProfile.update({
      where: { userId },
      data: {
        displayName: dto.displayName,
        fullName: dto.fullName,
        bio: dto.bio,
        yearsOfExperience: dto.yearsOfExperience,
        education: dto.education,
        gender: dto.gender,
        timezone: dto.timezone,  // Save timezone
        profilePhotoUrl: dto.profilePhotoUrl,
        introVideoUrl: dto.introVideoUrl,
        encryptedMeetingLink: encryptedLink,
        // Personal/Contact info
        whatsappNumber: dto.whatsappNumber,
        city: dto.city,
        country: dto.country,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        // Mark onboarding as complete if basic info is present (simplification for MVP)
        // hasCompletedOnboarding: true, 
      },
    });
  }

  async addSubject(userId: string, dto: CreateTeacherSubjectDto) {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // 1. Validation: Verify Subject exists
    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject || !subject.isActive) throw new NotFoundException('Subject not found or inactive');

    // 2. Validation: Verify Curriculum exists
    const curriculum = await this.prisma.curriculum.findUnique({ where: { id: dto.curriculumId } });
    if (!curriculum || !curriculum.isActive) throw new NotFoundException('Curriculum not found or inactive');

    // 3. Validation: Verify Grades
    if (!dto.gradeLevelIds || dto.gradeLevelIds.length === 0) {
      throw new BadRequestException('At least one grade level is required');
    }

    // Fetch provided grades with their stages -> curriculum to validate consistency
    const uniqueGradeIds = [...new Set(dto.gradeLevelIds)]; // Deduplicate
    const grades = await this.prisma.gradeLevel.findMany({
      where: { id: { in: uniqueGradeIds } },
      include: { stage: true }
    });

    if (grades.length !== uniqueGradeIds.length) {
      throw new BadRequestException('One or more invalid grade IDs provided');
    }

    // 4. Validation: Enforce Consistency (All grades must belong to the selected Curriculum)
    const invalidGrades = grades.filter(g => g.stage.curriculumId !== dto.curriculumId);
    if (invalidGrades.length > 0) {
      throw new BadRequestException('All selected grades must belong to the selected curriculum');
    }

    // 5. Transactional Creation
    return this.prisma.$transaction(async (tx) => {
      // Create TeacherSubject
      const teacherSubject = await tx.teacherSubject.create({
        data: {
          teacherId: profile.id,
          subjectId: dto.subjectId,
          curriculumId: dto.curriculumId,
          pricePerHour: dto.pricePerHour,
        },
      });

      // Create Join Rows (TeacherSubjectGrade)
      await tx.teacherSubjectGrade.createMany({
        data: uniqueGradeIds.map(gradeId => ({
          teacherSubjectId: teacherSubject.id,
          gradeLevelId: gradeId
        }))
      });

      return teacherSubject;
    });
  }

  async removeSubject(userId: string, subjectId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // Verify ownership
    const subject = await this.prisma.teacherSubject.findFirst({
      where: { id: subjectId, teacherId: profile.id },
    });

    if (!subject) throw new NotFoundException('Subject not found for this teacher');

    return this.prisma.teacherSubject.delete({ where: { id: subjectId } });
  }

  async setAvailability(userId: string, dto: CreateAvailabilityDto) {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // Check if slot exists for this day/time to avoid duplicates?
    // For MVP, simplistic add. Or maybe replace availability for that day?
    // Let's allow creating slots.

    return this.prisma.availability.create({
      data: {
        teacherId: profile.id,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isRecurring: dto.isRecurring,
      },
    });
  }

  async removeAvailability(userId: string, availabilityId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const slot = await this.prisma.availability.findFirst({
      where: { id: availabilityId, teacherId: profile.id }
    });

    if (!slot) throw new NotFoundException('Slot not found');

    return this.prisma.availability.delete({ where: { id: availabilityId } });
  }

  async replaceAvailability(userId: string, slots: CreateAvailabilityDto[]) {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // Use transaction to ensure atomicity: delete all existing, then create new
    return this.prisma.$transaction(async (prisma) => {
      // Delete all existing availability for this teacher
      await prisma.availability.deleteMany({
        where: { teacherId: profile.id }
      });

      // Create new slots in bulk
      if (slots.length > 0) {
        await prisma.availability.createMany({
          data: slots.map(slot => ({
            teacherId: profile.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isRecurring: slot.isRecurring ?? true
          }))
        });
      }

      // Return updated availability
      return prisma.availability.findMany({
        where: { teacherId: profile.id },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
      });
    });
  }

  async getOnboardingProgress(userId: string) {
    const profile = await this.getProfile(userId);
    // Logic to calculate step 0-100% or step number
    return { hasCompletedOnboarding: profile.hasCompletedOnboarding, step: profile.onboardingStep };
  }

  // --- Exception Management ---

  async getExceptions(userId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      include: { availabilityExceptions: { orderBy: { startDate: 'asc' } } }
    });
    return profile?.availabilityExceptions || [];
  }

  async addException(userId: string, dto: CreateExceptionDto) {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.availabilityException.create({
      data: {
        teacherId: profile.id,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        type: dto.type || 'ALL_DAY',
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason
      }
    });
  }

  async removeException(userId: string, exceptionId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const exception = await this.prisma.availabilityException.findFirst({
      where: { id: exceptionId, teacherId: profile.id }
    });

    if (!exception) throw new NotFoundException('Exception not found');

    return this.prisma.availabilityException.delete({ where: { id: exceptionId } });
  }

  // --- Admin ---

  async getPendingTeachers() {
    return this.prisma.user.findMany({
      where: {
        role: 'TEACHER',
        isVerified: false
      },
      include: {
        teacherProfile: {
          include: {
            documents: true,
            subjects: { include: { subject: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async verifyTeacher(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });
  }

  async rejectTeacher(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId }
    });
  }

  // --- Dashboard ---
  async getDashboardStats(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile) throw new NotFoundException('Teacher profile not found');

    console.log(`DEBUG: getDashboardStats userId=${userId} displayName="${profile.displayName}"`);

    // Get today's date boundaries
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const [todaySessions, pendingRequests, upcomingSession, wallet, completedSessions, totalEarnings, recentSessions] = await Promise.all([
      // Count ONLY today's scheduled sessions
      this.prisma.booking.count({
        where: {
          teacherId: profile.id,
          status: 'SCHEDULED',
          startTime: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      }),
      this.prisma.booking.count({
        where: {
          teacherId: profile.id,
          status: 'PENDING_TEACHER_APPROVAL'
        }
      }),
      // Get the NEXT upcoming session (by startTime, not createdAt)
      this.prisma.booking.findFirst({
        where: {
          teacherId: profile.id,
          status: 'SCHEDULED',
          startTime: { gte: new Date() } // Only future sessions
        },
        orderBy: { startTime: 'asc' }, // Closest session first
        include: {
          child: true,
          studentUser: true,
          subject: true
        }
      }),
      this.walletService.getBalance(userId),
      // Total completed sessions
      this.prisma.booking.count({
        where: {
          teacherId: profile.id,
          status: 'COMPLETED'
        }
      }),
      // Sum of all earnings (PAYMENT_RELEASE transactions)
      this.prisma.transaction.aggregate({
        where: {
          wallet: { userId },
          type: 'PAYMENT_RELEASE'
        },
        _sum: { amount: true }
      }),
      // Recent 5 completed sessions for activity feed
      this.prisma.booking.findMany({
        where: {
          teacherId: profile.id,
          status: 'COMPLETED'
        },
        orderBy: { startTime: 'desc' },
        take: 5,
        include: {
          child: true,
          studentUser: true,
          subject: true,
          rating: true
        }
      })
    ]);

    // Format the session to return a unified "studentName"
    let formattedSession = null;
    if (upcomingSession) {
      // Use child name or student's firstName (never email)
      const studentName = upcomingSession.beneficiaryType === 'CHILD'
        ? upcomingSession.child?.name
        : (upcomingSession.studentUser as any)?.firstName || 'طالب';

      formattedSession = {
        ...upcomingSession,
        studentName: studentName || 'طالب'
      };
    }

    // Format recent sessions (use firstName, never email)
    const formattedRecentSessions = recentSessions.map(session => ({
      id: session.id,
      studentName: session.beneficiaryType === 'CHILD'
        ? session.child?.name || 'طالب'
        : (session.studentUser as any)?.firstName || 'طالب',
      subjectName: session.subject?.nameAr || 'مادة',
      startTime: session.startTime,
      price: session.price,
      earnings: Number(session.price) * (1 - Number(session.commissionRate)),
      rating: session.rating?.score || null
    }));

    return {
      profile: {
        id: profile.id,
        displayName: profile.displayName || 'معلم',
        photo: profile.profilePhotoUrl || null
      },
      counts: {
        todaySessions,
        pendingRequests,
        completedSessions,
        totalEarnings: totalEarnings._sum.amount || 0
      },
      upcomingSession: formattedSession,
      recentSessions: formattedRecentSessions,
      walletBalance: wallet.balance
    };
  }

  // --- Document Management ---

  async getDocuments(userId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      include: { documents: { orderBy: { uploadedAt: 'desc' } } }
    });
    return profile?.documents || [];
  }

  async addDocument(userId: string, dto: { type: string; fileKey: string; fileName: string }) {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // Validate document type
    const validTypes = ['ID_CARD', 'CERTIFICATE', 'DEGREE', 'OTHER'];
    if (!validTypes.includes(dto.type)) {
      throw new BadRequestException(`Invalid document type. Allowed: ${validTypes.join(', ')}`);
    }

    return this.prisma.document.create({
      data: {
        teacherId: profile.id,
        type: dto.type as any, // DocumentType enum
        fileUrl: dto.fileKey, // Store the file key (not URL)
        fileName: dto.fileName,
      }
    });
  }

  async removeDocument(userId: string, documentId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, teacherId: profile.id }
    });

    if (!document) throw new NotFoundException('Document not found');

    // Note: The actual file on disk is not deleted here (admin may need it)
    // Consider adding a cleanup job later
    return this.prisma.document.delete({ where: { id: documentId } });
  }

  // ============ APPLICATION STATUS MANAGEMENT ============

  /**
   * Get the current application status for the teacher
   */
  async getApplicationStatus(userId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      select: {
        applicationStatus: true,
        submittedAt: true,
        reviewedAt: true,
        rejectionReason: true,
        changeRequestReason: true,
        interviewScheduledAt: true,
        interviewLink: true,
      }
    });

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  /**
   * Submit profile for admin review
   * Allowed transitions: DRAFT → SUBMITTED, CHANGES_REQUESTED → SUBMITTED
   */
  async submitForReview(userId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        applicationStatus: true,
        displayName: true,
        bio: true,
        education: true,
        yearsOfExperience: true,
        documents: true,
      }
    });

    if (!profile) throw new NotFoundException('Profile not found');

    // Validate allowed transitions
    const allowedStatuses = ['DRAFT', 'CHANGES_REQUESTED'];
    if (!allowedStatuses.includes(profile.applicationStatus)) {
      throw new BadRequestException(
        `لا يمكن إرسال الطلب. الحالة الحالية: ${profile.applicationStatus}`
      );
    }

    // Validate required fields before submission
    if (!profile.displayName) {
      throw new BadRequestException('يرجى إضافة الاسم الظاهر قبل الإرسال');
    }
    if (!profile.bio) {
      throw new BadRequestException('يرجى إضافة نبذة تعريفية قبل الإرسال');
    }

    return this.prisma.teacherProfile.update({
      where: { userId },
      data: {
        applicationStatus: 'SUBMITTED',
        submittedAt: new Date(),
        changeRequestReason: null, // Clear any previous change request
      }
    });
  }

  /**
   * Check if teacher is approved (for guards)
   */
  async isApproved(userId: string): Promise<boolean> {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      select: { applicationStatus: true }
    });
    return profile?.applicationStatus === 'APPROVED';
  }
}

