import { api } from '../api';

export type NotificationType =
    | 'BOOKING_REQUEST'
    | 'BOOKING_APPROVED'
    | 'BOOKING_REJECTED'
    | 'BOOKING_CANCELLED'
    | 'BOOKING_RESCHEDULED'
    | 'PAYMENT_SUCCESS'
    | 'PAYMENT_RELEASED'
    | 'ESCROW_REMINDER'
    | 'DEPOSIT_APPROVED'
    | 'DEPOSIT_REJECTED'
    | 'DISPUTE_RAISED'
    | 'DISPUTE_UPDATE'
    | 'SYSTEM_ALERT'
    | 'URGENT'
    | 'ADMIN_ALERT'
    | 'SESSION_REMINDER'
    | 'ACCOUNT_UPDATE';

export type NotificationStatus = 'READ' | 'UNREAD' | 'ARCHIVED';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    status: NotificationStatus;
    link?: string;
    metadata?: Record<string, any>;
    readAt?: string;
    createdAt: string;
}

export interface NotificationListResponse {
    items: Notification[];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const notificationApi = {
    /**
     * Get paginated notifications for current user
     */
    async getNotifications(page = 1, limit = 10): Promise<NotificationListResponse> {
        try {
            const response = await api.get('/notifications', {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to load notifications', error);
            return { items: [], meta: { total: 0, page, limit, pages: 0 } };
        }
    },

    /**
     * Get unread notification count for badge
     */
    async getUnreadCount(): Promise<{ count: number }> {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },

    /**
     * Mark a single notification as read
     */
    async markAsRead(id: string): Promise<{ success: boolean }> {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    /**
     * Mark all unread notifications as read
     */
    async markAllAsRead(): Promise<{ count: number }> {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    },

    async longPoll(since: string, timeoutMs = 25000): Promise<{
        changed: boolean;
        latestCreatedAt: string | null;
        notificationId: string | null;
    }> {
        const response = await api.get('/notifications/long-poll', {
            params: { since, timeoutMs },
            timeout: timeoutMs + 5000, // allow server wait + network overhead
        });
        return response.data;
    },
};
