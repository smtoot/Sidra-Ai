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
            // Don't redirect on failed login attempts
            const isLoginRequest = error.config?.url?.includes('/auth/login');

            if (!isLoginRequest && !window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userName');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
