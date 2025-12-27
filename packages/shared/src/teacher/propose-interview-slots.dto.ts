import { IsArray, IsString, IsISO8601, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InterviewTimeSlotDto {
    @IsISO8601()
    dateTime!: string;

    @IsString()
    meetingLink!: string;
}

export class ProposeInterviewSlotsDto {
    @IsArray()
    @ArrayMinSize(2) // At least 2 options
    @ValidateNested({ each: true })
    @Type(() => InterviewTimeSlotDto)
    timeSlots!: InterviewTimeSlotDto[];
}

export class SelectInterviewSlotDto {
    @IsString()
    slotId!: string;
}
