import { IsUUID, IsEnum, Matches, IsInt, Min } from 'class-validator';
import { Weekday } from './purchase-smart-pack.dto';

/**
 * DTO for checking if a teacher has availability for a recurring pattern
 *
 * Used before purchase to validate that teacher can accommodate
 * the required number of consecutive weeks
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

  @IsInt()
  @Min(60)
  duration?: number; // Session duration in minutes (default: 60)
}

/**
 * Response from availability check
 */
export interface RecurringAvailabilityResponse {
  available: boolean;
  conflicts: Date[]; // Dates that have conflicts
  suggestedDates: Date[]; // Dates that are available
  firstSession?: Date;
  lastSession?: Date;
  packageEndDate?: Date; // lastSession + grace period
}
