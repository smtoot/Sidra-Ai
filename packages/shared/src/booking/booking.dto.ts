import { IsString, IsDateString, IsUUID, IsNumber, Min, IsOptional } from 'class-validator';
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
    @Min(1)
    price!: number;
}

export class UpdateBookingStatusDto {
    @IsString()
    status!: string; // e.g., "REJECTED_BY_TEACHER"

    @IsString()
    cancelReason?: string;
}
