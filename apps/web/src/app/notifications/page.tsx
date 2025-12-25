'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { notificationApi, Notification } from '@/lib/api/notification';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

type FilterType = 'all' | 'unread';

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState<FilterType>('all');

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await notificationApi.getNotifications(page, 20);
            // Apply client-side filter for unread (backend doesn't support it yet)
            let items = data.items;
            if (filter === 'unread') {
                items = items.filter(n => n.status === 'UNREAD');
            }
            setNotifications(items);
            setTotalPages(data.meta.pages);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            toast.error('حدث خطأ أثناء تحميل الإشعارات');
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Handle notification click
    const handleNotificationClick = async (notification: Notification) => {
        // Optimistically mark as read
        if (notification.status === 'UNREAD') {
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, status: 'READ' as const } : n)
            );

            try {
                await notificationApi.markAsRead(notification.id);
            } catch (error) {
                console.error('Failed to mark as read', error);
            }
        }

        // Navigate if link exists
        if (notification.link) {
            router.push(notification.link);
        }
    };

    // Handle mark all as read
    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, status: 'READ' as const }))
            );
            toast.success('تم تمييز جميع الإشعارات كمقروءة');
        } catch (error) {
            console.error('Failed to mark all as read', error);
            toast.error('حدث خطأ');
        }
    };

    const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bell className="w-8 h-8 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold text-primary">الإشعارات</h1>
                            <p className="text-text-subtle">جميع التنبيهات والتحديثات</p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleMarkAllRead}
                            className="gap-2"
                        >
                            <Check className="w-4 h-4" />
                            تمييز الكل كمقروء
                        </Button>
                    )}
                </header>

                {/* Filters */}
                <div className="flex gap-2">
                    <button
                        onClick={() => { setFilter('all'); setPage(1); }}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            filter === 'all'
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => { setFilter('unread'); setPage(1); }}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            filter === 'unread'
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                    >
                        غير مقروءة
                    </button>
                </div>

                {/* Notification List */}
                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        // Loading skeletons
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="animate-pulse flex gap-4">
                                    <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                        <div className="h-3 bg-gray-100 rounded w-full mb-1"></div>
                                        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        // Empty state
                        <div className="p-16 text-center">
                            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-bold text-gray-500 mb-2">لا توجد إشعارات حالياً</h3>
                            <p className="text-gray-400">ستظهر هنا جميع التنبيهات والتحديثات المهمة</p>
                        </div>
                    ) : (
                        // Notification items
                        <div className="divide-y divide-gray-100">
                            {notifications.map(notification => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "w-full text-right p-6 hover:bg-gray-50 transition-colors flex items-start gap-4",
                                        notification.status === 'UNREAD' && "bg-blue-50/30"
                                    )}
                                >
                                    {/* Unread indicator */}
                                    <div className="w-2 flex-shrink-0 pt-2">
                                        {notification.status === 'UNREAD' && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <h4 className="font-bold text-gray-900">
                                                {notification.title}
                                            </h4>
                                            <span className="text-xs text-gray-400 flex-shrink-0">
                                                {formatRelativeTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        {notification.link && (
                                            <span className="text-primary text-sm mt-2 inline-block hover:underline">
                                                عرض التفاصيل ←
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronRight className="w-4 h-4 ml-1" />
                                السابق
                            </Button>
                            <span className="text-sm text-gray-500">
                                صفحة {page} من {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                التالي
                                <ChevronLeft className="w-4 h-4 mr-1" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
