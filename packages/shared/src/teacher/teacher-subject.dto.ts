import { IsString, IsNumber, Min, IsArray, IsUUID } from 'class-validator';

export class CreateTeacherSubjectDto {
    @IsUUID()
    subjectId!: string;

    @IsUUID()
    curriculumId!: string;

    @IsNumber()
    @Min(0)
    pricePerHour!: number;

    @IsArray()
    @IsString({ each: true })
    gradeLevels!: string[];
}
