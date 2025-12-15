export interface CreateExceptionDto {
    startDate: string;    // ISO date string: "2024-12-25"
    endDate: string;      // ISO date string: "2024-12-31"
    type?: 'ALL_DAY' | 'PARTIAL_DAY';
    startTime?: string;   // "14:00" (only for PARTIAL_DAY)
    endTime?: string;     // "16:00" (only for PARTIAL_DAY)
    reason?: string;      // "Christmas vacation", "Doctor appointment"
}

export interface AvailabilityExceptionResponse {
    id: string;
    startDate: string;
    endDate: string;
    type: 'ALL_DAY' | 'PARTIAL_DAY';
    startTime?: string;
    endTime?: string;
    reason?: string;
    createdAt: string;
    updatedAt: string;
}

export enum ExceptionType {
    ALL_DAY = 'ALL_DAY',
    PARTIAL_DAY = 'PARTIAL_DAY'
}
