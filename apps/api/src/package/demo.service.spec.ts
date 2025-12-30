import { Test, TestingModule } from '@nestjs/testing';
import { DemoService } from './demo.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DemoService', () => {
    let service: DemoService;
    let prisma: PrismaService;

    const mockPrismaBase = {
        teacherDemoSettings: {
            findUnique: jest.fn(),
            upsert: jest.fn()
        },
        demoSession: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
        },
        teacherProfile: {
            findUnique: jest.fn()
        },
        booking: {
            findFirst: jest.fn()
        },
        systemSettings: {
            findFirst: jest.fn().mockResolvedValue({ demosEnabled: true })
        }
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DemoService,
                { provide: PrismaService, useValue: mockPrismaBase }
            ]
        }).compile();

        service = module.get<DemoService>(DemoService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    // =========================================================
    // canBookDemo
    // =========================================================
    describe('canBookDemo', () => {
        it('should return allowed:true if teacher enabled and no prior demo', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue({ demoEnabled: true });
            mockPrismaBase.demoSession.findFirst.mockResolvedValue(null); // No completed or pending demo
            mockPrismaBase.booking.findFirst.mockResolvedValue(null); // No pending booking

            const result = await service.canBookDemo('student-1', 'teacher-1');

            expect(result.allowed).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        it('should return DEMO_DISABLED if teacher has demos disabled', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue({ demoEnabled: false });

            const result = await service.canBookDemo('student-1', 'teacher-1');

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('DEMO_DISABLED');
        });

        it('should return DEMO_DISABLED if teacher has no demo settings', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue(null);

            const result = await service.canBookDemo('student-1', 'teacher-1');

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('DEMO_DISABLED');
        });

        it('should return ALREADY_USED if demo was completed', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue({ demoEnabled: true });
            // First findFirst call (completed demos with usedAt not null)
            mockPrismaBase.demoSession.findFirst.mockResolvedValueOnce({
                usedAt: new Date() // completed
            });

            const result = await service.canBookDemo('student-1', 'teacher-1');

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('ALREADY_USED');
        });

        it('should return PENDING_EXISTS if pending demo session exists', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue({ demoEnabled: true });
            // First findFirst call (completed demos) - returns null
            mockPrismaBase.demoSession.findFirst
                .mockResolvedValueOnce(null) // No completed demo
                .mockResolvedValueOnce({ usedAt: null }); // But pending demo exists
            mockPrismaBase.booking.findFirst.mockResolvedValue(null); // No pending booking

            const result = await service.canBookDemo('student-1', 'teacher-1');

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('PENDING_EXISTS');
        });

        it('should return PENDING_EXISTS if pending booking exists', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue({ demoEnabled: true });
            mockPrismaBase.demoSession.findFirst
                .mockResolvedValueOnce(null) // No completed demo
                .mockResolvedValueOnce(null); // No pending demo session
            mockPrismaBase.booking.findFirst.mockResolvedValue({ id: 'booking-1' }); // Pending booking exists

            const result = await service.canBookDemo('student-1', 'teacher-1');

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('PENDING_EXISTS');
        });
    });

    // =========================================================
    // createDemoRecord
    // =========================================================
    describe('createDemoRecord', () => {
        beforeEach(() => {
            // Setup mocks for successful canBookDemo
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue({ demoEnabled: true });
            mockPrismaBase.demoSession.findFirst.mockResolvedValue(null);
            mockPrismaBase.booking.findFirst.mockResolvedValue(null);
        });

        it('should create demo session with usedAt = null', async () => {
            mockPrismaBase.demoSession.create.mockResolvedValue({
                id: 'demo-1',
                studentId: 'student-1',
                teacherId: 'teacher-1',
                usedAt: null
            });

            const result = await service.createDemoRecord('student-1', 'teacher-1');

            expect(result.usedAt).toBeNull();
            expect(mockPrismaBase.demoSession.create).toHaveBeenCalledWith({
                data: {
                    studentId: 'student-1',
                    teacherId: 'teacher-1',
                    usedAt: null
                }
            });
        });

        it('should throw if demo already exists (completed)', async () => {
            mockPrismaBase.demoSession.findFirst.mockResolvedValueOnce({ usedAt: new Date() }); // Completed demo exists

            await expect(service.createDemoRecord('student-1', 'teacher-1'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw if teacher has demos disabled', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue({ demoEnabled: false });

            await expect(service.createDemoRecord('student-1', 'teacher-1'))
                .rejects.toThrow(BadRequestException);
        });
    });

    // =========================================================
    // markDemoCompleted
    // =========================================================
    describe('markDemoCompleted', () => {
        it('should set usedAt to current timestamp', async () => {
            const pendingDemo = {
                id: 'demo-1',
                studentId: 'student-1',
                teacherId: 'teacher-1',
                usedAt: null
            };
            mockPrismaBase.demoSession.findUnique.mockResolvedValue(pendingDemo);
            mockPrismaBase.demoSession.update.mockResolvedValue({
                ...pendingDemo,
                usedAt: new Date()
            });

            const result = await service.markDemoCompleted('student-1', 'teacher-1');

            expect(result.usedAt).not.toBeNull();
            expect(mockPrismaBase.demoSession.update).toHaveBeenCalledWith({
                where: { id: 'demo-1' },
                data: { usedAt: expect.any(Date) }
            });
        });

        it('should throw if no demo session found', async () => {
            mockPrismaBase.demoSession.findUnique.mockResolvedValue(null);

            await expect(service.markDemoCompleted('student-1', 'teacher-1'))
                .rejects.toThrow(NotFoundException);
        });

        it('should be idempotent - return existing if already completed', async () => {
            const completedDemo = {
                id: 'demo-1',
                studentId: 'student-1',
                teacherId: 'teacher-1',
                usedAt: new Date('2024-01-01')
            };
            mockPrismaBase.demoSession.findUnique.mockResolvedValue(completedDemo);

            const result = await service.markDemoCompleted('student-1', 'teacher-1');

            // Should return existing without update
            expect(mockPrismaBase.demoSession.update).not.toHaveBeenCalled();
            expect(result.usedAt).toEqual(completedDemo.usedAt);
        });
    });

    // =========================================================
    // updateDemoSettings
    // =========================================================
    describe('updateDemoSettings', () => {
        it('should upsert teacher demo settings', async () => {
            mockPrismaBase.teacherDemoSettings.upsert.mockResolvedValue({
                teacherId: 'teacher-1',
                demoEnabled: true
            });

            const result = await service.updateDemoSettings('teacher-1', true);

            expect(result.demoEnabled).toBe(true);
            expect(mockPrismaBase.teacherDemoSettings.upsert).toHaveBeenCalledWith({
                where: { teacherId: 'teacher-1' },
                create: { teacherId: 'teacher-1', demoEnabled: true },
                update: { demoEnabled: true }
            });
        });
    });

    // =========================================================
    // getDemoSettings
    // =========================================================
    describe('getDemoSettings', () => {
        it('should return demo settings if exists', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue({
                demoEnabled: true
            });

            const result = await service.getDemoSettings('teacher-1');

            expect(result).toEqual({ demoEnabled: true });
        });

        it('should return null if no settings exist', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue(null);

            const result = await service.getDemoSettings('teacher-1');

            expect(result).toBeNull();
        });
    });

    // =========================================================
    // isTeacherDemoEnabled
    // =========================================================
    describe('isTeacherDemoEnabled', () => {
        it('should return true if demo enabled', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue({
                demoEnabled: true
            });

            const result = await service.isTeacherDemoEnabled('teacher-1');

            expect(result).toBe(true);
        });

        it('should return false if demo disabled', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue({
                demoEnabled: false
            });

            const result = await service.isTeacherDemoEnabled('teacher-1');

            expect(result).toBe(false);
        });

        it('should return false if no settings exist', async () => {
            mockPrismaBase.teacherDemoSettings.findUnique.mockResolvedValue(null);

            const result = await service.isTeacherDemoEnabled('teacher-1');

            expect(result).toBe(false);
        });
    });
});
