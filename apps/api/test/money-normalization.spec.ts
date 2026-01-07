
import { normalizeMoney, calculateEarningsSplit } from '../src/utils/money';
import { Decimal } from '@prisma/client/runtime/library';

describe('Money Normalization', () => {
  describe('normalizeMoney helper', () => {
    it('should round 100.5 UP to 101 (ROUND_HALF_UP)', () => {
      expect(normalizeMoney(100.5)).toBe(101);
    });

    it('should round 100.4 DOWN to 100', () => {
      expect(normalizeMoney(100.4)).toBe(100);
    });

    it('should handle Decimal input', () => {
      const decimal = new Decimal('123.7');
      expect(normalizeMoney(decimal)).toBe(124);
    });

    it('should handle string input', () => {
      expect(normalizeMoney('99.5')).toBe(100);
    });

    it('should return exact integer for already-integer input', () => {
      expect(normalizeMoney(100)).toBe(100);
      expect(normalizeMoney(0)).toBe(0);
    });

    it('should handle small decimals correctly', () => {
      expect(normalizeMoney(0.1)).toBe(0);
      expect(normalizeMoney(0.5)).toBe(1);
      expect(normalizeMoney(0.9)).toBe(1);
    });
  });

  describe('calculateEarningsSplit helper', () => {
    it('should calculate teacher earnings with 18% commission (100 × 0.82 = 82)', () => {
      const result = calculateEarningsSplit(100, 0.18);
      expect(result.teacherEarnings).toBe(82);
      expect(result.platformCommission).toBe(18);
    });

    it('should ensure teacher + platform = total (no rounding drift)', () => {
      const testCases = [
        { total: 100, rate: 0.18 },
        { total: 250, rate: 0.18 },
        { total: 333, rate: 0.15 },
        { total: 1000, rate: 0.2 },
      ];

      testCases.forEach(({ total, rate }) => {
        const result = calculateEarningsSplit(total, rate);
        expect(result.teacherEarnings + result.platformCommission).toBe(total);
      });
    });

    it('should handle edge case with 99.5 total', () => {
      // 99.5 normalizes to 100, then 100 × 0.82 = 82
      const result = calculateEarningsSplit(99.5, 0.18);
      expect(result.teacherEarnings).toBe(82);
      expect(result.platformCommission).toBe(18);
    });
  });

  describe('Booking Price Calculation Simulation', () => {
    it('should calculate and normalize booking price (pricePerHour × duration)', () => {
      const pricePerHour = 150;
      const durationHours = 1.5; // 1.5 hours
      const rawPrice = pricePerHour * durationHours; // 225
      const normalizedPrice = normalizeMoney(rawPrice);

      expect(normalizedPrice).toBe(225);
      expect(normalizedPrice % 1).toBe(0); // Is integer
    });

    it('should normalize fractional price correctly (2150 × 0.5 = 1075)', () => {
      const pricePerHour = 2150;
      const durationHours = 0.5;
      const rawPrice = pricePerHour * durationHours;
      const normalizedPrice = normalizeMoney(rawPrice);

      expect(normalizedPrice).toBe(1075);
    });

    it('should handle edge case with non-standard duration', () => {
      // 1350/hr × 1.333 hours ≈ 1799.55 → rounds to 1800
      const pricePerHour = 1350;
      const durationHours = 1.333;
      const rawPrice = pricePerHour * durationHours; // 1799.55
      const normalizedPrice = normalizeMoney(rawPrice);

      expect(normalizedPrice).toBe(1800);
    });
  });

  describe('Commission Split Validation', () => {
    it('should prove no cumulative drift over multiple transactions', () => {
      // Simulate 10 transactions
      let totalTeacher = 0;
      let totalPlatform = 0;
      const bookingPrice = 100;

      for (let i = 0; i < 10; i++) {
        const split = calculateEarningsSplit(bookingPrice, 0.18);
        totalTeacher += split.teacherEarnings;
        totalPlatform += split.platformCommission;
      }

      // 10 × 100 = 1000 total
      expect(totalTeacher + totalPlatform).toBe(1000);
      expect(totalTeacher).toBe(820); // 82 × 10
      expect(totalPlatform).toBe(180); // 18 × 10
    });
  });
});
