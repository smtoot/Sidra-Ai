import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { bookingApi } from '@/lib/api/booking';

const STALE_TIME = 30 * 1000; // 30 seconds
const REFETCH_INTERVAL = 15 * 1000; // 15 seconds

export function useTeacherRequestsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-requests-count'],
    queryFn: () => bookingApi.getTeacherRequestsCount(),
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
    enabled: !!user && user.role === 'TEACHER',
  });
}

