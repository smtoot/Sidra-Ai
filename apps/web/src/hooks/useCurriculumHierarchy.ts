import { useQuery } from '@tanstack/react-query';
import { marketplaceApi, CurriculumHierarchy } from '@/lib/api/marketplace';

const STALE_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Hook to fetch curriculum hierarchy (stages and grades).
 * Only fetches when curriculumId is provided.
 * Cached for 10 minutes per curriculum.
 */
export function useCurriculumHierarchy(curriculumId: string | null) {
    return useQuery<CurriculumHierarchy>({
        queryKey: ['curriculum-hierarchy', curriculumId],
        queryFn: () => marketplaceApi.getCurriculumHierarchy(curriculumId!),
        enabled: !!curriculumId,
        staleTime: STALE_TIME,
    });
}
