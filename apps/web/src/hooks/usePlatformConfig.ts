import { useQuery } from '@tanstack/react-query';
import { marketplaceApi, PlatformConfig } from '@/lib/api/marketplace';

const STALE_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Hook to fetch platform configuration (search settings, session durations).
 * Cached for 10 minutes.
 */
export function usePlatformConfig() {
    return useQuery<PlatformConfig>({
        queryKey: ['platformConfig'],
        queryFn: () => marketplaceApi.getPlatformConfig(),
        staleTime: STALE_TIME,
    });
}
