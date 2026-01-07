import { Test, TestingModule } from '@nestjs/testing';
import { DemoService } from './demo.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DemoService', () => {
  let service: DemoService;
  let prisma: PrismaService;

  const mockPrismaBase = {
    teacher_demo_settings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    demo_sessions: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    teacher_profiles: {
      findUnique: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
    },
    system_settings: {
      findFirst: jest.fn().mockResolvedValue({ demosEnabled: true }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoService,
        { provide: PrismaService, useValue: mockPrismaBase },
      ],
    }).compile();

    service = module.get<DemoService>(DemoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  // =========================================================
  // canBookDemo
  // =========================================================
  describe('canBookDemo', () => {
    it('should return allowed:true if teacher enabled and no prior demo', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue({
        demoEnabled: true,
      });
      mockPrismaBase.demo_sessions.findUnique.mockResolvedValue(null); // No existing demo with this teacher
      mockPrismaBase.demo_sessions.count.mockResolvedValue(0); // No completed demos this month
      mockPrismaBase.demo_sessions.findFirst.mockResolvedValue(null); // No pending demo

      const result = await service.canBookDemo('student-1', 'teacher-1');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return DEMO_DISABLED if teacher has demos disabled', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue({
        demoEnabled: false,
      });

      const result = await service.canBookDemo('student-1', 'teacher-1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DEMO_DISABLED');
    });

    it('should return DEMO_DISABLED if teacher has no demo settings', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue(null);

      const result = await service.canBookDemo('student-1', 'teacher-1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DEMO_DISABLED');
    });

    it('should return TEACHER_ALREADY_USED if demo record exists with this teacher', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue({
        demoEnabled: true,
      });
      // findUnique with composite key finds existing demo
      mockPrismaBase.demo_sessions.findUnique.mockResolvedValue({
        id: 'demo-1',
        demoOwnerId: 'student-1',
        teacherId: 'teacher-1',
        status: 'SCHEDULED',
      });

      const result = await service.canBookDemo('student-1', 'teacher-1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('TEACHER_ALREADY_USED');
    });

    it('should return PENDING_EXISTS if pending demo session exists', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue({
        demoEnabled: true,
      });
      mockPrismaBase.demo_sessions.findUnique.mockResolvedValue(null); // No existing demo by composite key
      mockPrismaBase.demo_sessions.count.mockResolvedValue(0); // No completed demos this month
      mockPrismaBase.demo_sessions.findFirst.mockResolvedValue({
        id: 'demo-1',
        status: 'SCHEDULED',
      }); // But pending demo exists

      const result = await service.canBookDemo('student-1', 'teacher-1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('PENDING_EXISTS');
    });

    it('should return QUOTA_EXCEEDED if monthly quota reached', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue({
        demoEnabled: true,
      });
      mockPrismaBase.demo_sessions.findUnique.mockResolvedValue(null); // No existing demo by composite key
      mockPrismaBase.demo_sessions.count.mockResolvedValue(3); // Quota reached (assuming max is 3)

      const result = await service.canBookDemo('student-1', 'teacher-1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('QUOTA_EXCEEDED');
    });
  });

  // =========================================================
  // createDemoRecord
  // =========================================================
  describe('createDemoRecord', () => {
    beforeEach(() => {
      // Setup mocks for successful canBookDemo
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue({
        demoEnabled: true,
      });
      mockPrismaBase.demo_sessions.findUnique.mockResolvedValue(null); // No existing demo
      mockPrismaBase.demo_sessions.count.mockResolvedValue(0); // No completed demos this month
      mockPrismaBase.demo_sessions.findFirst.mockResolvedValue(null); // No pending demo
    });

    it('should create demo session with status SCHEDULED', async () => {
      mockPrismaBase.demo_sessions.create.mockResolvedValue({
        id: 'demo-1',
        demoOwnerId: 'student-1',
        demoOwnerType: 'STUDENT',
        teacherId: 'teacher-1',
        status: 'SCHEDULED',
      });

      // Pass 'STUDENT' as demoOwnerType (2nd arg)
      const result = await service.createDemoRecord(
        'student-1',
        'STUDENT' as any,
        'teacher-1',
      );

      expect(mockPrismaBase.demo_sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            demoOwnerId: 'student-1',
            demoOwnerType: 'STUDENT',
            teacherId: 'teacher-1',
            status: 'SCHEDULED',
            rescheduleCount: 0,
          }),
        }),
      );
    });

    it('should throw if demo already exists with this teacher', async () => {
      mockPrismaBase.demo_sessions.findUnique.mockResolvedValue({
        id: 'demo-1',
        demoOwnerId: 'student-1',
        teacherId: 'teacher-1',
        status: 'COMPLETED',
      }); // Demo exists with this teacher

      await expect(
        service.createDemoRecord('student-1', 'STUDENT' as any, 'teacher-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if teacher has demos disabled', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue({
        demoEnabled: false,
      });

      await expect(
        service.createDemoRecord('student-1', 'STUDENT' as any, 'teacher-1'),
      ).rejects.toThrow(BadRequestException);
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
        usedAt: null,
      };
      mockPrismaBase.demo_sessions.findUnique.mockResolvedValue(pendingDemo);
      mockPrismaBase.demo_sessions.update.mockResolvedValue({
        ...pendingDemo,
        usedAt: new Date(),
      });

      const result = await service.markDemoCompleted('student-1', 'teacher-1');

      expect(result.usedAt).not.toBeNull();
      expect(mockPrismaBase.demo_sessions.update).toHaveBeenCalledWith({
        where: { id: 'demo-1' },
        data: {
          status: 'COMPLETED',
          usedAt: expect.any(Date),
        },
      });
    });

    it('should throw if no demo session found', async () => {
      mockPrismaBase.demo_sessions.findUnique.mockResolvedValue(null);

      await expect(
        service.markDemoCompleted('student-1', 'teacher-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should be idempotent - return existing if already completed', async () => {
      const completedDemo = {
        id: 'demo-1',
        studentId: 'student-1',
        teacherId: 'teacher-1',
        status: 'COMPLETED',
        usedAt: new Date('2024-01-01'),
      };
      mockPrismaBase.demo_sessions.findUnique.mockResolvedValue(completedDemo);

      const result = await service.markDemoCompleted('student-1', 'teacher-1');

      // Should return existing without update
      expect(mockPrismaBase.demo_sessions.update).not.toHaveBeenCalled();
      expect(result.usedAt).toEqual(completedDemo.usedAt);
    });
  });

  // =========================================================
  // updateDemoSettings
  // =========================================================
  describe('updateDemoSettings', () => {
    it('should upsert teacher demo settings', async () => {
      mockPrismaBase.teacher_demo_settings.upsert.mockResolvedValue({
        teacherId: 'teacher-1',
        demoEnabled: true,
      });

      const result = await service.updateDemoSettings('teacher-1', true);

      expect(result.demoEnabled).toBe(true);
      expect(mockPrismaBase.teacher_demo_settings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacherId: 'teacher-1' },
          create: expect.objectContaining({ teacherId: 'teacher-1', demoEnabled: true }),
          update: { demoEnabled: true },
        }),
      );
    });
  });

  // =========================================================
  // getDemoSettings
  // =========================================================
  describe('getDemoSettings', () => {
    it('should return demo settings if exists', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue({
        demoEnabled: true,
      });

      const result = await service.getDemoSettings('teacher-1');

      expect(result).toEqual({ demoEnabled: true });
    });

    it('should return null if no settings exist', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue(null);

      const result = await service.getDemoSettings('teacher-1');

      expect(result).toBeNull();
    });
  });

  // =========================================================
  // isTeacherDemoEnabled
  // =========================================================
  describe('isTeacherDemoEnabled', () => {
    it('should return true if demo enabled', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue({
        demoEnabled: true,
      });

      const result = await service.isTeacherDemoEnabled('teacher-1');

      expect(result).toBe(true);
    });

    it('should return false if demo disabled', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue({
        demoEnabled: false,
      });

      const result = await service.isTeacherDemoEnabled('teacher-1');

      expect(result).toBe(false);
    });

    it('should return false if no settings exist', async () => {
      mockPrismaBase.teacher_demo_settings.findUnique.mockResolvedValue(null);

      const result = await service.isTeacherDemoEnabled('teacher-1');

      expect(result).toBe(false);
    });
  });
});
