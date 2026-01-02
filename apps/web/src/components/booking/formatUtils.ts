import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * Formats currency to strictly follow "5000 SDG" format with English numerals.
 * NO Arabic numerals for currency.
 */
export function formatCurrency(amount: number): string {
    // Force English numerals by using 'en-US' but appending 'SDG' manually
    return `${amount.toLocaleString('en-US')} SDG`;
}

/**
 * Formats time to use strict Arabic wording "صباحًا" / "مساءً"
 * NO "ص" / "م" / "AM" / "PM"
 */
export function formatTime(date: Date): string {
    // Get hours and minutes
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const isPm = hours >= 12;

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const minutesStr = minutes < 10 ? '0' + minutes : minutes;

    // Strict suffix requirements
    const suffix = isPm ? 'مساءً' : 'صباحًا';

    return `${hours}:${minutesStr} ${suffix}`;
}

/**
 * Formats timezone to "Asia/Seoul (GMT+9)" format consistently
 */
export function formatTimezone(timezoneId: string): string {
    try {
        // We want to force the display label to be consistent
        // The requirement is: "جميع الأوقات بتوقيت: Asia/Seoul (GMT+9)"
        // This function returns just the "Asia/Seoul (GMT+9)" part

        const now = new Date();
        const shortOffset = new Intl.DateTimeFormat('en-US', {
            timeZone: timezoneId,
            timeZoneName: 'shortOffset'
        }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value;

        // shortOffset is usually "GMT+9" or "GMT-5"
        return `${timezoneId} (${shortOffset || 'GMT'})`;
    } catch (e) {
        return timezoneId;
    }
}

/**
 * Helper to convert UTC time string to Date object
 */
export function parseUtcDate(dateStr: string): Date {
    return new Date(dateStr);
}
