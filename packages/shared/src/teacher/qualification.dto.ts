import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, IsUrl, Min, Max } from 'class-validator';

/**
 * Enum for qualification status
 */
export enum QualificationStatus {
  GRADUATED = 'GRADUATED',
  IN_PROGRESS = 'IN_PROGRESS',
  NOT_COMPLETED = 'NOT_COMPLETED',
}

/**
 * DTO for creating a new teacher qualification
 * All qualifications require a certificate upload
 */
export class CreateQualificationDto {
  @IsString()
  @IsNotEmpty()
  degreeName!: string; // e.g., "Bachelor of Science in Mathematics"

  @IsString()
  @IsNotEmpty()
  institution!: string; // e.g., "Cairo University"

  @IsString()
  @IsOptional()
  fieldOfStudy?: string; // e.g., "Computer Science"

  @IsEnum(QualificationStatus)
  status!: QualificationStatus;

  @IsOptional()
  @IsString()
  startDate?: string; // ISO date string

  @IsOptional()
  @IsString()
  endDate?: string; // ISO date string

  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  graduationYear?: number;

  @IsUrl()
  @IsNotEmpty()
  certificateUrl!: string; // REQUIRED - S3 URL to certificate
}

/**
 * DTO for updating an existing qualification
 * Editing after approval triggers re-verification
 */
export class UpdateQualificationDto {
  @IsString()
  @IsOptional()
  degreeName?: string;

  @IsString()
  @IsOptional()
  institution?: string;

  @IsString()
  @IsOptional()
  fieldOfStudy?: string;

  @IsEnum(QualificationStatus)
  @IsOptional()
  status?: QualificationStatus;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  graduationYear?: number;

  @IsUrl()
  @IsOptional()
  certificateUrl?: string;
}
