import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for creating a new child
 * Name and gradeLevel are required, others are optional
 */
export class CreateChildDto {
  @IsNotEmpty({ message: 'اسم الابن مطلوب' })
  @IsString()
  @MinLength(2, { message: 'اسم الابن يجب أن يكون حرفين على الأقل' })
  @MaxLength(100, { message: 'اسم الابن يجب ألا يتجاوز 100 حرف' })
  name!: string;

  @IsNotEmpty({ message: 'المرحلة الدراسية مطلوبة' })
  @IsString()
  @MaxLength(100, { message: 'المرحلة الدراسية يجب ألا تتجاوز 100 حرف' })
  gradeLevel!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'اسم المدرسة يجب ألا يتجاوز 200 حرف' })
  schoolName?: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف المنهج غير صالح' })
  curriculumId?: string;
}

/**
 * DTO for updating an existing child
 * All fields are optional for partial updates
 */
export class UpdateChildDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'اسم الابن يجب أن يكون حرفين على الأقل' })
  @MaxLength(100, { message: 'اسم الابن يجب ألا يتجاوز 100 حرف' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'المرحلة الدراسية يجب ألا تتجاوز 100 حرف' })
  gradeLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'اسم المدرسة يجب ألا يتجاوز 200 حرف' })
  schoolName?: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف المنهج غير صالح' })
  curriculumId?: string;
}
