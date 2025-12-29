import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    headers: {
        'Content-Type': 'application/json',
    },
});

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
    (error) => {
        if (typeof window !== 'undefined' && error.response?.status === 401) {
            // Don't redirect on failed login/register attempts
            const isLoginRequest = error.config?.url?.includes('/auth/login');
            const isRegisterRequest = error.config?.url?.includes('/auth/register');

            // Don't redirect on public teacher profile page where guests can browse
            const isPublicPage = window.location.pathname.startsWith('/teachers/');

            // Don't redirect on optional auth requests (profile checks for ownership, booking flow, etc.)
            // All package-related endpoints should be allowed to fail for guests browsing teachers
            const isOptionalAuthRequest = error.config?.url?.includes('/auth/profile') ||
                                         error.config?.url?.includes('/teacher/me') ||
                                         error.config?.url?.includes('/packages/');

            // Only redirect if:
            // 1. Not a login/register request
            // 2. Not already on login/register page
            // 3. Not on a public page where 401 is expected for guests
            const shouldRedirect = !isLoginRequest &&
                                  !isRegisterRequest &&
                                  !window.location.pathname.includes('/login') &&
                                  !window.location.pathname.includes('/register') &&
                                  !isPublicPage;

            if (shouldRedirect) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userName');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
