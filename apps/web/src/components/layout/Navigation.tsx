'use client';

import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, Home, Search, Calendar, Wallet, Users, DollarSign, BookOpen, FileText, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
    label: string;
    href: string;
    icon: any;
}

interface NavigationProps {
    userRole: 'PARENT' | 'TEACHER' | 'ADMIN' | 'STUDENT';
    userName?: string;
}

const menuItems: Record<string, NavItem[]> = {
    PARENT: [
        { label: 'البحث عن معلمين', href: '/search', icon: Search },
        { label: 'حجوزاتي', href: '/parent/bookings', icon: Calendar },
        { label: 'أبنائي', href: '/parent/children', icon: Users },
        { label: 'المحفظة', href: '/parent/wallet', icon: Wallet },
    ],
    TEACHER: [
        { label: 'الملف الشخصي', href: '/teacher/profile', icon: User },
        { label: 'المواد والأسعار', href: '/teacher/subjects', icon: BookOpen },
        { label: 'مواعيد التوافر', href: '/teacher/availability', icon: Clock },
        { label: 'الطلبات المعلقة', href: '/teacher/requests', icon: FileText },
        { label: 'جلساتي', href: '/teacher/sessions', icon: Calendar },
        { label: 'المحفظة', href: '/teacher/wallet', icon: DollarSign },
        { label: 'الإعدادات', href: '/teacher/settings', icon: Settings },
    ],
    STUDENT: [
        { label: 'لوحة التحكم', href: '/student/dashboard', icon: Home },
        { label: 'البحث عن معلمين', href: '/search', icon: Search },
        { label: 'حصصي', href: '/student/bookings', icon: Calendar },
        { label: 'المحفظة', href: '/student/wallet', icon: Wallet },
    ],
    ADMIN: [
        { label: 'الإدارة المالية', href: '/admin/financials', icon: DollarSign },
        { label: 'طلبات المعلمين', href: '/admin/teachers', icon: Users },
        { label: 'المستخدمين', href: '/admin/users', icon: User },
        { label: 'إدارة المحتوى', href: '/admin/content', icon: BookOpen },
    ],
};

import { useAuth } from '@/context/AuthContext';

// ... imports

export function Navigation({ userRole, userName }: NavigationProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();

    const items = menuItems[userRole] || [];

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="w-64 min-h-screen bg-surface border-l border-gray-200 flex flex-col font-tajawal rtl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-primary">سدرة</h1>
                {userName && (
                    <p className="text-sm text-text-subtle mt-1">مرحباً، {userName}</p>
                )}
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-2">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-right ${isActive
                                ? 'bg-primary text-white'
                                : 'text-text hover:bg-gray-100'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start gap-3 text-error hover:bg-error/10"
                >
                    <LogOut className="w-5 h-5" />
                    <span>تسجيل الخروج</span>
                </Button>
            </div>
        </div>
    );
}
