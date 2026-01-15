import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  parseTimeInTimezoneToUTC,
  formatInTimezone,
} from '../common/utils/timezone.util';
import {
  addDays,
  format,
  startOfDay,
  eachDayOfInterval,
  isEqual,
  subMinutes,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ar } from 'date-fns/locale';

@Injectable()
export class AvailabilitySlotService {
  private readonly logger = new Logger(AvailabilitySlotService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generates or refreshes slots for a teacher over a 30-day horizon.
   */
  async generateSlotsForTeacher(
    teacherId: string,
    horizonDays: number = 31,
    txOverride?: Prisma.TransactionClient,
  ) {
    this.logger.log(
      `Regenerating slots for teacher ${teacherId} (Horizon: ${horizonDays} days)`,
    );

    const executeGeneration = async (tx: Prisma.TransactionClient) => {
      // 1. Acquire Advisory Lock (Per-Teacher)
      // This synchronizes slot generation with the booking write path
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext($1))`,
        teacherId,
      );

      // 2. Fetch Profile inside the transaction to see latest committed state
      const profile = await tx.teacher_profiles.findUnique({
        where: { id: teacherId },
        include: {
          availability: true,
          availability_exceptions: true,
        },
      });

      if (!profile) {
        this.logger.warn(`Teacher profile not found for ID: ${teacherId}`);
        return;
      }

      const teacherTimezone = profile.timezone || 'UTC';
      const nowUtc = new Date();

      // Normalize horizon to teacher's current local time
      const teacherNow = toZonedTime(nowUtc, teacherTimezone);
      const horizonEnd = addDays(teacherNow, horizonDays);
      const dates = eachDayOfInterval({ start: teacherNow, end: horizonEnd });

      const newSlotsData: any[] = [];
      let skippedByBooking = 0;
      let skippedByException = 0;

      for (const date of dates) {
        const dateStr = format(date, 'yyyy-MM-dd');

        // 2a. Check vacation
        if (
          profile.isOnVacation &&
          profile.vacationStartDate &&
          profile.vacationEndDate &&
          date >= startOfDay(profile.vacationStartDate) &&
          date <= startOfDay(profile.vacationEndDate)
        ) {
          continue;
        }

        const dayOfWeek = format(date, 'EEEE').toUpperCase();
        const dailyRules = profile.availability.filter(
          (a) => a.dayOfWeek === dayOfWeek,
        );

        for (const rule of dailyRules) {
          const potentialSlots = this.expandToHalfHourSlots(
            rule.startTime,
            rule.endTime,
          );

          for (const slotStartTimeStr of potentialSlots) {
            const startTimeUtc = parseTimeInTimezoneToUTC(
              slotStartTimeStr,
              dateStr,
              teacherTimezone,
            );

            // Only generate slots in the future
            if (startTimeUtc < nowUtc) continue;

            const endTimeUtc = new Date(
              startTimeUtc.getTime() + 60 * 60 * 1000,
            ); // 1h session

            // 2b. Check exceptions
            const isBlocked = this.isTimeBlockedByException(
              startTimeUtc,
              endTimeUtc,
              profile.availability_exceptions,
              teacherTimezone,
            );
            if (isBlocked) {
              skippedByException++;
              continue;
            }

            // 2c. Check existing bookings (Overlap safe)
            const hasBooking = await tx.bookings.findFirst({
              where: {
                teacherId,
                startTime: { lt: endTimeUtc },
                endTime: { gt: startTimeUtc },
                status: {
                  in: [
                    'SCHEDULED',
                    'PENDING_TEACHER_APPROVAL',
                    'WAITING_FOR_PAYMENT',
                    'PAYMENT_REVIEW',
                    'PENDING_CONFIRMATION',
                  ] as any[],
                },
              },
            });

            if (hasBooking) {
              skippedByBooking++;
              continue;
            }

            newSlotsData.push({
              id: crypto.randomUUID(),
              teacherId,
              startTimeUtc,
              endTimeUtc,
              localDate: dateStr,
            });
          }
        }
      }

      // 3. Atomic Swap: Delete future slots and insert new ones
      await tx.teacher_session_slots.deleteMany({
        where: {
          teacherId,
          startTimeUtc: { gte: nowUtc },
        },
      });

      if (newSlotsData.length > 0) {
        await tx.teacher_session_slots.createMany({
          data: newSlotsData,
          skipDuplicates: true, // Safety
        });
      }

      this.logger.log(
        `Regenerated slots for teacher ${teacherId}: ` +
          `${newSlotsData.length} created, ${skippedByBooking} skipped (bookings), ` +
          `${skippedByException} skipped (exceptions).`,
      );
    };

    if (txOverride) {
      await executeGeneration(txOverride);
    } else {
      await this.prisma.$transaction(async (tx) => {
        await executeGeneration(tx);
      });
    }
  }

  /**
   * Deletes all slots for a teacher that overlap with a given time range.
   * Logic: slot.startTime < range.endTime AND (slot.startTime + 1h) > range.startTime
   */
  async deleteOverlappingSlots(
    tx: Prisma.TransactionClient,
    teacherId: string,
    startTime: Date,
    endTime: Date,
  ) {
    // Since our slots are 60 mins fixed, a booking from S to E blocks:
    // Any slot starting between (S - 59 mins) and (E - 1 min)
    const overlapStart = subMinutes(startTime, 59);

    const deleted = await tx.teacher_session_slots.deleteMany({
      where: {
        teacherId,
        startTimeUtc: {
          gt: overlapStart,
          lt: endTime,
        },
      },
    });

    this.logger.log(
      `Deleted ${deleted.count} overlapping slots for teacher ${teacherId} for booking ${startTime.toISOString()} - ${endTime.toISOString()}`,
    );
  }

  /**
   * Re-creates a slot if it was previously consumed but the booking is now cancelled/rejected.
   * SUBJECT TO: Current availability rules and NO conflicts with other bookings.
   */
  async restoreSlot(
    tx: Prisma.TransactionClient,
    teacherId: string,
    startTimeUtc: Date,
  ) {
    // 1. Only restore for FUTURE slots
    if (startTimeUtc < new Date()) {
      return;
    }

    // 2. Check horizon (e.g., 30 days) - slightly lenient (31) to avoid edge cases
    const horizonLimit = addDays(new Date(), 31);
    if (startTimeUtc > horizonLimit) {
      return;
    }

    // 3. Check if teacher is on vacation
    const profile = await tx.teacher_profiles.findUnique({
      where: { id: teacherId },
      select: {
        isOnVacation: true,
        timezone: true,
        vacationStartDate: true,
        vacationEndDate: true,
      },
    });

    if (!profile) return;

    if (
      profile.isOnVacation &&
      profile.vacationStartDate &&
      profile.vacationEndDate
    ) {
      const startVac = startOfDay(profile.vacationStartDate);
      const endVac = startOfDay(profile.vacationEndDate);
      const slotDate = startOfDay(startTimeUtc);
      if (slotDate >= startVac && slotDate <= endVac) {
        return;
      }
    }

    // 2. Check weekly availability
    const teacherTz = profile.timezone || 'UTC';
    const dayOfWeek = formatInTimezone(
      startTimeUtc,
      teacherTz,
      'EEEE',
    ).toUpperCase();
    const timeStr = formatInTimezone(startTimeUtc, teacherTz, 'HH:mm');

    const rules = await tx.availability.findMany({
      where: {
        teacherId,
        dayOfWeek: dayOfWeek as any,
      },
    });

    const isAvailableInRules = rules.some(
      (r: any) => timeStr >= r.startTime && timeStr < r.endTime,
    );

    if (!isAvailableInRules) {
      return;
    }

    // 3. Check exceptions
    const exceptions = await tx.availability_exceptions.findMany({
      where: {
        teacherId,
        startDate: { lte: startTimeUtc },
        endDate: { gte: startTimeUtc },
      },
    });

    for (const ex of exceptions) {
      if (ex.type === 'ALL_DAY') return;
      // For partial day, we need to check if startTimeUtc falls within the exception window
      const exDate = format(ex.startDate, 'yyyy-MM-dd');
      const exStartUtc = parseTimeInTimezoneToUTC(
        ex.startTime!,
        exDate,
        teacherTz,
      );
      const exEndUtc = parseTimeInTimezoneToUTC(ex.endTime!, exDate, teacherTz);

      if (startTimeUtc >= exStartUtc && startTimeUtc < exEndUtc) {
        return;
      }
    }

    // 4. Check for booking conflicts
    const conflict = await tx.bookings.findFirst({
      where: {
        teacherId,
        startTime: { lte: startTimeUtc },
        endTime: { gt: startTimeUtc },
        status: {
          in: [
            'SCHEDULED',
            'PENDING_TEACHER_APPROVAL',
            'WAITING_FOR_PAYMENT',
            'PENDING_CONFIRMATION',
            'PAYMENT_REVIEW',
          ] as any,
        },
      },
    });

    if (conflict) {
      return;
    }

    // 5. Restore the slot
    const localDate = formatInTimezone(startTimeUtc, teacherTz, 'yyyy-MM-dd');
    const endTimeUtc = new Date(startTimeUtc.getTime() + 60 * 60 * 1000); // Fixed 60 min sessions

    await tx.teacher_session_slots.upsert({
      where: {
        teacherId_startTimeUtc: {
          teacherId,
          startTimeUtc,
        },
      },
      create: {
        teacherId,
        startTimeUtc,
        endTimeUtc,
        localDate,
      },
      update: {}, // No-op if exists
    });

    this.logger.log(
      `Slot restored for teacher: ${teacherId} at ${startTimeUtc.toISOString()}`,
    );
  }

  /**
   * Get available slots for a teacher on a specific date.
   * Matches the user's selected date (dateStr) in their timezone.
   */
  async getSlotsForDay(
    teacherId: string,
    dateStr: string,
    userTimezone?: string,
  ) {
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { id: teacherId },
      select: { timezone: true },
    });
    const teacherTimezone = profile?.timezone || 'UTC';
    const effectiveUserTimezone = userTimezone || teacherTimezone;

    // Use built-in logic to handle user day UTC window
    const { start, end } = this.buildUtcWindowForUserDate(
      dateStr,
      effectiveUserTimezone,
    );

    const slots = await this.prisma.teacher_session_slots.findMany({
      where: {
        teacherId,
        startTimeUtc: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { startTimeUtc: 'asc' },
    });

    const now = new Date();

    return {
      slots: slots
        .filter((s) => s.startTimeUtc > now)
        .map((s) => ({
          id: s.id, // V2 uses slotId for booking
          startTimeUtc: s.startTimeUtc.toISOString(),
          label: formatInTimezone(
            s.startTimeUtc,
            effectiveUserTimezone,
            'h:mm a',
          ),
          userDate: dateStr,
        })),
      teacherTimezone,
      userTimezone: effectiveUserTimezone,
    };
  }

  /**
   * Get availability summary for a month (YYYY-MM).
   */
  async getMonthAvailability(teacherId: string, month: string) {
    // We query by localDate prefix "YYYY-MM"
    const slots = await this.prisma.teacher_session_slots.findMany({
      where: {
        teacherId,
        localDate: { startsWith: month },
        startTimeUtc: { gt: new Date() },
      },
      select: { localDate: true, startTimeUtc: true },
      orderBy: { startTimeUtc: 'asc' },
    });

    const availableDates = Array.from(new Set(slots.map((s) => s.localDate)));

    // For next available slot, we can just take the first one from the sorted list
    let nextAvailableSlot = null;
    if (slots.length > 0) {
      const first = slots[0];
      const profile = await this.prisma.teacher_profiles.findUnique({
        where: { id: teacherId },
        select: { timezone: true },
      });
      const tz = profile?.timezone || 'UTC';
      const zonedDate = toZonedTime(first.startTimeUtc, tz);

      const arabicTime = format(zonedDate, 'h:mm a', { locale: ar })
        .replace('AM', 'صباحاً')
        .replace('PM', 'مساءً')
        .replace('am', 'صباحاً')
        .replace('pm', 'مساءً');

      nextAvailableSlot = {
        date: first.localDate,
        time: arabicTime,
        startTimeUtc: first.startTimeUtc.toISOString(),
        display: this.formatNextAvailableDisplay(first.localDate, arabicTime),
      };
    }

    return {
      availableDates,
      fullyBookedDates: [], // In V2, we don't distinguish yet, but could be added later if needed
      nextAvailableSlot,
    };
  }

  private buildUtcWindowForUserDate(dateStr: string, timezone: string) {
    const dayStartLocal = `${dateStr}T00:00:00`;
    const dayStartUtc = fromZonedTime(dayStartLocal, timezone);
    const dayEndLocal = `${dateStr}T23:59:59.999`;
    const dayEndUtc = fromZonedTime(dayEndLocal, timezone);
    return { start: dayStartUtc, end: dayEndUtc };
  }

  private formatNextAvailableDisplay(date: string, time: string): string {
    const slotDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    slotDate.setHours(0, 0, 0, 0);

    if (slotDate.getTime() === today.getTime()) {
      return `اليوم في ${time}`;
    } else if (slotDate.getTime() === tomorrow.getTime()) {
      return `غداً في ${time}`;
    } else {
      return `${date} في ${time}`;
    }
  }

  /**
   * Daily cleanup of stale slots.
   */
  async cleanupPastSlots() {
    const deleted = await this.prisma.teacher_session_slots.deleteMany({
      where: {
        startTimeUtc: { lt: new Date() },
      },
    });
    this.logger.log(`Cleaned up ${deleted.count} past slots.`);
  }

  private expandToHalfHourSlots(startTime: string, endTime: string): string[] {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Period must be at least 60 minutes.
    // Iteration stops such that the last slot has at least 60 minutes left.
    for (let m = startMinutes; m <= endMinutes - 60; m += 30) {
      const hour = Math.floor(m / 60);
      const min = m % 60;
      slots.push(
        `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
      );
    }

