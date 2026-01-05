import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';

// Use string literals for enums to avoid import issues
const NotificationType = {
  BOOKING_REQUEST: 'BOOKING_REQUEST',
} as const;

const NotificationStatus = {
  READ: 'READ',
  UNREAD: 'UNREAD',
} as const;

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              updateMany: jest.fn(),
            },
            emailOutbox: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createInAppNotification', () => {
    it('should create a notification successfully', async () => {
      (prisma.notifications.create as jest.Mock).mockResolvedValue({
        id: 'test-id',
      });

      const result = await service.createInAppNotification({
        userId: 'user-1',
        title: 'Test Title',
        message: 'Test Message',
        type: NotificationType.BOOKING_REQUEST as any,
      });

      expect(result).toBe(true);
      expect(prisma.notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Test Title',
          message: 'Test Message',
          type: NotificationType.BOOKING_REQUEST,
          status: NotificationStatus.UNREAD,
        }),
      });
    });

    it('should skip duplicate notification with same dedupeKey (idempotency)', async () => {
      // Simulate unique constraint violation (P2002)
      const uniqueError = new Error('Unique constraint failed');
      (uniqueError as any).code = 'P2002';
      (prisma.notifications.create as jest.Mock).mockRejectedValue(uniqueError);

      const result = await service.createInAppNotification({
        userId: 'user-1',
        title: 'Test',
        message: 'Test',
        type: NotificationType.BOOKING_REQUEST as any,
        dedupeKey: 'BOOKING_REQUEST:booking-1:user-1',
      });

      // Should return false (skipped) instead of throwing
      expect(result).toBe(false);
    });

    it('should throw on non-dedupe errors', async () => {
      const genericError = new Error('Some other DB error');
      (prisma.notifications.create as jest.Mock).mockRejectedValue(
        genericError,
      );

      await expect(
        service.createInAppNotification({
          userId: 'user-1',
          title: 'Test',
          message: 'Test',
          type: NotificationType.BOOKING_REQUEST as any,
        }),
      ).rejects.toThrow('Some other DB error');
    });
  });

  describe('enqueueEmail', () => {
    it('should enqueue email to outbox', async () => {
      (prisma.email_outbox.create as jest.Mock).mockResolvedValue({
        id: 'email-1',
      });

      await service.enqueueEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        templateId: 'booking-confirmation',
        payload: { bookingId: 'booking-1' },
      });

      expect(prisma.email_outbox.create).toHaveBeenCalledWith({
        data: {
          to: 'test@example.com',
          subject: 'Test Subject',
          templateId: 'booking-confirmation',
          payload: { bookingId: 'booking-1' },
        },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', async () => {
      (prisma.notifications.count as jest.Mock).mockResolvedValue(5);

      const count = await service.getUnreadCount('user-1');

      expect(count).toBe(5);
      expect(prisma.notifications.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: NotificationStatus.UNREAD,
        },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read and set readAt', async () => {
      (prisma.notifications.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await service.markAsRead('notification-1', 'user-1');

      expect(result).toBe(true);
      expect(prisma.notifications.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'notification-1',
          userId: 'user-1',
          status: NotificationStatus.UNREAD,
        },
        data: expect.objectContaining({
          status: NotificationStatus.READ,
          readAt: expect.any(Date),
        }),
      });
    });

    it('should return false if notification not found or not owned by user', async () => {
      (prisma.notifications.updateMany as jest.Mock).mockResolvedValue({
        count: 0,
      });

      const result = await service.markAsRead('notification-1', 'wrong-user');

      expect(result).toBe(false);
    });
  });
});
