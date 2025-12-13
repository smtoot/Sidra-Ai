"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_util_1 = require("../common/utils/encryption.util");
let TeacherService = class TeacherService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const profile = await this.prisma.teacherProfile.findUnique({
            where: { userId },
            include: {
                subjects: { include: { subject: true, curriculum: true } },
                availability: true,
                documents: true,
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Teacher profile not found');
        }
        return profile;
    }
    async updateProfile(userId, dto) {
        let encryptedLink = undefined;
        if (dto.meetingLink) {
            encryptedLink = await encryption_util_1.EncryptionUtil.encrypt(dto.meetingLink);
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
            },
        });
    }
    async addSubject(userId, dto) {
        const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
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
    async removeSubject(userId, subjectId) {
        const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        const subject = await this.prisma.teacherSubject.findFirst({
            where: { id: subjectId, teacherId: profile.id },
        });
        if (!subject)
            throw new common_1.NotFoundException('Subject not found for this teacher');
        return this.prisma.teacherSubject.delete({ where: { id: subjectId } });
    }
    async setAvailability(userId, dto) {
        const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
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
    async removeAvailability(userId, availabilityId) {
        const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        const slot = await this.prisma.availability.findFirst({
            where: { id: availabilityId, teacherId: profile.id }
        });
        if (!slot)
            throw new common_1.NotFoundException('Slot not found');
        return this.prisma.availability.delete({ where: { id: availabilityId } });
    }
    async getOnboardingProgress(userId) {
        const profile = await this.getProfile(userId);
        return { hasCompletedOnboarding: profile.hasCompletedOnboarding, step: profile.onboardingStep };
    }
};
exports.TeacherService = TeacherService;
exports.TeacherService = TeacherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeacherService);
//# sourceMappingURL=teacher.service.js.map