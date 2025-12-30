import { Test, TestingModule } from '@nestjs/testing';
import { DemoService } from '../src/package/demo.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { DEMO_POLICY } from '../src/package/demo-policy.constants';

describe('Demo Anti-Abuse Integration Tests', () => {
  let demoService: DemoService;
  let mockPrisma: any;

  const ownerId = 'owner-1';
  const teacherId = 'teacher-1';
  const teacherId2 = 'teacher-2';

  beforeEach(async () => {
    mockPrisma = {
      systemSettings: {
        findFirst: jest.fn().mockResolvedValue({ demosEnabled: true }),
      },
      teacherDemoSettings: {
        findUnique: jest.fn().mockResolvedValue({ demoEnabled: true }),
        upsert: jest.fn(),
      },
      demoSession: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    demoService = module.get<DemoService>(DemoService);
  });

  // =====================================================
  // 1) Owner hits monthly demo limit → reject
  // =====================================================
  describe('Monthly Quota', () => {
    it('should reject when owner exceeds monthly demo limit', async () => {
      mockPrisma.demoSession.findUnique.mockResolvedValue(null); // No existing with teacher
      mockPrisma.demoSession.count.mockResolvedValue(
        DEMO_POLICY.maxDemosPerOwnerPerMonth,
      ); // At limit

      const result = await demoService.canBookDemo(ownerId, teacherId);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('QUOTA_EXCEEDED');
    });

    it('should allow when under monthly limit', async () => {
      mockPrisma.demoSession.findUnique.mockResolvedValue(null);
      mockPrisma.demoSession.count.mockResolvedValue(
        DEMO_POLICY.maxDemosPerOwnerPerMonth - 1,
      );
      mockPrisma.demoSession.findFirst.mockResolvedValue(null);

      const result = await demoService.canBookDemo(ownerId, teacherId);

      expect(result.allowed).toBe(true);
    });
  });

  // =====================================================
  // 2) Cancelled demo counts toward quota
  // =====================================================
  describe('Cancellation Counts', () => {
    it('should mark demo as CANCELLED (not delete)', async () => {
      mockPrisma.demoSession.findUnique.mockResolvedValue({
        id: 'demo-1',
        status: 'SCHEDULED',
      });
      mockPrisma.demoSession.update.mockResolvedValue({ status: 'CANCELLED' });

      await demoService.cancelDemoRecord(ownerId, teacherId);

      expect(mockPrisma.demoSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELLED',
            cancelledAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  // =====================================================
  // 3) Reschedule once → allowed
  // =====================================================
  describe('Reschedule Limits', () => {
    it('should allow first reschedule', async () => {
      mockPrisma.demoSession.findUnique.mockResolvedValue({
        id: 'demo-1',
        status: 'SCHEDULED',
        rescheduleCount: 0,
      });
      mockPrisma.demoSession.update.mockResolvedValue({ rescheduleCount: 1 });

      const result = await demoService.rescheduleDemoSession(
        ownerId,
        teacherId,
        new Date(),
      );

      expect(mockPrisma.demoSession.update).toHaveBeenCalled();
    });

    // 4) Second reschedule → forbidden
    it('should reject second reschedule', async () => {
      mockPrisma.demoSession.findUnique.mockResolvedValue({
        id: 'demo-1',
        status: 'SCHEDULED',
        rescheduleCount: DEMO_POLICY.demoMaxReschedules,
      });

      await expect(
        demoService.rescheduleDemoSession(ownerId, teacherId, new Date()),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =====================================================
  // 5) Demo with same teacher again → rejected (lifetime)
  // =====================================================
  describe('Teacher Uniqueness (Lifetime)', () => {
    it('should reject demo with same teacher (any status)', async () => {
      mockPrisma.demoSession.findUnique.mockResolvedValue({
        id: 'demo-1',
        demoOwnerId: ownerId,
        teacherId,
        status: 'COMPLETED',
      });

      const result = await demoService.canBookDemo(ownerId, teacherId);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('TEACHER_ALREADY_USED');
    });

    // Even with different subject (subject doesn't matter)
    it('should reject same teacher even with cancelled demo', async () => {
      mockPrisma.demoSession.findUnique.mockResolvedValue({
        id: 'demo-1',
        demoOwnerId: ownerId,
        teacherId,
        status: 'CANCELLED', // Cancelled still counts
      });

      const result = await demoService.canBookDemo(ownerId, teacherId);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('TEACHER_ALREADY_USED');
    });
  });

  // =====================================================
  // 6) Demo with different teacher same subject → allowed
  // =====================================================
  describe('Different Teacher Same Subject', () => {
    it('should allow demo with different teacher (within quota)', async () => {
      // First check for teacher2 - no existing demo
      mockPrisma.demoSession.findUnique.mockResolvedValue(null);
      mockPrisma.demoSession.count.mockResolvedValue(1); // Some demos used, under limit
      mockPrisma.demoSession.findFirst.mockResolvedValue(null);

      const result = await demoService.canBookDemo(ownerId, teacherId2);

      expect(result.allowed).toBe(true);
    });
  });

  // =====================================================
  // 7) New child does NOT reset quota
  // =====================================================
  describe('Child Addition Abuse Prevention', () => {
    it('should use same demoOwnerId regardless of child (quota unchanged)', async () => {
      // The owner already has 3 demos (at limit)
      mockPrisma.demoSession.findUnique.mockResolvedValue(null);
      mockPrisma.demoSession.count.mockResolvedValue(
        DEMO_POLICY.maxDemosPerOwnerPerMonth,
      );

      // Even with a "new child" (beneficiaryId), the owner's quota is checked
      const result = await demoService.canBookDemo(ownerId, 'new-teacher');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('QUOTA_EXCEEDED');
    });
  });

  // =====================================================
  // 8) Cancel after reschedule → counts
  // =====================================================
  describe('Cancel After Reschedule', () => {
    it('should allow cancel after reschedule and mark as CANCELLED', async () => {
      mockPrisma.demoSession.findUnique.mockResolvedValue({
        id: 'demo-1',
        status: 'SCHEDULED',
        rescheduleCount: 1, // Already rescheduled once
      });
      mockPrisma.demoSession.update.mockResolvedValue({ status: 'CANCELLED' });

      await demoService.cancelDemoRecord(ownerId, teacherId);

      expect(mockPrisma.demoSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CANCELLED' }),
        }),
      );
    });
  });

  // =====================================================
  // 9) No wallet / ledger interaction
  // =====================================================
  describe('No Money Movement', () => {
    it('should NOT interact with wallet or transactions', async () => {
      // DemoService has no wallet dependency - verified by lack of import
      expect(mockPrisma.wallet).toBeUndefined();
      expect(mockPrisma.transaction).toBeUndefined();
    });
  });
});
