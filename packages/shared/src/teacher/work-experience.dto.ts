import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  MinLength,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

/**
 * Work experience type enum - matches Prisma ExperienceType
 */
export enum ExperienceType {
  SCHOOL = 'SCHOOL',                   // مدرسة
  TUTORING_CENTER = 'TUTORING_CENTER', // مركز تعليمي
  ONLINE_PLATFORM = 'ONLINE_PLATFORM', // منصة إلكترونية
  PRIVATE = 'PRIVATE',                 // دروس خصوصية
  OTHER = 'OTHER',                     // أخرى
}

/**
 * DTO for creating a new work experience
 */
export class CreateWorkExperienceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'عنوان الوظيفة يجب أن يكون حرفين على الأقل' })
  @MaxLength(150, { message: 'عنوان الوظيفة يجب أن يكون أقل من 150 حرف' })
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'اسم المؤسسة يجب أن يكون حرفين على الأقل' })
  @MaxLength(200, { message: 'اسم المؤسسة يجب أن يكون أقل من 200 حرف' })
  organization!: string;

  @IsEnum(ExperienceType)
  experienceType!: ExperienceType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean; // Defaults to false

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'الوصف يجب أن يكون أقل من 1000 حرف' })
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'الحد الأقصى 10 مواد' })
  @IsString({ each: true })
  subjects?: string[]; // Max 10 items
}

/**
 * DTO for updating an existing work experience (all fields optional)
 */
export class UpdateWorkExperienceDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'عنوان الوظيفة يجب أن يكون حرفين على الأقل' })
  @MaxLength(150, { message: 'عنوان الوظيفة يجب أن يكون أقل من 150 حرف' })
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'اسم المؤسسة يجب أن يكون حرفين على الأقل' })
  @MaxLength(200, { message: 'اسم المؤسسة يجب أن يكون أقل من 200 حرف' })
  organization?: string;

  @IsOptional()
  @IsEnum(ExperienceType)
  experienceType?: ExperienceType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'الوصف يجب أن يكون أقل من 1000 حرف' })
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'الحد الأقصى 10 مواد' })
  @IsString({ each: true })
  subjects?: string[];
}
