import { IsBoolean, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';

/**
 * DTO for updating teacher vacation mode
 * 
 * When enabling vacation mode:
 * - returnDate is REQUIRED
 * - returnDate cannot exceed maxVacationDays from SystemSettings
 * 
 * When disabling vacation mode:
 * - Only isOnVacation: false is required
 */
export class UpdateVacationModeDto {
    @IsBoolean()
    isOnVacation!: boolean;

    @IsOptional()
    @IsDateString()
    returnDate?: string; // ISO date string (YYYY-MM-DD) - Required when enabling

    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string; // Optional internal note
}

/**
 * Response for vacation mode status
 */
export interface VacationModeStatus {
    isOnVacation: boolean;
    vacationStartDate: Date | null;
    vacationEndDate: Date | null;
    vacationReason: string | null;
}

/**
 * Response for vacation settings
 */
export interface VacationSettings {
    maxVacationDays: number;
}

/**
 * Response when vacation mode update has warnings
 */
export interface VacationModeUpdateResponse {
    success: boolean;
    isOnVacation: boolean;
    vacationEndDate: Date | null;
    warning?: {
        message: string;
        conflictingBookingsCount: number;
    };
}
