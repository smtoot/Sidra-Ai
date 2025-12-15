'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { LoginDto, RegisterDto } from '@sidra/shared';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (dto: LoginDto) => Promise<void>;
    register: (dto: RegisterDto) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check initial session
        const token = localStorage.getItem('token');
        if (token) {
            // Decode simple payload or fetch profile (simulating decode for now)
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ id: payload.sub, email: payload.email, role: payload.role });
            } catch (e) {
                localStorage.removeItem('token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (dto: LoginDto) => {
        const { data } = await api.post('/auth/login', dto);
        localStorage.setItem('token', data.access_token);
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));

        // Store user info for Navigation
        localStorage.setItem('userRole', payload.role);
        localStorage.setItem('userName', payload.email.split('@')[0]); // Extract name from email

        setUser({ id: payload.sub, email: payload.email, role: payload.role });

        // Role-based redirect
        if (payload.role === 'PARENT') {
            router.push('/search');
        } else if (payload.role === 'TEACHER') {
            router.push('/teacher/profile');
        } else if (payload.role === 'ADMIN') {
            router.push('/admin/financials');
        } else if (payload.role === 'STUDENT') {
            router.push('/student/dashboard');
        } else {
            router.push('/');
        }
    };

    const register = async (dto: RegisterDto) => {
        const { data } = await api.post('/auth/register', dto);
        localStorage.setItem('token', data.access_token);
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));

        // Store user info for Navigation
        localStorage.setItem('userRole', payload.role);
        localStorage.setItem('userName', payload.email.split('@')[0]);

        setUser({ id: payload.sub, email: payload.email, role: payload.role });

        // Role-based redirect (same as login)
        if (payload.role === 'PARENT') {
            router.push('/search');
        } else if (payload.role === 'TEACHER') {
            router.push('/teacher/profile');
        } else if (payload.role === 'ADMIN') {
            router.push('/admin/financials');
        } else if (payload.role === 'STUDENT') {
            router.push('/student/dashboard');
        } else {
            router.push('/');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
