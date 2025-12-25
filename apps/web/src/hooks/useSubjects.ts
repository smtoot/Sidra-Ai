import { useQuery } from '@tanstack/react-query';
import { marketplaceApi, Subject } from '@/lib/api/marketplace';

const STALE_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Hook to fetch all subjects.
 * Cached for 10 minutes across all components.
 */
export function useSubjects() {
    return useQuery<Subject[]>({
        queryKey: ['subjects'],
        queryFn: () => marketplaceApi.getSubjects(),
        staleTime: STALE_TIME,
    });
}

