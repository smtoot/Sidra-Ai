import { IsOptional, IsString, IsNumber, Min, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '../enums';

export enum SearchSortBy {
    PRICE_ASC = 'PRICE_ASC',
    PRICE_DESC = 'PRICE_DESC',
    RATING_DESC = 'RATING_DESC',
    RECOMMENDED = 'RECOMMENDED'
}


export class SearchTeachersDto {
    @IsOptional()
    @IsString()
    subjectId?: string;

    @IsOptional()
    @IsString()
    curriculumId?: string;

    @IsOptional()
    @IsString()
    gradeLevelId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    @IsEnum(SearchSortBy)
    sortBy?: SearchSortBy;

    // Availability filter: "available today/tomorrow"
    // For MVP, simple boolean "availableSoon" or date string
    // Plan said: "Next Available" display only for MVP to avoid complex temporal queries.
    // But frontend might want to sort by availability.
    // Let's keep it simple: no availability filter param for now if plan said "Next Available display only".
    // But User asked for "Availability" filter in the plan (e.g. today/tomorrow).
    // Let's add 'availableDate' optional param.
    @IsOptional()
    @IsString()
    availableDate?: string; // YYYY-MM-DD
}
