import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCurriculumDto {
    @IsString()
    @IsOptional()
    nameAr?: string;

    @IsString()
    @IsOptional()
    nameEn?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
