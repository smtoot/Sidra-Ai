import { api } from '../api';

export type BookingStatus =
    | 'PENDING_TEACHER_APPROVAL'
    | 'WAITING_FOR_PAYMENT'
    | 'PAYMENT_REVIEW'
    | 'SCHEDULED'
    | 'COMPLETED'
    | 'REJECTED_BY_TEACHER'
    | 'CANCELLED_BY_PARENT'
    | 'CANCELLED_BY_ADMIN'
    | 'EXPIRED';

export interface CreateBookingRequest {
    teacherId: string;
    studentId: string;
    subjectId: string;
    childId?: string; // Optional: Only for Parent bookings
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
    price: number;
}

export interface Booking {
    id: string;
    teacherId: string;
    parentId: string;
    studentId: string;
    subjectId: string;
    startTime: string;
    endTime: string;
    price: string;
    status: BookingStatus;
    cancelReason?: string;
    createdAt: string;
    teacherProfile?: any;
    parentProfile?: any;
    studentUser?: any; // Independent student user
    child?: { // Child entity
        id: string;
        name: string;
    };
    student?: any; // Legacy compatibility
    meetingLink?: string;
    subject?: {
        id: string;
        nameAr: string;
        nameEn: string;
    };
}

export const bookingApi = {
    createRequest: async (dto: CreateBookingRequest) => {
        const response = await api.post('/bookings', dto);
        return response.data;
    },

    approveRequest: async (id: string) => {
        const response = await api.patch(`/bookings/${id}/approve`);
        return response.data;
    },

    rejectRequest: async (id: string, cancelReason?: string) => {
        const response = await api.patch(`/bookings/${id}/reject`, { cancelReason });
        return response.data;
    },

    completeSession: async (id: string) => {
        const response = await api.patch(`/bookings/${id}/complete-session`);
        return response.data;
    },

    getTeacherRequests: async (): Promise<Booking[]> => {
        const response = await api.get('/bookings/teacher/requests');
        return response.data;
    },

    getTeacherSessions: async (): Promise<Booking[]> => {
        const response = await api.get('/bookings/teacher/my-sessions');
        return response.data;
    },

    getParentBookings: async (): Promise<Booking[]> => {
        const response = await api.get('/bookings/parent/my-bookings');
        return response.data;
    },

    getStudentBookings: async (): Promise<Booking[]> => {
        const response = await api.get('/bookings/student/my-bookings');
        return response.data;
    },

    payBooking: async (id: string) => {
        const response = await api.patch(`/bookings/${id}/pay`);
        return response.data;
    }
};
