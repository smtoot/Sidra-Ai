import { IsString, IsDateString, IsUUID, IsNumber, Min, Max, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
    @IsUUID()
    @IsString()
    teacherId!: string;

    @IsUUID()
    @IsString()
    @IsOptional()
    childId?: string; // Required if Parent booking

    @IsUUID()
    @IsString()
    subjectId!: string;

    @IsDateString()
    startTime!: string; // ISO 8601

    @IsDateString()
    endTime!: string; // ISO 8601

    @Type(() => Number)
    @IsNumber()
    @Min(0) // Allow 0 for demo sessions
    price!: number;

    @IsString()
    @IsOptional()
    timezone?: string; // User's IANA timezone (e.g., "Asia/Tokyo")

    @IsString()
    @IsOptional()
    @MaxLength(1000, { message: 'Notes must be at most 1000 characters' })
    bookingNotes?: string; // Notes from parent/student about what they want to study

    // =====================================================
    // PACKAGE & DEMO SUPPORT
    // =====================================================

    @IsUUID()
    @IsString()
    @IsOptional()
    packageId?: string; // If booking using a purchased package

    @IsBoolean()
    @IsOptional()
    isDemo?: boolean; // If this is a demo session
}

export class UpdateBookingStatusDto {
    @IsString()
    status!: string; // e.g., "REJECTED_BY_TEACHER"

    @IsString()
    cancelReason?: string;
}

export class CreateRatingDto {
    @Type(() => Number)
    @IsNumber()
    @Min(1, { message: 'Score must be at least 1' })
    @Max(5, { message: 'Score must be at most 5' })
    score!: number;

    @IsString()
    @IsOptional()
    @MaxLength(2000, { message: 'Comment must be at most 2000 characters' })
    comment?: string;
}
