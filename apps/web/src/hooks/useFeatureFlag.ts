'use client';

import { useMemo } from 'react';

/**
 * Hook to check if a feature is enabled
 */
export function useFeatureFlag(featureName: string): boolean {
  return useMemo(() => {
    switch (featureName) {
      case 'jitsi':
        return process.env.NEXT_PUBLIC_JITSI_ENABLED === 'true';
      case 'recording':
        return process.env.NEXT_PUBLIC_RECORDING_ENABLED === 'true';
      default:
        console.warn(`Unknown feature flag: ${featureName}`);
        return false;
    }
  }, [featureName]);
}
