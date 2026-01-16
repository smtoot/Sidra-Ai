import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Feature Flag Service
 *
 * Centralized service for managing feature flags across the application.
 * Supports both environment variable flags and database-driven flags.
 * Database settings take priority over environment variables.
 */
@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Check if Jitsi is enabled globally (async - reads from DB)
   * Priority: DB `jitsiConfig.enabled` > Env `JITSI_ENABLED` > Default false
   */
  async isJitsiEnabled(): Promise<boolean> {
    try {
      const settings = await this.prisma.system_settings.findUnique({
        where: { id: 'default' },
      });

      const jitsiConfig = (settings?.jitsiConfig as any) || {};

      // If DB has explicit setting, use it
      if (typeof jitsiConfig.enabled === 'boolean') {
        this.logger.debug(`Jitsi global flag (DB): ${jitsiConfig.enabled}`);
        return jitsiConfig.enabled;
      }

      // Fallback to environment variable
      const envEnabled =
        this.configService.get<string>('JITSI_ENABLED', 'false') === 'true';
      this.logger.debug(`Jitsi global flag (ENV): ${envEnabled}`);
      return envEnabled;
    } catch (error) {
      this.logger.warn(`Error reading Jitsi flag from DB: ${error.message}`);
      // Fallback to env var on error
      return (
        this.configService.get<string>('JITSI_ENABLED', 'false') === 'true'
      );
    }
  }

  /**
   * Check if Jitsi is enabled for a specific teacher
   * Requires BOTH global flag AND per-teacher whitelist
   * Admin controls both: global toggle + per-teacher enablement
   */
  async isJitsiEnabledForTeacher(teacherId: string): Promise<boolean> {
    // First check global flag
    const globalEnabled = await this.isJitsiEnabled();
    if (!globalEnabled) {
      this.logger.debug(`Jitsi disabled globally, skipping teacher check`);
      return false;
    }

    // Then check if teacher is whitelisted
    try {
      const teacher = await this.prisma.teacher_profiles.findUnique({
        where: { id: teacherId },
        select: { jitsiEnabled: true },
      });

      const teacherEnabled = teacher?.jitsiEnabled ?? false;
      this.logger.debug(
        `Jitsi for teacher ${teacherId}: ${teacherEnabled ? 'enabled' : 'disabled'}`,
      );
      return teacherEnabled;
    } catch (error) {
      this.logger.warn(
        `Error checking Jitsi flag for teacher ${teacherId}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Check if Jitsi is enabled for a specific booking
   * Admin-controlled: checks global flag AND teacher whitelist
   */
  async isJitsiEnabledForBooking(booking: any): Promise<boolean> {
    // Check if teacher is enabled for Jitsi (includes global check)
    const teacherId = booking.teacherId;
    if (!teacherId) {
      this.logger.warn('Booking has no teacherId, cannot check Jitsi status');
      return false;
    }

    return this.isJitsiEnabledForTeacher(teacherId);
  }

  /**
   * Get the appropriate meeting method for a booking
   */
  async getMeetingMethod(booking: any): Promise<'jitsi' | 'external'> {
    const jitsiEnabled = await this.isJitsiEnabledForBooking(booking);

    if (jitsiEnabled && booking.jitsiRoomId) {
      return 'jitsi';
    }

    if (booking.meetingLink) {
      return 'external';
    }

    // Default to jitsi if enabled, even if no room ID yet
    return jitsiEnabled ? 'jitsi' : 'external';
  }
}
