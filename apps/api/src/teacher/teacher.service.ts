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
        bio: dto.bio,
        yearsOfExperience: dto.yearsOfExperience,
        education: dto.education,
        gender: dto.gender,
        encryptedMeetingLink: encryptedLink,
        // Mark onboarding as complete if basic info is present (simplification for MVP)
        // hasCompletedOnboarding: true, 
      },
    });
  }

  async addSubject(userId: string, dto: CreateTeacherSubjectDto) {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.teacherSubject.create({
      data: {
        teacherId: profile.id,
        subjectId: dto.subjectId,
        curriculumId: dto.curriculumId,
        pricePerHour: dto.pricePerHour,
        gradeLevels: dto.gradeLevels,
      },
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

    const [todaySessions, pendingRequests, upcomingSession, wallet] = await Promise.all([
      this.prisma.booking.count({
        where: {
          teacherId: profile.id,
          status: 'SCHEDULED',
        }
      }),
      this.prisma.booking.count({
        where: {
          teacherId: profile.id,
          status: 'PENDING_TEACHER_APPROVAL'
        }
      }),
      this.prisma.booking.findFirst({
        where: {
          teacherId: profile.id,
          status: 'SCHEDULED',
        },
        orderBy: { createdAt: 'asc' },
        include: {
          child: true,
          studentUser: true,
          subject: true
        }
      }),
      this.walletService.getBalance(userId)
    ]);

    // Format the session to return a unified "studentName"
    let formattedSession = null;
    if (upcomingSession) {
      const studentName = upcomingSession.beneficiaryType === 'CHILD'
        ? upcomingSession.child?.name
        : upcomingSession.studentUser?.email; // Or displayName if available on User

      formattedSession = {
        ...upcomingSession,
        studentName: studentName || 'Unknown Student'
      };
    }

    return {
      profile: {
        // @ts-ignore
        displayName: 'Teacher',
        photo: null
      },
      counts: {
        todaySessions,
        pendingRequests
      },
      upcomingSession: formattedSession,
      walletBalance: wallet.balance
    };
  }
}
