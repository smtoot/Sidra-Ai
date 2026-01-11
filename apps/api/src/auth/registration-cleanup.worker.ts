import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegistrationCleanupWorker {
  private readonly logger = new Logger(RegistrationCleanupWorker.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cleanup expired pending registrations
   * Runs every 10 minutes (more frequent than spec's 15 min for better cleanup)
   * Deletes records older than 24 hours
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanupExpiredRegistrations() {
    this.logger.log('🧹 Running pending registration cleanup...');

    try {
      const now = new Date();
      const expiryThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      // Delete expired pending registrations
      const result = await this.prisma.pending_registrations.deleteMany({
        where: {
          createdAt: { lte: expiryThreshold },
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `✅ Cleaned up ${result.count} expired pending registrations`,
        );
      } else {
        this.logger.debug('No expired pending registrations to cleanup');
      }

      return { deleted: result.count };
    } catch (error) {
      this.logger.error('Failed to cleanup expired registrations:', error);
      return { deleted: 0, error: error.message };
    }
  }

  /**
   * Cleanup old rate limit records
   * Runs every hour
   * Deletes records older than 2 hours (beyond the 1-hour window)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldRateLimits() {
    this.logger.log('🧹 Running rate limit cleanup...');

    try {
      const now = new Date();
      const expiryThreshold = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

      const result = await this.prisma.otp_rate_limits.deleteMany({
        where: {
          windowStartsAt: { lte: expiryThreshold },
        },
      });

      if (result.count > 0) {
        this.logger.log(`✅ Cleaned up ${result.count} old rate limit records`);
      } else {
        this.logger.debug('No old rate limit records to cleanup');
      }

      return { deleted: result.count };
    } catch (error) {
      this.logger.error('Failed to cleanup rate limits:', error);
      return { deleted: 0, error: error.message };
    }
  }
}
