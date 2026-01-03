import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
};

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
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
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userName');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            // Attempt token refresh
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                // If already refreshing, queue this request
                if (isRefreshing) {
                    return new Promise((resolve) => {
                        subscribeTokenRefresh((newToken: string) => {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            resolve(api(originalRequest));
                        });
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/refresh`,
                        { refreshToken }
                    );

                    const { access_token, refresh_token } = response.data;
                    localStorage.setItem('token', access_token);
                    localStorage.setItem('refresh_token', refresh_token);

                    // Notify all queued requests
                    onRefreshed(access_token);
                    isRefreshing = false;

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed - clear tokens and redirect
                    isRefreshing = false;
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userName');

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
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userName');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

