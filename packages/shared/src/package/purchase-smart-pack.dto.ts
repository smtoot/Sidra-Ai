import {
  IsUUID,
  IsString,
  IsEnum,
  Matches,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Weekday {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

/**
 * Represents a single weekly recurring slot
 * Used for multi-slot Smart Pack scheduling
 */
export class RecurringPatternDto {
  @IsEnum(Weekday, {
    message: 'اليوم يجب أن يكون من أيام الأسبوع',
  })
  weekday!: Weekday;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'الوقت يجب أن يكون بصيغة HH:mm (مثال: 17:00)',
  })
  time!: string; // "17:00" format (24h)
}

/**
 * Interface for recurring pattern (used in responses and internal logic)
 */
export interface RecurringPattern {
  weekday: Weekday;
  time: string;
}

/**
 * DTO for purchasing a Smart Pack package
 *
 * Student selects:
 * - Package tier (determines session count, discount, etc.)
 * - Recurring patterns (1-4 weekly slots)
 * - Subject and teacher
 *
 * Multi-slot allows faster package completion:
 * - 1 slot/week = 8 weeks for 8 recurring sessions
 * - 2 slots/week = 4 weeks for 8 recurring sessions
 * - 4 slots/week = 2 weeks for 8 recurring sessions
 */
export class PurchaseSmartPackDto {
  @IsOptional() // Optional for students (controller sets from JWT), required for parents
  @IsUUID()
  studentId?: string;

  @IsUUID()
  teacherId!: string;

  @IsUUID()
  subjectId!: string;

  @IsUUID()
  tierId!: string; // References PackageTier

  /**
   * Array of recurring patterns (1-4 slots per week)
   * Each pattern specifies a weekday and time
   */
  @ValidateNested({ each: true })
  @Type(() => RecurringPatternDto)
  @ArrayMinSize(1, { message: 'يجب اختيار موعد واحد على الأقل' })
  @ArrayMaxSize(4, { message: 'الحد الأقصى 4 مواعيد أسبوعية' })
  recurringPatterns!: RecurringPatternDto[];

  @IsString()
  idempotencyKey!: string; // Prevent double-charging

  @IsOptional()
  @IsString()
  timezone?: string; // User's IANA timezone (e.g., 'Africa/Khartoum'), defaults to teacher's timezone

  @IsOptional()
  @IsUUID()
  payerId?: string; // The user who pays (set by controller from JWT)

  // ============================================================
  // DEPRECATED: Legacy single-pattern fields
  // Kept for backward compatibility with old API clients
  // New clients should use recurringPatterns array
  // ============================================================

  @IsOptional()
  @IsEnum(Weekday)
  recurringWeekday?: Weekday;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'الوقت يجب أن يكون بصيغة HH:mm (مثال: 17:00)',
  })
  recurringTime?: string;
}
