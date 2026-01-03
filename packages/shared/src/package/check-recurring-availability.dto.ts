import {
  IsUUID,
  IsEnum,
  Matches,
  IsInt,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Weekday, RecurringPatternDto, RecurringPattern } from './purchase-smart-pack.dto';

/**
 * DTO for checking multi-slot recurring availability
 *
 * Used before purchase to validate that teacher can accommodate
 * the required sessions across multiple weekly patterns
 */
export class CheckMultiSlotAvailabilityDto {
  @IsUUID()
  teacherId!: string;

  @ValidateNested({ each: true })
  @Type(() => RecurringPatternDto)
  @ArrayMinSize(1, { message: 'يجب اختيار موعد واحد على الأقل' })
  @ArrayMaxSize(4, { message: 'الحد الأقصى 4 مواعيد أسبوعية' })
  patterns!: RecurringPatternDto[];

  @IsInt()
  @Min(1)
  @Max(20)
  recurringSessionCount!: number; // How many recurring sessions needed

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(120)
  duration?: number; // Session duration in minutes (default: 60)
}

/**
 * DEPRECATED: Legacy single-pattern availability check
 * Kept for backward compatibility
 */
export class CheckRecurringAvailabilityDto {
  @IsUUID()
  teacherId!: string;

  @IsEnum(Weekday)
  weekday!: Weekday;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  time!: string; // "17:00" format

  @IsInt()
  @Min(1)
  sessionCount!: number; // How many recurring sessions needed

  @IsOptional()
  @IsInt()
  @Min(60)
  duration?: number; // Session duration in minutes (default: 60)
}

/**
 * Scheduled session in the availability response
 */
export interface ScheduledSession {
  date: string; // ISO date string
  weekday: Weekday;
  time: string;
  sessionNumber: number;
}

/**
 * Per-pattern availability status
 */
export interface PatternAvailability {
  weekday: Weekday;
  time: string;
  availableWeeks: number;
  conflicts: Array<{
    date: string;
    reason: string;
  }>;
}

/**
 * Response from multi-slot availability check
 */
export interface MultiSlotAvailabilityResponse {
  available: boolean;
  patterns: PatternAvailability[];
  scheduledSessions: ScheduledSession[];
  totalWeeksNeeded: number;
  firstSession: string | null;
  lastSession: string | null;
  packageEndDate: string | null;
  message: string;
}

/**
 * DEPRECATED: Legacy single-pattern response
 * Kept for backward compatibility
 */
export interface RecurringAvailabilityResponse {
  available: boolean;
  conflicts: Date[]; // Dates that have conflicts
  suggestedDates: Date[]; // Dates that are available
  firstSession?: Date;
  lastSession?: Date;
  packageEndDate?: Date; // lastSession + grace period
}
