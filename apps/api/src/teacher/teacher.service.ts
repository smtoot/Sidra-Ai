import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateTeacherProfileDto,
  CreateTeacherSubjectDto,
  CreateAvailabilityDto
} from '@sidra/shared';
import { EncryptionUtil } from '../common/utils/encryption.util';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) { }

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

  async getOnboardingProgress(userId: string) {
    const profile = await this.getProfile(userId);
    // Logic to calculate step 0-100% or step number
    return { hasCompletedOnboarding: profile.hasCompletedOnboarding, step: profile.onboardingStep };
  }
}
