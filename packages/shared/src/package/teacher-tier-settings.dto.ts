import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for updating teacher's demo and package settings
 */
export class UpdateTeacherDemoSettingsDto {
  @IsOptional()
  @IsBoolean()
  demoEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  packagesEnabled?: boolean; // Master toggle for all packages
}

/**
 * DTO for updating teacher's per-tier package settings
 */
export class UpdateTeacherTierSettingDto {
  @IsBoolean()
  isEnabled!: boolean; // Enable/disable this specific tier
}
