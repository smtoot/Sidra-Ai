import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchTeachersDto {
    @IsOptional()
    @IsString()
    subjectId?: string;

    @IsOptional()
    @IsString()
    curriculumId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;
}
