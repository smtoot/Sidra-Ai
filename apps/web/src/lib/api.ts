import axios from 'axios';

/**
 * SECURITY FIX: Helper to get CSRF token from cookie
 * The csrf_token cookie is NOT httpOnly so JS can read it
 */
function getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    headers: {
        'Content-Type': 'application/json',
    },
    // SECURITY FIX: Include cookies in requests for httpOnly token auth
    withCredentials: true,
});

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// P1 FIX: Add retry limit to prevent infinite refresh loops
const MAX_REFRESH_RETRIES = 3;
let refreshRetryCount = 0;
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN_MS = 5000; // 5 seconds cooldown between retry counts reset

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
};

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        // SECURITY FIX: Add CSRF token header for state-changing requests
        // Token is stored in non-httpOnly cookie, sent as header for double-submit protection
        const method = config.method?.toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
            const csrfToken = getCsrfToken();
            if (csrfToken) {
                config.headers['X-CSRF-Token'] = csrfToken;
            }
        }

        // BACKWARDS COMPATIBILITY: Also send Authorization header during transition period
        // This will be removed once all clients use cookie-based auth
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (typeof window !== 'undefined' && error.response?.status === 401) {
            // Don't try to refresh on auth endpoints themselves
            const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
                originalRequest?.url?.includes('/auth/register') ||
                originalRequest?.url?.includes('/auth/refresh');

            // Don't redirect on public pages where guests can browse
            const isPublicPage = window.location.pathname.startsWith('/teachers/');

            // Optional auth requests that don't require login
            const isOptionalAuthRequest = originalRequest?.url?.includes('/auth/profile') ||
                originalRequest?.url?.includes('/teacher/me') ||
                originalRequest?.url?.includes('/packages/');

            // If this is an auth endpoint or already retried, don't attempt refresh
            if (isAuthEndpoint || originalRequest._retry) {
                // Only redirect if not on public/optional pages
                const shouldRedirect = !isPublicPage &&
                    !isOptionalAuthRequest &&
                    !window.location.pathname.includes('/login') &&
                    !window.location.pathname.includes('/register');

                if (shouldRedirect && !isAuthEndpoint) {
                    // SECURITY FIX: Clear localStorage during transition, cookies cleared by server
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            // SECURITY FIX: Check for cookie-based auth OR localStorage (backwards compat)
            // With httpOnly cookies, we can't check if refresh_token exists - just try refresh
            const hasLocalStorageToken = !!localStorage.getItem('refresh_token');
            const hasCookieAuth = !!getCsrfToken(); // If CSRF token exists, cookies are set

            if (hasLocalStorageToken || hasCookieAuth) {
                // P1 FIX: Check retry limit before attempting refresh
                const now = Date.now();
                if (now - lastRefreshAttempt > REFRESH_COOLDOWN_MS) {
                    // Reset retry count if enough time has passed
                    refreshRetryCount = 0;
                }

                if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
                    console.warn('Max refresh retries exceeded, logging out');
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');
                    if (!isPublicPage && !isOptionalAuthRequest) {
                        window.location.href = '/login';
                    }
                    return Promise.reject(new Error('Max refresh retries exceeded'));
                }

                // If already refreshing, queue this request
                if (isRefreshing) {
                    return new Promise((resolve) => {
                        subscribeTokenRefresh(() => {
                            // SECURITY FIX: No need to set Authorization header, cookies handle it
                            resolve(api(originalRequest));
                        });
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;
                lastRefreshAttempt = now;
                refreshRetryCount++;

                try {
                    // SECURITY FIX: Send refresh request with credentials (cookies)
                    // Server reads refresh_token from httpOnly cookie
                    const refreshToken = localStorage.getItem('refresh_token');
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/refresh`,
                        refreshToken ? { refresh_token: refreshToken } : {},
                        { withCredentials: true }
                    );

                    const { access_token, refresh_token } = response.data;
                    // BACKWARDS COMPAT: Still store in localStorage during transition
                    if (access_token) localStorage.setItem('token', access_token);
                    if (refresh_token) localStorage.setItem('refresh_token', refresh_token);

                    // Notify all queued requests
                    onRefreshed(access_token);
                    isRefreshing = false;
                    // Reset retry count on successful refresh
                    refreshRetryCount = 0;

                    // Retry original request - cookies are automatically included
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed - clear tokens and redirect
                    isRefreshing = false;
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');

                    if (!isPublicPage && !isOptionalAuthRequest) {
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token - redirect to login if appropriate
                const shouldRedirect = !isPublicPage &&
                    !isOptionalAuthRequest &&
                    !window.location.pathname.includes('/login') &&
                    !window.location.pathname.includes('/register');

                if (shouldRedirect) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

