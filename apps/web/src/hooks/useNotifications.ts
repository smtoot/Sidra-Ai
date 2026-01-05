import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, Notification } from '@/lib/api/notification';
import { useAuth } from '@/context/AuthContext';

const STALE_TIME = 30 * 1000; // 30 seconds
const REFETCH_INTERVAL = 60 * 1000; // 60 seconds

/**
 * Hook to fetch notifications with automatic refetching.
 * Only fetches when user is authenticated.
 */
export function useNotifications(page = 1, limit = 10) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['notifications', page, limit],
        queryFn: () => notificationApi.getNotifications(page, limit),
        staleTime: STALE_TIME,
        refetchInterval: REFETCH_INTERVAL,
        refetchOnWindowFocus: true,
        enabled: !!user, // Only fetch when user is logged in
    });
}

/**
 * Hook to fetch unread notification count.
 * Only fetches when user is authenticated.
 */
export function useUnreadCount() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['notifications-unread-count'],
        queryFn: () => notificationApi.getUnreadCount(),
        staleTime: STALE_TIME,
        refetchInterval: REFETCH_INTERVAL,
        refetchOnWindowFocus: true,
        enabled: !!user, // Only fetch when user is logged in
    });
}

/**
 * Mutation hook to mark a notification as read.
 * Invalidates cache on success.
 */
export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
        onSuccess: () => {
            // Invalidate related queries to refetch fresh data
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });
}

/**
 * Mutation hook to mark all notifications as read.
 * Invalidates cache on success.
 */
export function useMarkAllAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => notificationApi.markAllAsRead(),
        onSuccess: () => {
            // Invalidate related queries to refetch fresh data
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });
}
