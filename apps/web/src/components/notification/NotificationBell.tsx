'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Notification } from '@/lib/api/notification';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';

/**
 * Format relative time in Arabic
 */
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
    if (diffHours < 24) return `قبل ${diffHours} ساعة`;
    if (diffDays < 7) return `قبل ${diffDays} يوم`;
    return date.toLocaleDateString('ar-EG');
}

export function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // React Query hooks
    const { data: notificationsData, isLoading: loading, refetch: refetchNotifications } = useNotifications(1, 10);
    const { data: unreadData } = useUnreadCount();
    const markAsReadMutation = useMarkAsRead();
    const markAllAsReadMutation = useMarkAllAsRead();

    const notifications = notificationsData?.items || [];
    const unreadCount = unreadData?.count || 0;

    // Handle dropdown toggle
    const handleToggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
            refetchNotifications();
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle notification click
    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read using React Query mutation (triggers cache invalidation)
        if (notification.status === 'UNREAD') {
            markAsReadMutation.mutate(notification.id);
        }

        // Navigate if link exists
        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    // Handle mark all as read
    const handleMarkAllRead = () => {
        markAllAsReadMutation.mutate(undefined, {
            onSuccess: () => {
                toast.success('تم تمييز جميع الإشعارات كمقروءة');
            },
            onError: () => {
                toast.error('حدث خطأ');
            }
        });
    };

    // Format badge display
    const badgeText = unreadCount > 9 ? '9+' : unreadCount.toString();

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={handleToggle}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label={`الإشعارات${unreadCount > 0 ? ` (${unreadCount} غير مقروءة)` : ''}`}
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {badgeText}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-[100] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">الإشعارات</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={markAllAsReadMutation.isPending}
                                className="text-sm text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
                            >
                                {markAllAsReadMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Check className="w-3 h-3" />
                                )}
                                تمييز الكل كمقروء
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            // Skeleton loading
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>لا توجد إشعارات</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "w-full text-right p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors",
                                        notification.status === 'UNREAD' && "bg-blue-50/50"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {notification.status === 'UNREAD' && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm">
                                                {notification.title}
                                            </p>
                                            <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-gray-400 text-xs mt-2">
                                                {formatRelativeTime(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/notifications');
                            }}
                            className="w-full text-center text-sm text-primary hover:underline font-medium"
                        >
                            عرض كل الإشعارات
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

