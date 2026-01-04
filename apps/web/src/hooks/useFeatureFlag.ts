'use client';

import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

/**
 * Check if a feature flag is enabled
 * Returns false while loading to prevent flash of content
 */
export function useFeatureFlag(flagKey: string): boolean {
    const isEnabled = useFeatureFlagEnabled(flagKey);
    return isEnabled ?? false;
}

/**
 * Get feature flag value with payload
 */
export function useFeatureFlagPayload<T = unknown>(
    flagKey: string
): T | undefined {
    const posthog = usePostHog();
    const [payload, setPayload] = useState<T | undefined>();

    useEffect(() => {
        if (posthog) {
            const value = posthog.getFeatureFlagPayload(flagKey) as T;
            setPayload(value);
        }
    }, [posthog, flagKey]);

    return payload;
}

/**
 * Check flag with loading state for conditional rendering
 */
export function useFeatureFlagWithLoading(flagKey: string): {
    isEnabled: boolean;
    isLoading: boolean;
} {
    const posthog = usePostHog();
    const [state, setState] = useState({ isEnabled: false, isLoading: true });

    useEffect(() => {
        if (posthog) {
            posthog.onFeatureFlags(() => {
                setState({
                    isEnabled: posthog.isFeatureEnabled(flagKey) ?? false,
                    isLoading: false,
                });
            });
        }
    }, [posthog, flagKey]);

    return state;
}
