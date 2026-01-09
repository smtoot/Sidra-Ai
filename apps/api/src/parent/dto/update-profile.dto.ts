import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';

/**
 * DTO for parent profile updates (PATCH - partial updates)
 *
 * Fields are optional (can update one at a time), but when provided:
 * - firstName/lastName: Cannot be empty (required during registration)
 * - whatsappNumber/country/city: Can be empty or valid values
 */
export class UpdateParentProfileDto {
  @IsOptional()
  @ValidateIf((o) => o.firstName !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'الاسم الأول لا يمكن أن يكون فارغاً' })
  @MinLength(2, { message: 'الاسم الأول يجب أن يكون حرفين على الأقل' })
  @MaxLength(50, { message: 'الاسم الأول يجب ألا يتجاوز 50 حرفاً' })
  firstName?: string;

  @IsOptional()
  @ValidateIf((o) => o.lastName !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'اسم العائلة لا يمكن أن يكون فارغاً' })
  @MinLength(2, { message: 'اسم العائلة يجب أن يكون حرفين على الأقل' })
  @MaxLength(50, { message: 'اسم العائلة يجب ألا يتجاوز 50 حرفاً' })
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'رقم الواتساب يجب ألا يتجاوز 20 حرفاً' })
  @Matches(/^(\+)?[0-9\s-]*$/, {
    message: 'رقم الواتساب يجب أن يحتوي على أرقام فقط',
  })
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'اسم البلد يجب ألا يتجاوز 100 حرف' })
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'اسم المدينة يجب ألا يتجاوز 100 حرف' })
  city?: string;
}
