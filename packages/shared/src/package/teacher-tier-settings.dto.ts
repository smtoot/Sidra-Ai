import { IsBoolean } from 'class-validator';

/**
 * DTO for updating teacher's demo and package settings
 */
export class UpdateTeacherDemoSettingsDto {
  @IsBoolean()
  demoEnabled?: boolean;

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
