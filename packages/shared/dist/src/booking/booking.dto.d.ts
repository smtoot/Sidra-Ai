export declare class CreateBookingDto {
    teacherId: string;
    studentId: string;
    subjectId: string;
    startTime: string;
    endTime: string;
    price: number;
}
export declare class UpdateBookingStatusDto {
    status: string;
    cancelReason?: string;
}
