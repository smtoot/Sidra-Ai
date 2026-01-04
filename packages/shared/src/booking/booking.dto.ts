import { IsString, IsDateString, IsUUID, IsNumber, Min, Max, IsOptional, MaxLength, IsBoolean, IsIn, Matches, Equals } from 'class-validator';
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

    // Note: Price is calculated server-side based on teacher's rate and duration.
    // This field is kept for backwards compatibility but ignored by the backend.
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(0)
    price?: number;

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
    packageId?: string; // If booking using an existing purchased package

    @IsUUID()
    @IsString()
    @IsOptional()
    tierId?: string; // If booking will trigger a new package purchase (deferred payment)

    @IsBoolean()
    @IsOptional()
    isDemo?: boolean; // If this is a demo session

    // =====================================================
    // SMART PACK RECURRING PATTERN (for new package purchases with tierId)
    // =====================================================

    @IsString()
    @IsOptional()
    @IsIn(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'], {
        message: 'Weekday must be a valid day (SUNDAY-SATURDAY)'
    })
    recurringWeekday?: string; // Day of week for recurring sessions (e.g., "TUESDAY")

    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'Time must be in HH:mm format (e.g., 17:00)'
    })
    recurringTime?: string; // Time for recurring sessions in HH:mm format (e.g., "17:00")
    @IsBoolean()
    @Equals(true, { message: 'Terms must be accepted to create a booking' })
    termsAccepted!: boolean;
}

export class UpdateBookingStatusDto {
    @IsString()
    @IsOptional()
    status?: string; // e.g., "REJECTED_BY_TEACHER" - optional since endpoint knows action

    @IsString()
    @IsOptional()
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
