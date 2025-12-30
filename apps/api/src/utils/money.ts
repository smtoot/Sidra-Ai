import { Decimal } from '@prisma/client/runtime/library';

/**
 * GLOBAL MONEY NORMALIZATION HELPER
 *
 * This is the ONLY place where money rounding should occur in the system.
 *
 * Rules:
 * - All money values must be whole numbers (no decimals)
 * - Rounding: ROUND_HALF_UP (e.g., 100.5 → 101, 100.4 → 100)
 * - Rounding happens SERVER-SIDE ONLY
 * - Rounding happens ONCE per amount (at normalization time)
 * - Frontend must NEVER round or adjust prices
 *
 * @param amount - The amount to normalize (can be Decimal, number, or string)
 * @returns A whole number (integer) as a JavaScript number
 */
export function normalizeMoney(amount: Decimal | number | string): number {
  const decimal = new Decimal(amount);
  return decimal.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Calculate teacher earnings with proper rounding.
 * Platform receives the remainder (no separate rounding).
 *
 * This ensures: teacherEarnings + platformCommission = totalAmount (exactly)
 *
 * @param totalAmount - The total booking price
 * @param commissionRate - Platform commission rate (e.g., 0.18 for 18%)
 * @returns Object with teacherEarnings and platformCommission (both integers)
 */
export function calculateEarningsSplit(
  totalAmount: number,
  commissionRate: number,
): { teacherEarnings: number; platformCommission: number } {
  const normalizedTotal = normalizeMoney(totalAmount);
  const teacherEarnings = normalizeMoney(
    normalizedTotal * (1 - commissionRate),
  );
  const platformCommission = normalizedTotal - teacherEarnings; // No separate rounding

  return { teacherEarnings, platformCommission };
}
