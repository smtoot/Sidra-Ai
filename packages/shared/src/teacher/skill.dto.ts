import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * Skill category enum - matches Prisma SkillCategory
 */
export enum SkillCategory {
  TEACHING_METHOD = 'TEACHING_METHOD',   // طرق التدريس
  TECHNOLOGY = 'TECHNOLOGY',             // التقنيات
  SOFT_SKILL = 'SOFT_SKILL',             // المهارات الشخصية
  SUBJECT_SPECIFIC = 'SUBJECT_SPECIFIC', // تخصصية
}

/**
 * Skill proficiency level enum - matches Prisma SkillProficiency
 */
export enum SkillProficiency {
  BEGINNER = 'BEGINNER',         // مبتدئ
  INTERMEDIATE = 'INTERMEDIATE', // متوسط
  ADVANCED = 'ADVANCED',         // متقدم
  EXPERT = 'EXPERT',             // خبير
}

/**
 * DTO for creating a new teacher skill
 */
export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'اسم المهارة يجب أن يكون حرفين على الأقل' })
  @MaxLength(100, { message: 'اسم المهارة يجب أن يكون أقل من 100 حرف' })
  name!: string;

  @IsEnum(SkillCategory)
  @IsOptional()
  category?: SkillCategory;

  @IsEnum(SkillProficiency)
  @IsOptional()
  proficiency?: SkillProficiency; // Defaults to INTERMEDIATE
}

/**
 * DTO for updating an existing skill (all fields optional)
 */
export class UpdateSkillDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'اسم المهارة يجب أن يكون حرفين على الأقل' })
  @MaxLength(100, { message: 'اسم المهارة يجب أن يكون أقل من 100 حرف' })
  name?: string;

  @IsEnum(SkillCategory)
  @IsOptional()
  category?: SkillCategory;

  @IsEnum(SkillProficiency)
  @IsOptional()
  proficiency?: SkillProficiency;
}
