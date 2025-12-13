export declare enum DayOfWeek {
    SUNDAY = "SUNDAY",
    MONDAY = "MONDAY",
    TUESDAY = "TUESDAY",
    WEDNESDAY = "WEDNESDAY",
    THURSDAY = "THURSDAY",
    FRIDAY = "FRIDAY",
    SATURDAY = "SATURDAY"
}
export declare class CreateAvailabilityDto {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
}
