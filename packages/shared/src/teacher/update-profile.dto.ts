
import { IsString, IsOptional, IsEnum, IsInt, Min, Matches, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}

// ID Type for verification
export enum IdType {
    NATIONAL_ID = 'NATIONAL_ID',       // البطاقة الوطنية
    PASSPORT = 'PASSPORT',             // جواز السفر
    DRIVER_LICENSE = 'DRIVER_LICENSE', // رخصة القيادة
    RESIDENT_PERMIT = 'RESIDENT_PERMIT', // إقامة
}

// Valid meeting link patterns:
// - Google Meet: https://meet.google.com/xxx-xxxx-xxx
// - Zoom: https://zoom.us/j/123456789 or https://us04web.zoom.us/j/...
// - Microsoft Teams: https://teams.microsoft.com/l/meetup-join/...
const MEETING_LINK_REGEX = /^https:\/\/(meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}|([a-z0-9]+\.)?zoom\.us\/(j|my)\/[a-zA-Z0-9]+|teams\.microsoft\.com\/l\/meetup-join\/.+)(\?.*)?$/i;

export class UpdateTeacherProfileDto {
    @IsOptional()
    @IsString()
    @IsOptional()
    @IsString()
    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'يجب أن يحتوي الرابط على أحرف إنجليزية وأرقام وعلامات - فقط، ولا يبدأ أو ينتهي بـ -'
    })
    @Transform(({ value }) => value === '' ? undefined : value)
    slug?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    yearsOfExperience?: number;

    // REMOVED: education field - replaced by TeacherQualification model
    // Qualifications are now managed via separate API endpoints

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    @Matches(MEETING_LINK_REGEX, {
        message: 'رابط الاجتماع غير صالح. يرجى استخدام رابط Google Meet أو Zoom أو Microsoft Teams صحيح. مثال: https://meet.google.com/abc-defg-hij'
    })
    meetingLink?: string;

    @IsOptional()
    @IsString()
    timezone?: string; // IANA timezone (e.g., "Asia/Tokyo")

    @IsOptional()
    @IsString()
    profilePhotoUrl?: string;

    @IsOptional()
    @IsString()
    introVideoUrl?: string;

    // Personal/Contact Information
    @IsOptional()
    @IsString()
    whatsappNumber?: string; // Optional WhatsApp number

    @IsOptional()
    @IsString()
    city?: string; // City of residence

    @IsOptional()
    @IsString()
    country?: string; // Country of residence

    @IsOptional()
    @IsDateString()
    dateOfBirth?: string; // ISO date string (optional)

    // ID Verification Fields
    @IsOptional()
    @IsEnum(IdType)
    idType?: IdType; // Type of ID document

    @IsOptional()
    @IsString()
    idNumber?: string; // ID document number

    @IsOptional()
    @IsString()
    idImageUrl?: string; // Uploaded ID image URL
}
