import { IsString, IsOptional, IsEnum, IsInt, Min, IsUrl } from 'class-validator';

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}

export class UpdateTeacherProfileDto {
    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    yearsOfExperience?: number;

    @IsOptional()
    @IsString()
    education?: string;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    @IsUrl()
    meetingLink?: string;
}
