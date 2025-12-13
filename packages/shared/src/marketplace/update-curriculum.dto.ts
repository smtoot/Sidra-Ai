import { PartialType } from '@nestjs/mapped-types';
import { CreateCurriculumDto } from './create-curriculum.dto';

// Note: PartialType from @nestjs/mapped-types works best in Nest, 
// for shared repo we might need a manual Partial or a shared utility.
// Since this is shared, we'll manually make fields optional for now to avoid large Nest deps in pure FE code
// or just rely on class-validator's IsOptional if we reused CreateDto logic.
// Simpler approach for shared DTO:
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
