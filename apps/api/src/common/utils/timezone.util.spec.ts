import {
  parseTimeInTimezoneToUTC,
  formatInTimezone,
  buildUtcWindowForUserDate,
  getTeacherDatesInUtcWindow,
} from './timezone.util';

describe('Timezone Utilities', () => {
  describe('parseTimeInTimezoneToUTC', () => {
    it('should convert Tokyo 9:00 AM to UTC 00:00', () => {
      const result = parseTimeInTimezoneToUTC(
        '09:00',
        '2025-12-24',
        'Asia/Tokyo',
      );
      expect(result.toISOString()).toBe('2025-12-24T00:00:00.000Z');
    });

    it('should convert Riyadh 9:00 AM to UTC 06:00', () => {
      const result = parseTimeInTimezoneToUTC(
        '09:00',
        '2025-12-24',
        'Asia/Riyadh',
      );
      expect(result.toISOString()).toBe('2025-12-24T06:00:00.000Z');
    });

    it('should convert New York 9:00 AM to UTC 14:00', () => {
      // New York is UTC-5 in winter
      const result = parseTimeInTimezoneToUTC(
        '09:00',
        '2025-01-15',
        'America/New_York',
      );
      expect(result.toISOString()).toBe('2025-01-15T14:00:00.000Z');
    });

    it('should handle UTC correctly (no conversion)', () => {
      const result = parseTimeInTimezoneToUTC('11:00', '2025-12-22', 'UTC');
      expect(result.toISOString()).toBe('2025-12-22T11:00:00.000Z');
    });

    it('should handle minutes correctly', () => {
      const result = parseTimeInTimezoneToUTC(
        '14:30',
        '2025-12-24',
        'Asia/Tokyo',
      );
      expect(result.toISOString()).toBe('2025-12-24T05:30:00.000Z');
    });
  });

  describe('formatInTimezone', () => {
    it('should format UTC time for Tokyo display', () => {
      const utcDate = new Date('2025-12-20T09:00:00.000Z');
      const result = formatInTimezone(utcDate, 'Asia/Tokyo', 'h:mm a');
      expect(result).toBe('6:00 PM');
    });

    it('should format UTC time for New York display', () => {
      const utcDate = new Date('2025-12-22T11:00:00.000Z');
      const result = formatInTimezone(utcDate, 'America/New_York', 'h:mm a');
      expect(result).toBe('6:00 AM');
    });

    it('should format UTC time for UTC display', () => {
      const utcDate = new Date('2025-12-22T11:00:00.000Z');
      const result = formatInTimezone(utcDate, 'UTC', 'h:mm a');
      expect(result).toBe('11:00 AM');
    });

    it('should format with custom format string', () => {
      const utcDate = new Date('2025-12-24T14:30:00.000Z');
      const result = formatInTimezone(utcDate, 'Asia/Tokyo', 'HH:mm');
      expect(result).toBe('23:30');
    });
  });

  describe('buildUtcWindowForUserDate', () => {
    it('should build correct UTC window for Tokyo user', () => {
      // Tokyo is UTC+9, so Dec 24 Tokyo = Dec 23 15:00 UTC to Dec 24 14:59:59 UTC
      const window = buildUtcWindowForUserDate('2025-12-24', 'Asia/Tokyo');
      expect(window.start.toISOString()).toBe('2025-12-23T15:00:00.000Z');
      expect(window.end.toISOString()).toBe('2025-12-24T14:59:59.999Z');
    });

    it('should build correct UTC window for New York user', () => {
      // New York is UTC-5, so Dec 24 NY = Dec 24 05:00 UTC to Dec 25 04:59:59 UTC
      const window = buildUtcWindowForUserDate(
        '2025-01-24',
        'America/New_York',
      );
      expect(window.start.toISOString()).toBe('2025-01-24T05:00:00.000Z');
      expect(window.end.toISOString()).toBe('2025-01-25T04:59:59.999Z');
    });

    it('should build correct UTC window for UTC user', () => {
      const window = buildUtcWindowForUserDate('2025-12-24', 'UTC');
      expect(window.start.toISOString()).toBe('2025-12-24T00:00:00.000Z');
      expect(window.end.toISOString()).toBe('2025-12-24T23:59:59.999Z');
    });
  });

  describe('getTeacherDatesInUtcWindow', () => {
    it('should return single date when user and teacher in same timezone', () => {
      const window = {
        start: new Date('2025-12-24T00:00:00.000Z'),
        end: new Date('2025-12-24T23:59:59.999Z'),
      };
      const dates = getTeacherDatesInUtcWindow(window, 'UTC');
      expect(dates).toEqual(['2025-12-24']);
    });

    it('should return multiple dates when UTC window spans teacher day boundary', () => {
      // Tokyo user's Dec 24 = Dec 23 15:00 UTC to Dec 24 14:59 UTC
      // If teacher is in UTC, this spans Dec 23 and Dec 24
      const window = {
        start: new Date('2025-12-23T15:00:00.000Z'),
        end: new Date('2025-12-24T14:59:59.999Z'),
      };
      const dates = getTeacherDatesInUtcWindow(window, 'UTC');
      expect(dates).toContain('2025-12-23');
      expect(dates).toContain('2025-12-24');
    });

    it('should handle teacher in different timezone', () => {
      // UTC window for NY user's Dec 24 = Dec 24 05:00 UTC to Dec 25 04:59 UTC
      // If teacher is in Tokyo (+9), this becomes Dec 24 14:00 JST to Dec 25 13:59 JST
      const window = {
        start: new Date('2025-01-24T05:00:00.000Z'),
        end: new Date('2025-01-25T04:59:59.999Z'),
      };
      const dates = getTeacherDatesInUtcWindow(window, 'Asia/Tokyo');
      expect(dates).toContain('2025-01-24');
      expect(dates).toContain('2025-01-25');
    });
  });

  describe('Round-trip conversions', () => {
    it('should correctly round-trip Tokyo time through UTC', () => {
      // Teacher sets 09:00 Tokyo, student in Tokyo should see 09:00
      const teacherLocalTime = '09:00';
      const teacherDate = '2025-12-24';
      const teacherTimezone = 'Asia/Tokyo';

      // Teacher's local time -> UTC
      const utcTime = parseTimeInTimezoneToUTC(
        teacherLocalTime,
        teacherDate,
        teacherTimezone,
      );

      // UTC -> Display for user in same timezone
      const displayedTime = formatInTimezone(
        utcTime,
        teacherTimezone,
        'h:mm a',
      );
      expect(displayedTime).toBe('9:00 AM');
    });

    it('should correctly show teacher time in different user timezone', () => {
      // Teacher in UTC sets 11:00, student in Tokyo should see 8:00 PM
      const teacherLocalTime = '11:00';
      const teacherDate = '2025-12-22';
      const teacherTimezone = 'UTC';
      const userTimezone = 'Asia/Tokyo';

      // Teacher's local time -> UTC
      const utcTime = parseTimeInTimezoneToUTC(
        teacherLocalTime,
        teacherDate,
        teacherTimezone,
      );

      // UTC -> Display for user in different timezone
      const displayedTime = formatInTimezone(utcTime, userTimezone, 'h:mm a');
      expect(displayedTime).toBe('8:00 PM');
    });
  });

  // =========================================================================
  // DST EDGE CASE TESTS
  // =========================================================================

  describe('DST Edge Cases', () => {
    describe('US Spring Forward (March - clocks jump from 2:00 AM to 3:00 AM)', () => {
      // In 2025, US DST starts March 9 at 2:00 AM

      it('should handle time BEFORE DST starts (UTC-5)', () => {
        // March 8, 2025 - still in EST (UTC-5)
        const result = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-03-08',
          'America/New_York',
        );
        expect(result.toISOString()).toBe('2025-03-08T14:00:00.000Z'); // 09:00 + 5h = 14:00 UTC
      });

      it('should handle time AFTER DST starts (UTC-4)', () => {
        // March 10, 2025 - now in EDT (UTC-4)
        const result = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-03-10',
          'America/New_York',
        );
        expect(result.toISOString()).toBe('2025-03-10T13:00:00.000Z'); // 09:00 + 4h = 13:00 UTC
      });

      it('should correctly display time during DST (EDT)', () => {
        // UTC time that should display as 9:00 AM EDT
        const utcDate = new Date('2025-06-15T13:00:00.000Z');
        const result = formatInTimezone(utcDate, 'America/New_York', 'h:mm a');
        expect(result).toBe('9:00 AM');
      });
    });

    describe('US Fall Back (November - clocks jump from 2:00 AM back to 1:00 AM)', () => {
      // In 2025, US DST ends November 2 at 2:00 AM

      it('should handle time BEFORE DST ends (UTC-4)', () => {
        // November 1, 2025 - still in EDT (UTC-4)
        const result = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-11-01',
          'America/New_York',
        );
        expect(result.toISOString()).toBe('2025-11-01T13:00:00.000Z'); // 09:00 + 4h = 13:00 UTC
      });

      it('should handle time AFTER DST ends (UTC-5)', () => {
        // November 3, 2025 - now in EST (UTC-5)
        const result = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-11-03',
          'America/New_York',
        );
        expect(result.toISOString()).toBe('2025-11-03T14:00:00.000Z'); // 09:00 + 5h = 14:00 UTC
      });
    });

    describe('EU DST (Last Sunday of March/October)', () => {
      // 2025: EU DST starts March 30, ends October 26

      it('should handle London BEFORE DST (UTC+0)', () => {
        const result = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-03-29',
          'Europe/London',
        );
        expect(result.toISOString()).toBe('2025-03-29T09:00:00.000Z'); // GMT = UTC
      });

      it('should handle London AFTER DST starts (UTC+1)', () => {
        const result = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-03-31',
          'Europe/London',
        );
        expect(result.toISOString()).toBe('2025-03-31T08:00:00.000Z'); // BST = UTC+1
      });

      it('should handle London AFTER DST ends (UTC+0)', () => {
        const result = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-10-27',
          'Europe/London',
        );
        expect(result.toISOString()).toBe('2025-10-27T09:00:00.000Z'); // Back to GMT
      });
    });

    describe('Non-DST zones should be consistent year-round', () => {
      it('should handle Riyadh in winter (no DST)', () => {
        const result = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-01-15',
          'Asia/Riyadh',
        );
        expect(result.toISOString()).toBe('2025-01-15T06:00:00.000Z');
      });

      it('should handle Riyadh in summer (still no DST)', () => {
        const result = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-06-15',
          'Asia/Riyadh',
        );
        expect(result.toISOString()).toBe('2025-06-15T06:00:00.000Z');
      });

      it('should handle Tokyo in winter (no DST)', () => {
        const result = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-01-15',
          'Asia/Tokyo',
        );
        expect(result.toISOString()).toBe('2025-01-15T00:00:00.000Z');
      });

      it('should handle Tokyo in summer (still no DST)', () => {
        const result = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-06-15',
          'Asia/Tokyo',
        );
        expect(result.toISOString()).toBe('2025-06-15T00:00:00.000Z');
      });
    });

    describe('Cross-timezone bookings during DST transition', () => {
      it('should correctly show NY teacher time to Tokyo user during DST', () => {
        // Teacher in NY sets 09:00 during EDT (summer)
        // User in Tokyo should see correct time
        const utcTime = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-06-15',
          'America/New_York',
        );
        expect(utcTime.toISOString()).toBe('2025-06-15T13:00:00.000Z');

        // Tokyo user sees this as 10:00 PM same day
        const tokyoDisplay = formatInTimezone(utcTime, 'Asia/Tokyo', 'h:mm a');
        expect(tokyoDisplay).toBe('10:00 PM');
      });

      it('should correctly show NY teacher time to Tokyo user outside DST', () => {
        // Teacher in NY sets 09:00 during EST (winter)
        // User in Tokyo should see correct time
        const utcTime = parseTimeInTimezoneToUTC(
          '09:00',
          '2025-01-15',
          'America/New_York',
        );
        expect(utcTime.toISOString()).toBe('2025-01-15T14:00:00.000Z');

        // Tokyo user sees this as 11:00 PM same day
        const tokyoDisplay = formatInTimezone(utcTime, 'Asia/Tokyo', 'h:mm a');
        expect(tokyoDisplay).toBe('11:00 PM');
      });
    });
  });
});
