import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

/**
 * DTO for admin to update teacher profile fields
 * Only includes fields that are safe for admin to modify
 * Subject pricing and verified documents remain read-only
 */
export class UpdateTeacherProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    displayName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    fullName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    bio?: string;

    @IsOptional()
    @IsUrl({}, { message: 'يجب أن يكون رابط فيديو صالح' })
    introVideoUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    whatsappNumber?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;
}
