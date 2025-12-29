import { IsInt, IsNumber, IsString, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for creating a new package tier (Admin only)
 */
export class CreatePackageTierDto {
  @IsInt()
  @Min(1)
  sessionCount!: number; // e.g., 5, 10, 12, 15

  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => Number(value))
  discountPercent!: number; // e.g., 5, 8, 10, 15

  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => Number(value))
  recurringRatio!: number; // e.g., 0.8 = 80% recurring

  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => Number(value))
  floatingRatio!: number; // e.g., 0.2 = 20% floating (must sum to 1.0 with recurringRatio)

  @IsInt()
  @Min(0)
  @Max(10)
  rescheduleLimit!: number; // e.g., 2 reschedules per session

  @IsInt()
  @Min(1)
  durationWeeks!: number; // e.g., 4, 6, 7, 9 weeks

  @IsInt()
  @Min(0)
  gracePeriodDays!: number; // e.g., 14 days

  @IsOptional()
  @IsString()
  nameAr?: string; // "باقة المبتدئين"

  @IsOptional()
  @IsString()
  nameEn?: string; // "Starter Pack"

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean; // Show "Most Popular" badge

  @IsOptional()
  @IsString()
  badge?: string; // "RECOMMENDED", "BEST_VALUE", etc.

  @IsOptional()
  @IsInt()
  displayOrder?: number; // Sort order
}

/**
 * DTO for updating an existing package tier (Admin only)
 */
export class UpdatePackageTierDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sessionCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => Number(value))
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => Number(value))
  recurringRatio?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => Number(value))
  floatingRatio?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  rescheduleLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationWeeks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodDays?: number;

  @IsOptional()
  @IsString()
  nameAr?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // Enable/disable tier
}
