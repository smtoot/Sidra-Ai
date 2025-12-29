import { IsDateString, IsString, IsOptional, Matches } from 'class-validator';

/**
 * DTO for booking a floating session from a Smart Pack
 *
 * Student can book floating sessions anytime before package expiry
 */
export class BookFloatingSessionDto {
  @IsDateString()
  date!: string; // ISO date string (e.g., "2025-02-15")

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'الوقت يجب أن يكون بصيغة HH:mm (مثال: 16:00)'
  })
  time!: string; // "16:00" format

  @IsOptional()
  @IsString()
  notes?: string; // Optional notes for teacher (e.g., "أرغب في التركيز على المعادلات")
}
