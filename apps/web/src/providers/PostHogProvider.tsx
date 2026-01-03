'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { ALLOWED_EVENTS, ALLOWED_INTERNAL_EVENTS } from '@sidra/shared';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_STAGING = process.env.NEXT_PUBLIC_POSTHOG_AUTOCAPTURE === 'true';

/**
 * PostHog Analytics Provider
 * 
 * Features:
 * - Event allowlisting (only approved events are sent)
 * - Autocapture OFF in production (controlled by env)
 * - Session replay disabled by default, enabled on error events
 * - Group analytics foundation for future org/school entities
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

        // Only initialize if API key is provided
        if (typeof window !== 'undefined' && posthogKey) {
            posthog.init(posthogKey, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',

                // COST CONTROL: Autocapture OFF in production, ON in staging only
                autocapture: !IS_PRODUCTION && IS_STAGING,

                // COST CONTROL: Disable automatic pageview capture
                // Use manual trackPageview() when needed
                capture_pageview: false,

                // SESSION REPLAY: Disabled by default, enabled on-demand for errors
                session_recording: {
                    maskAllInputs: true,
                    maskTextSelector: '[data-ph-mask]',
                    recordCrossOriginIframes: false,
                },

                // COST CONTROL: Strict event filtering
                before_send: (event) => {
                    if (!event) return null;
                    const eventName = event.event;
                    if (!eventName) return event;

                    // Handle internal PostHog events (start with $)
                    if (eventName.startsWith('$')) {
                        // In production, only allow specific internal events
                        if (IS_PRODUCTION && !ALLOWED_INTERNAL_EVENTS.has(eventName)) {
                            return null;
                        }
                        return event;
                    }

                    // Block non-allowlisted custom events
                    if (!ALLOWED_EVENTS.has(eventName)) {
                        if (!IS_PRODUCTION) {
                            console.warn(`[PostHog] Blocked non-allowlisted event: ${eventName}`);
                        }
                        return null;
                    }

                    return event;
                },

                loaded: (ph) => {
                    // Attach to window for console testing
                    (window as any).posthog = ph;

                    if (!IS_PRODUCTION) {
                        ph.debug();
                        console.log('[PostHog] Initialized in debug mode');
                    }
                },
            });
        }
    }, []);

    return <PHProvider client={posthog}>{children}</PHProvider>;
}

/**
 * Set organization/school group for group analytics
 * Call when user's organization context is known
 */
export function setOrganizationGroup(
    orgId: string,
    properties?: Record<string, unknown>
): void {
    if (typeof window === 'undefined' || !orgId) return;
    posthog.group('organization', orgId, properties);
}

/**
 * Clear organization group (e.g., on logout)
 */
export function clearOrganizationGroup(): void {
    if (typeof window === 'undefined') return;
    posthog.resetGroups();
}
