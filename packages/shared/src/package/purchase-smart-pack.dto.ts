import { IsUUID, IsString, IsEnum, Matches } from 'class-validator';

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
 * DTO for purchasing a Smart Pack package
 *
 * Student selects:
 * - Package tier (determines session count, discount, etc.)
 * - Recurring pattern (weekday + time)
 * - Subject and teacher
 */
export class PurchaseSmartPackDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  teacherId!: string;

  @IsUUID()
  subjectId!: string;

  @IsUUID()
  tierId!: string; // References PackageTier

  @IsEnum(Weekday)
  recurringWeekday!: Weekday;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'الوقت يجب أن يكون بصيغة HH:mm (مثال: 17:00)'
  })
  recurringTime!: string; // "17:00" format (24h)

  @IsString()
  idempotencyKey!: string; // Prevent double-charging
}
