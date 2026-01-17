import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingConstants } from './booking.constants';

@Injectable()
export class BookingSystemSettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get system settings (with defaults)
   *
   * Reads the singleton `system_settings` row and creates it with defaults if it does not exist.
   */
  async getSystemSettings() {
    let settings = await this.prisma.system_settings.findUnique({
      where: { id: 'default' },
    });

    // Create default settings if not exist
    if (!settings) {
      settings = await this.prisma.system_settings.create({
        data: {
          id: 'default',
          confirmationWindowHours: BookingConstants.DISPUTE_WINDOW_HOURS,
          autoReleaseEnabled: true,
          reminderHoursBeforeRelease:
            BookingConstants.CONFIRMATION_REMINDER_INTERVALS_HOURS[0],
          defaultCommissionRate: BookingConstants.DEFAULT_COMMISSION_RATE,
          updatedAt: new Date(),
        },
      });
    }

    return settings;
  }
}
