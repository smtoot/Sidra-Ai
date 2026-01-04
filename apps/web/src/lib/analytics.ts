import posthog from 'posthog-js';
import {
    ALLOWED_EVENTS,
    REPLAY_TRIGGER_EVENTS,
    AnalyticsEvent,
    EventProperties,
} from '@sidra/shared';

const ALIAS_STORAGE_KEY = 'posthog_aliased_';

/**
 * Track an analytics event (only if in allowlist)
 */
export function trackEvent<E extends AnalyticsEvent>(
    event: E,
    properties?: E extends keyof EventProperties
        ? EventProperties[E]
        : Record<string, unknown>
): void {
    if (typeof window === 'undefined') return;

    // Validate against allowlist
    if (!ALLOWED_EVENTS.has(event)) {
        console.warn(`[Analytics] Event "${event}" not in allowlist, skipping`);
        return;
    }

    // Trigger session replay for error events
    if (REPLAY_TRIGGER_EVENTS.has(event)) {
        try {
            posthog.startSessionRecording();
        } catch (e) {
            console.warn('[Analytics] Failed to start session recording:', e);
        }
    }

    posthog.capture(event, properties);
}

/**
 * Manually track pageview (for production where autocapture is disabled)
 */
export function trackPageview(path?: string): void {
    if (typeof window === 'undefined') return;
    posthog.capture('$pageview', {
        $current_url: path || window.location.href,
    });
}

/**
 * Identify user after login/registration
 */
export function identifyUser(
    userId: string,
    properties: {
        user_role: string;
        locale?: string;
        country?: string;
        curriculum?: string;
        device_type?: 'mobile' | 'tablet' | 'desktop';
    }
): void {
    if (typeof window === 'undefined') return;

    posthog.identify(userId, {
        ...properties,
        identified_at: new Date().toISOString(),
    });
}

/**
 * Alias anonymous user to identified user
 * IMPORTANT: Call this BEFORE identify() on first login/registration
 * Uses localStorage to ensure one-time aliasing per user per device
 */
export function aliasUser(userId: string): void {
    if (typeof window === 'undefined') return;

    const storageKey = `${ALIAS_STORAGE_KEY}${userId}`;

    // Check if already aliased on this device
    if (localStorage.getItem(storageKey) === 'true') {
        return; // Already aliased, skip
    }

    const currentId = posthog.get_distinct_id();

    // Only alias if currently anonymous (not already this user)
    if (currentId && currentId !== userId) {
        posthog.alias(userId);
        localStorage.setItem(storageKey, 'true');
    }
}

/**
 * Reset user on logout
 */
export function resetUser(): void {
    if (typeof window === 'undefined') return;
    posthog.reset();
}

/**
 * Set organization group for group analytics
 */
export function setOrganization(
    orgId: string,
    properties?: { name?: string; type?: 'school' | 'center' | 'individual' }
): void {
    if (typeof window === 'undefined' || !orgId) return;
    posthog.group('organization', orgId, properties);
}

/**
 * Get device type from user agent
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';

    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua))
        return 'mobile';
    return 'desktop';
}

/**
 * Check if analytics is initialized
 */
export function isAnalyticsReady(): boolean {
    if (typeof window === 'undefined') return false;
    return posthog.__loaded ?? false;
}
