import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AvailabilitySlotService } from './availability-slot.service';

@Injectable()
export class SlotScheduler {
  private readonly logger = new Logger(SlotScheduler.name);

  constructor(private availabilitySlotService: AvailabilitySlotService) {}

  /**
   * Run every night at 3 AM to cleanup past slots
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleSlotCleanup() {
    this.logger.log('Running daily slot cleanup...');
    try {
      await this.availabilitySlotService.cleanupPastSlots();
      this.logger.log('Daily slot cleanup complete');
    } catch (error) {
      this.logger.error('Slot cleanup failed', error);
    }
  }
}
