import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCurriculumDto {
    @IsString()
    @IsNotEmpty()
    nameAr!: string;

    @IsString()
    @IsNotEmpty()
    nameEn!: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
