/**
 * Timezone Utilities for Frontend
 * 
 * Handles timezone detection and conversion for the Sidra-AI platform
 */

/**
 * Get the user's current timezone using the browser's Intl API
 * @returns IANA timezone string (e.g., "Asia/Tokyo", "America/New_York")
 */
export function getUserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        console.error('Failed to detect timezone:', error);
        return 'UTC'; // Fallback to UTC
    }
}

/**
 * Common timezones for quick selection
 */
export const COMMON_TIMEZONES = [
    { value: 'Asia/Riyadh', label: 'الرياض (Riyadh)', offset: 'UTC+3' },
    { value: 'Asia/Dubai', label: 'دبي (Dubai)', offset: 'UTC+4' },
    { value: 'Asia/Kuwait', label: 'الكويت (Kuwait)', offset: 'UTC+3' },
    { value: 'Asia/Qatar', label: 'قطر (Qatar)', offset: 'UTC+3' },
    { value: 'Asia/Baghdad', label: 'بغداد (Baghdad)', offset: 'UTC+3' },
    { value: 'Africa/Cairo', label: 'القاهرة (Cairo)', offset: 'UTC+2' },
    { value: 'Asia/Tokyo', label: 'طوكيو (Tokyo)', offset: 'UTC+9' },
    { value: 'Europe/London', label: 'لندن (London)', offset: 'UTC+0' },
    { value: 'America/New_York', label: 'نيويورك (New York)', offset: 'UTC-5' },
    { value: 'UTC', label: 'UTC (عالمي)', offset: 'UTC+0' },
];

/**
 * Get timezone display name with offset
 * @param timezone IANA timezone string
 * @returns Display string with offset
 */
export function getTimezoneDisplay(timezone: string): string {
    const found = COMMON_TIMEZONES.find(tz => tz.value === timezone);
    if (found) {
        return `${found.label} (${found.offset})`;
    }

    try {
        const now = new Date();
        const offset = new Intl.DateTimeFormat('en', {
            timeZone: timezone,
            timeZoneName: 'short'
        }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value;

        return `${timezone} (${offset || 'UTC'})`;
    } catch {
        return timezone;
    }
}

/**
 * Store user's preferred timezone in localStorage
 */
export function saveUserTimezone(timezone: string): void {
    try {
        localStorage.setItem('userTimezone', timezone);
    } catch (error) {
        console.error('Failed to save timezone:', error);
    }
}

/**
 * Get stored timezone or detect from browser
 */
export function getPreferredTimezone(): string {
    try {
        const stored = localStorage.getItem('userTimezone');
        return stored || getUserTimezone();
    } catch (error) {
        return getUserTimezone();
    }
}
