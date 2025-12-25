import { api } from '../api';

export interface CreateRatingPayload {
    score: number;
    comment?: string;
}

export interface Rating {
    id: string;
    bookingId: string;
    teacherId: string;
    ratedByUserId: string;
    score: number;
    comment: string | null;
    isVisible: boolean;
    createdAt: string;
}

export const ratingApi = {
    /**
     * Submit a rating for a completed booking
     */
    rateBooking: async (bookingId: string, data: CreateRatingPayload): Promise<Rating> => {
        const response = await api.post(`/bookings/${bookingId}/rate`, data);
        return response.data;
    }
};
