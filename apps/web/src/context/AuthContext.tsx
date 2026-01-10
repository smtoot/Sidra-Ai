'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';
import { LoginDto, RegisterDto, TEACHER_EVENTS, STUDENT_EVENTS } from '@sidra/shared';
import { useRouter } from 'next/navigation';
import { aliasUser, identifyUser, resetUser, getDeviceType, trackEvent } from '@/lib/analytics';

interface User {
    id: string;
    email?: string;
    phoneNumber?: string;
    role: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
}

interface AuthContextType {
    user: User | null;
    login: (dto: LoginDto) => Promise<void>;
    register: (dto: RegisterDto) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
    isLoading: boolean;
}

// Helper to safely decode JWT with UTF-8 characters (like Arabic)
function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to parse JWT", e);
        return {};
    }
}

/**
 * SECURITY FIX: Helper to extract user from token
 * Used for cross-tab synchronization
 */
function getUserFromToken(token: string | null): User | null {
    if (!token) return null;
    const payload = parseJwt(token);
    if (!payload || !payload.sub) return null;
    return {
        id: payload.sub,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        role: payload.role,
        firstName: payload.firstName,
        lastName: payload.lastName,
        displayName: payload.displayName
    };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    /**
     * SECURITY FIX: Sync auth state from localStorage
     * Called on mount and when storage changes in another tab
     */
    const syncAuthState = useCallback(() => {
        const token = localStorage.getItem('token');
        const newUser = getUserFromToken(token);

        setUser(currentUser => {
            // If no token, clear user
            if (!newUser) {
                if (currentUser) {
                    console.log('[Auth] Session ended in another tab, logging out');
                    resetUser();
                }
                return null;
            }

            // If different user logged in, update state
            if (!currentUser || currentUser.id !== newUser.id) {
                console.log('[Auth] Different user detected, syncing state');
                // Re-identify with PostHog
                identifyUser(newUser.id, {
                    user_role: newUser.role,
                    device_type: getDeviceType(),
                });
                return newUser;
            }

            return currentUser;
        });
    }, []);

    // Initial session check
    useEffect(() => {
        syncAuthState();
        setIsLoading(false);
    }, [syncAuthState]);

    /**
     * SECURITY FIX: Listen for storage changes from other tabs
     * When another tab logs in/out, this tab syncs its state
     */
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            // Only react to token changes
            if (event.key === 'token') {
                console.log('[Auth] Token changed in another tab');
                syncAuthState();

                // If token was removed (logout in another tab), redirect to login
                if (!event.newValue && user) {
                    console.log('[Auth] Logged out in another tab, redirecting to login');
                    router.push('/login');
                }
                // If a different user logged in, redirect to their dashboard
                else if (event.newValue && event.newValue !== event.oldValue) {
                    const newUser = getUserFromToken(event.newValue);
                    if (newUser && (!user || user.id !== newUser.id)) {
                        console.log('[Auth] Different user logged in another tab, redirecting');
                        // Redirect based on new user's role
                        if (newUser.role === 'PARENT') {
                            router.push('/parent');
                        } else if (newUser.role === 'TEACHER') {
                            router.push('/teacher');
                        } else if (['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE', 'SUPPORT'].includes(newUser.role)) {
                            router.push('/admin');
                        } else if (newUser.role === 'STUDENT') {
                            router.push('/student');
                        } else {
                            router.push('/');
                        }
                    }
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user, router, syncAuthState]);

    /**
     * Helper to redirect teachers based on their applicationStatus
     */
    const redirectTeacher = async () => {
        try {
            const { data } = await api.get('/teacher/me/application-status');
            const status = data.applicationStatus;

            if (status === 'DRAFT' || status === 'CHANGES_REQUESTED') {
                // Need to complete/update onboarding
                router.push('/teacher/onboarding');
            } else if (status === 'APPROVED') {
                // Fully approved - go to dashboard
                router.push('/teacher');
            } else {
                // SUBMITTED, INTERVIEW_*, REJECTED - go to profile to see status
                router.push('/teacher');
            }
        } catch (error) {
            // Fallback: if status check fails, go to onboarding
            console.error('Failed to check teacher status, redirecting to onboarding', error);
            router.push('/teacher/onboarding');
        }
    };

    const login = async (dto: LoginDto) => {
        const { data } = await api.post('/auth/login', dto);
        // BACKWARDS COMPAT: Store tokens in localStorage during transition to httpOnly cookies
        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }
        const payload = parseJwt(data.access_token);

        // SECURITY FIX: Remove role from localStorage - use context only
        // This prevents client-side role tampering
        const displayName = payload.displayName || payload.firstName || payload.phoneNumber || payload.email?.split('@')[0] || 'User';
        localStorage.setItem('userName', displayName); // Display name is non-sensitive

        setUser({
            id: payload.sub,
            email: payload.email,
            phoneNumber: payload.phoneNumber,
            role: payload.role,
            firstName: payload.firstName,
            lastName: payload.lastName,
            displayName: payload.displayName
        });

        // PostHog: Alias anonymous user to identified user, then identify
        aliasUser(payload.sub);
        identifyUser(payload.sub, {
            user_role: payload.role,
            device_type: getDeviceType(),
        });

        // Check for returnUrl (e.g., from booking flow redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl');

        if (returnUrl) {
            // Validate returnUrl is a relative path (security: prevent open redirect)
            if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
                // Add openBooking=true to auto-open booking modal on return
                const separator = returnUrl.includes('?') ? '&' : '?';
                router.push(`${returnUrl}${separator}openBooking=true`);
                return;
            }
        }

        // Role-based redirect (fallback when no returnUrl)
        if (payload.role === 'PARENT') {
            router.push('/parent');
        } else if (payload.role === 'TEACHER') {
            // Check application status for teachers
            await redirectTeacher();
        } else if (['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE', 'SUPPORT'].includes(payload.role)) {
            router.push('/admin');
        } else if (payload.role === 'STUDENT') {
            router.push('/student');
        } else {
            router.push('/');
        }
    };

    const register = async (dto: RegisterDto) => {
        const { data } = await api.post('/auth/register', dto);
        // BACKWARDS COMPAT: Store tokens in localStorage during transition to httpOnly cookies
        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }
        const payload = parseJwt(data.access_token);

        // SECURITY FIX: Remove role from localStorage - use context only
        const displayName = payload.displayName || payload.firstName || payload.phoneNumber || payload.email?.split('@')[0] || 'User';
        localStorage.setItem('userName', displayName); // Display name is non-sensitive

        setUser({
            id: payload.sub,
            email: payload.email,
            phoneNumber: payload.phoneNumber,
            role: payload.role,
            firstName: payload.firstName,
            lastName: payload.lastName,
            displayName: payload.displayName
        });

        // PostHog: Alias, track signup, and identify
        aliasUser(payload.sub);
        if (payload.role === 'TEACHER') {
            trackEvent(TEACHER_EVENTS.SIGNUP_COMPLETED);
        } else {
            trackEvent(STUDENT_EVENTS.SIGNUP_COMPLETED);
        }
        identifyUser(payload.sub, {
            user_role: payload.role,
            device_type: getDeviceType(),
        });

        // Check for returnUrl (e.g., from booking flow redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl');

        if (returnUrl) {
            // Validate returnUrl is a relative path (security: prevent open redirect)
            if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
                // Add openBooking=true to auto-open booking modal on return
                const separator = returnUrl.includes('?') ? '&' : '?';
                router.push(`${returnUrl}${separator}openBooking=true`);
                return;
            }
        }

        // Role-based redirect (fallback when no returnUrl)
        if (payload.role === 'PARENT') {
            router.push('/parent');
        } else if (payload.role === 'TEACHER') {
            // New teachers always go to onboarding (they start as DRAFT)
            router.push('/teacher/onboarding');
        } else if (['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE', 'SUPPORT'].includes(payload.role)) {
            router.push('/admin');
        } else if (payload.role === 'STUDENT') {
            router.push('/student');
        } else {
            router.push('/');
        }
    };

    const logout = async () => {
        try {
            // SECURITY FIX: Call logout API to clear httpOnly cookies
            await api.post('/auth/logout', {});
        } catch (e) {
            // Ignore errors - still clear local state
            console.debug('Logout API call failed, clearing local state anyway');
        }
        // Clear localStorage during transition period
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userName');
        resetUser(); // Reset PostHog identification
        setUser(null);
        router.push('/login');
    };

    // Update user info (e.g., after profile update) without requiring re-login
    const updateUser = (updates: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

