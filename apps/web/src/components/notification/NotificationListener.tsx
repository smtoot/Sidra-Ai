'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api/notification';

export function NotificationListener() {
  const { user } = useAuth();
  const { data: unreadData } = useUnreadCount();
  const queryClient = useQueryClient();

  const previousUnreadRef = useRef<number | null>(null);
  const originalTitleRef = useRef<string | null>(null);
  const longPollSinceRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!originalTitleRef.current) originalTitleRef.current = document.title;
  }, []);

  useEffect(() => {
    previousUnreadRef.current = null;
    longPollSinceRef.current = new Date().toISOString();
    if (typeof document === 'undefined') return;
    if (originalTitleRef.current) document.title = originalTitleRef.current;
  }, [user?.id]);

  // Long-poll for new notifications (server waits up to ~25s).
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      while (!cancelled) {
        try {
          const result = await notificationApi.longPoll(
            longPollSinceRef.current,
          );
          if (cancelled) return;

          if (result.latestCreatedAt) {
            longPollSinceRef.current = result.latestCreatedAt;
          }

          if (result.changed) {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({
              queryKey: ['notifications-unread-count'],
            });
          }
        } catch {
          await sleep(2000);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [queryClient, user]);

  useEffect(() => {
    if (!user) return;
    const unreadCount = unreadData?.count;
    if (typeof unreadCount !== 'number') return;

    if (previousUnreadRef.current === null) {
      previousUnreadRef.current = unreadCount;
      return;
    }

    const previousUnreadCount = previousUnreadRef.current;
    previousUnreadRef.current = unreadCount;

    if (unreadCount > previousUnreadCount) {
      const delta = unreadCount - previousUnreadCount;
      toast.message(
        delta === 1 ? 'لديك إشعار جديد' : `لديك ${delta} إشعارات جديدة`,
        { description: 'افتح جرس الإشعارات لعرض التفاصيل' },
      );
    }

    if (typeof document !== 'undefined' && originalTitleRef.current) {
      document.title =
        unreadCount > 0
          ? `(${unreadCount}) ${originalTitleRef.current}`
          : originalTitleRef.current;
    }
  }, [user, unreadData?.count]);

  return null;
}
