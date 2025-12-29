import { IsDateString, IsString, IsOptional, Matches } from 'class-validator';

/**
 * DTO for rescheduling a package session
 *
 * Validates:
 * - 24h minimum notice
 * - Reschedule quota not exceeded
 * - New time is available
 */
export class RescheduleSessionDto {
  @IsDateString()
  newDate!: string; // ISO date string

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  newTime!: string; // "17:00" format

  @IsOptional()
  @IsString()
  reason?: string; // Optional reason (e.g., "لدي موعد طارئ")
}

/**
 * Response from reschedule request
 */
export interface RescheduleResponse {
  success: boolean;
  booking: {
    id: string;
    startTime: Date;
    rescheduleCount: number;
    maxReschedules: number;
    originalScheduledAt?: Date;
  };
  reschedulesRemaining: number;
}
