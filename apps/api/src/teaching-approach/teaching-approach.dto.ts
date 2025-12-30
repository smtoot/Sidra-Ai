import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  IsArray,
  ArrayMaxSize,
  IsUUID,
} from 'class-validator';

// Admin DTOs
export class CreateTagDto {
  @IsString()
  labelAr: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  labelAr?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

// Teacher DTOs
export class UpdateTeachingApproachDto {
  @IsString()
  @IsOptional()
  teachingStyle?: string;

  @IsArray()
  @IsUUID(4, { each: true })
  @ArrayMaxSize(4)
  @IsOptional()
  tagIds?: string[];
}
