import { useQuery } from '@tanstack/react-query';
import { marketplaceApi, Curriculum } from '@/lib/api/marketplace';

const STALE_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Hook to fetch all curricula.
 * Cached for 10 minutes across all components.
 */
export function useCurricula() {
    return useQuery<Curriculum[]>({
        queryKey: ['curricula'],
        queryFn: () => marketplaceApi.getCurricula(),
        staleTime: STALE_TIME,
    });
}

