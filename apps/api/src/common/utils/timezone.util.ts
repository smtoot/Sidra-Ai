/**
 * Timezone Utilities for Backend
 * 
 * Architecture: UTC-First
 * - All storage and computation happens in UTC
 * - Timezones are for INPUT (parsing teacher/user times) and OUTPUT (display) only
 * 
 * IMPORTANT: Never use `new Date()` for timezone-aware parsing!
 * Always use `toDate()` or `fromZonedTime()` from date-fns-tz
 */

import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

// ============================================================================
// CORE CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert a time string in a specific timezone to UTC DateTime for a specific date.
 * 
 * CORRECT way to parse teacher's local time into UTC.
 * 
 * @param timeStr Time in HH:mm format (e.g., "09:00")
 * @param dateStr Date in YYYY-MM-DD format
 * @param timezone IANA timezone (e.g., "Asia/Tokyo")
 * @returns UTC DateTime
 * 
 * @example
 * // Teacher in Tokyo sets availability at 9:00 AM local time
 * parseTimeInTimezoneToUTC("09:00", "2025-12-24", "Asia/Tokyo")
 * // Returns: 2025-12-24T00:00:00.000Z (midnight UTC = 9 AM Tokyo)
 */
export function parseTimeInTimezoneToUTC(
    timeStr: string,
    dateStr: string,
    timezone: string
): Date {
    // Build ISO string (without Z - it's local to the timezone)
    const localDateTimeStr = `${dateStr}T${timeStr}:00`;

    // fromZonedTime: Treat the datetime as if it's in the given timezone,
    // and convert to UTC. This is the CORRECT way.
    return fromZonedTime(localDateTimeStr, timezone);
}

/**
 * Convert UTC DateTime to time string in a specific timezone.
 * 
 * @param utcDate UTC DateTime
 * @param timezone IANA timezone
 * @returns Time string in HH:mm format
 */
export function utcToTimeInTimezone(utcDate: Date, timezone: string): string {
    const zonedTime = toZonedTime(utcDate, timezone);
    return format(zonedTime, 'HH:mm');
}

/**
 * Format a UTC DateTime for display in a specific timezone.
 * 
 * IMPORTANT: In date-fns-tz v3, we must first convert to zoned time,
 * then format with the regular format function.
 */
export function formatInTimezone(
    utcDate: Date,
    timezone: string,
    formatString: string = 'h:mm a'  // Default: "9:00 AM"
): string {
    // First convert UTC to the target timezone
    const zonedTime = toZonedTime(utcDate, timezone);
    // Then format with regular date-fns format
    return format(zonedTime, formatString);
}

// ============================================================================
// UTC WINDOW BUILDERS
// ============================================================================

/**
 * Build a UTC time window for a user's selected date in their timezone.
 * 
 * This is critical for correct day-boundary handling:
 * - User selects "December 24" in their calendar
 * - We need Dec 24 00:00 → Dec 24 23:59:59 in USER'S timezone
 * - Then convert that to UTC for database queries
 * 
 * @param dateStr Date selected by user (YYYY-MM-DD)
 * @param userTimezone User's IANA timezone
 * @returns UTC start and end of the user's day
 * 
 * @example
 * // User in Tokyo selects December 24
 * buildUtcWindowForUserDate("2025-12-24", "Asia/Tokyo")
 * // Returns: {
 * //   start: 2025-12-23T15:00:00.000Z  (Dec 24 00:00 JST)
 * //   end: 2025-12-24T14:59:59.999Z    (Dec 24 23:59 JST)
 * // }
 */
export function buildUtcWindowForUserDate(
    dateStr: string,
    userTimezone: string
): { start: Date; end: Date } {
    // Build start of day (00:00:00) in user's timezone
    const dayStartLocal = `${dateStr}T00:00:00`;
    const dayStartUtc = fromZonedTime(dayStartLocal, userTimezone);

    // Build end of day (23:59:59.999) in user's timezone
    const dayEndLocal = `${dateStr}T23:59:59.999`;
    const dayEndUtc = fromZonedTime(dayEndLocal, userTimezone);

    return { start: dayStartUtc, end: dayEndUtc };
}

