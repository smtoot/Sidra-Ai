import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Feature Flag Service
 *
 * Centralized service for managing feature flags across the application.
 * Supports both environment variable flags and database-driven flags.
 */
@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Check if Jitsi is enabled globally
   */
  isJitsiEnabled(): boolean {
    const enabled =
      this.configService.get<string>('JITSI_ENABLED', 'false') === 'true';
    this.logger.debug(`Jitsi global flag: ${enabled}`);
    return enabled;
  }

  /**
   * Check if Jitsi is enabled for a specific teacher
   * This allows gradual rollout to specific teachers
   */
  async isJitsiEnabledForTeacher(teacherId: string): Promise<boolean> {
    // First check global flag
    if (!this.isJitsiEnabled()) {
      return false;
    }

    // TODO: Add database check for per-teacher flags
    // For now, return global flag
    return true;
  }

  /**
   * Check if Jitsi is enabled for a specific booking
   */
  async isJitsiEnabledForBooking(booking: any): Promise<boolean> {
    // Check if Jitsi is explicitly disabled for this booking
    if (booking.useExternalMeetingLink) {
      return false;
    }

    // Check if teacher has Jitsi enabled
    return this.isJitsiEnabledForTeacher(booking.teacherId);
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
