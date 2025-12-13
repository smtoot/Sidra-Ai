import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
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