    return slots;
  }

  private isTimeBlockedByException(
    start: Date,
    end: Date,
    exceptions: any[],
    timezone: string,
  ): boolean {
    const timeStr = formatInTimezone(start, timezone, 'HH:mm');
    const endTimeStr = formatInTimezone(end, timezone, 'HH:mm');
    const currentDay = startOfDay(toZonedTime(start, timezone));

    for (const exc of exceptions) {
      const excStart = startOfDay(toZonedTime(exc.startDate, timezone));
      const excEnd = startOfDay(toZonedTime(exc.endDate, timezone));

      if (currentDay >= excStart && currentDay <= excEnd) {
        if (exc.type === 'ALL_DAY') return true;
        if (exc.type === 'PARTIAL_DAY') {
          // Overlap check for partial day: (excStart < slotEnd) AND (excEnd > slotStart)
          if (timeStr < exc.endTime && endTimeStr > exc.startTime) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Synchronizes slots for all active teachers.
   * Useful for migration or manual recovery.
   */
  async syncAllTeachersSlots() {
    this.logger.log('Starting global slot synchronization...');
    const teachers = await this.prisma.teacher_profiles.findMany({
      select: { id: true },
    });

    let success = 0;
    let failed = 0;

    for (const teacher of teachers) {
      try {
        await this.generateSlotsForTeacher(teacher.id);
        success++;
      } catch (error: any) {
        this.logger.error(
          `Failed to sync slots for teacher ${teacher.id}: ${error.message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `Global slot synchronization complete: ${success} successful, ${failed} failed.`,
    );
    return { success, failed };
  }
}