/**
 * Get the dates in teacher's timezone that overlap with a UTC window.
 * 
 * When user selects a day, the UTC window might span multiple teacher-local days.
 * This returns which teacher dates we need to check for availability.
 * 
 * @param utcWindow UTC time window
 * @param teacherTimezone Teacher's IANA timezone
 * @returns Array of date strings (YYYY-MM-DD) in teacher's timezone
 */
export function getTeacherDatesInUtcWindow(
    utcWindow: { start: Date; end: Date },
    teacherTimezone: string
): string[] {
    // Convert UTC bounds to teacher's local time
    const teacherStart = toZonedTime(utcWindow.start, teacherTimezone);
    const teacherEnd = toZonedTime(utcWindow.end, teacherTimezone);

    const dates: string[] = [];
    let current = startOfDay(teacherStart);
    const endDay = startOfDay(teacherEnd);

    // Collect all teacher-local dates that overlap
    while (current <= endDay) {
        dates.push(format(current, 'yyyy-MM-dd'));
        current = addDays(current, 1);
    }

    return dates;
}

// ============================================================================
// SLOT GENERATION
// ============================================================================

/**
 * Slot object with UTC timestamp and display information.
 */
export interface SlotWithTimezone {
    startTimeUtc: string;      // ISO 8601 UTC - canonical identifier
    label: string;             // Display label in user's timezone (e.g., "9:30 AM")
    userDate: string;          // Date in user's timezone (YYYY-MM-DD)
}

/**
 * Generate slot times from start to end in 30-minute intervals.
 * 
 * @param startTime Start time (HH:mm)
 * @param endTime End time (HH:mm)
 * @returns Array of time strings
 */
export function expandToHalfHourSlots(startTime: string, endTime: string): string[] {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    for (let m = startMinutes; m < endMinutes; m += 30) {
        const hour = Math.floor(m / 60);
        const min = m % 60;
        slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }

    return slots;
}

/**
 * Convert a slot (date + time in teacher timezone) to a SlotWithTimezone object.
 * 
 * @param teacherDateStr Date in teacher's timezone (YYYY-MM-DD)
 * @param teacherTimeStr Time in teacher's timezone (HH:mm)
 * @param teacherTimezone Teacher's IANA timezone
 * @param userTimezone User's IANA timezone
 * @returns SlotWithTimezone object or null if conversion fails
 */
export function convertSlotToUserTimezone(
    teacherDateStr: string,
    teacherTimeStr: string,
    teacherTimezone: string,
    userTimezone: string
): SlotWithTimezone {
    // Convert teacher's local time to UTC
    const slotUtc = parseTimeInTimezoneToUTC(teacherTimeStr, teacherDateStr, teacherTimezone);

    // Format for display in user's timezone
    const label = formatInTimezone(slotUtc, userTimezone, 'h:mm a');
    const userDate = formatInTimezone(slotUtc, userTimezone, 'yyyy-MM-dd');

    return {
        startTimeUtc: slotUtc.toISOString(),
        label,
        userDate
    };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate IANA timezone string.
 */
export function isValidTimezone(timezone: string): boolean {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;
    } catch {
        return false;
    }
}

/**
 * Get display name for a timezone.
 */
export function getTimezoneDisplayName(timezone: string): string {
    try {
        const formatter = new Intl.DateTimeFormat('en', {
            timeZone: timezone,
            timeZoneName: 'short'
        });
        const parts = formatter.formatToParts(new Date());
        const tzName = parts.find(p => p.type === 'timeZoneName');
        return tzName ? `${timezone} (${tzName.value})` : timezone;
    } catch {
        return timezone;
    }
}

// ============================================================================
// DEPRECATED - Keep for backward compatibility, will remove later
// ============================================================================

/**
 * @deprecated Use parseTimeInTimezoneToUTC instead
 */
export function timeInTimezoneToUTC(
    timeStr: string,
    dateStr: string,
    timezone: string
): Date {
    return parseTimeInTimezoneToUTC(timeStr, dateStr, timezone);
}

/**
 * @deprecated Use toZonedTime directly
 */
export function nowInTimezone(timezone: string): Date {
    return toZonedTime(new Date(), timezone);
}
