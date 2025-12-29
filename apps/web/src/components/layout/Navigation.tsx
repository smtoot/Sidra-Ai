'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, Home, Search, Calendar, Wallet, Users, DollarSign, BookOpen, FileText, Clock, Settings, Shield, AlertTriangle, ChevronLeft, ChevronRight, Package, PlayCircle, CheckCircle, ChevronDown, GraduationCap, Heart, Headphones, Video, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { cn } from '@/lib/utils';

interface NavItem {
    label: string;
    href: string;
    icon: any;
}

interface NavGroup {
    label: string;
    icon: any;
    items: NavItem[];
}

interface NavigationProps {
    userRole: 'PARENT' | 'TEACHER' | 'ADMIN' | 'STUDENT' | 'SUPER_ADMIN' | 'MODERATOR' | 'CONTENT_ADMIN' | 'FINANCE' | 'SUPPORT';
    userName?: string;
}

const menuItems: Record<string, (NavItem | NavGroup)[]> = {
    PARENT: [
        { label: 'لوحة التحكم', href: '/parent', icon: Home },
        { label: 'البحث عن معلمين', href: '/search', icon: Search },
        { label: 'حجوزاتي', href: '/parent/bookings', icon: Calendar },
        { label: 'باقاتي', href: '/parent/packages', icon: Package },
        { label: 'أبنائي', href: '/parent/children', icon: Users },
        { label: 'المحفظة', href: '/parent/wallet', icon: Wallet },
        { label: 'الدعم الفني', href: '/support', icon: Headphones },
        { label: 'الملف الشخصي', href: '/parent/profile', icon: User },
        { label: 'الإعدادات', href: '/parent/settings', icon: Settings },
    ],
    TEACHER: [
        { label: 'الرئيسية', href: '/teacher', icon: Home },
        { label: 'ملفي الشخصي', href: '/teacher/profile-hub', icon: User },
        { label: 'الطلبات المعلقة', href: '/teacher/requests', icon: FileText },
        { label: 'حصصي', href: '/teacher/sessions', icon: Calendar },
        { label: 'باقات الطلاب', href: '/teacher/packages', icon: Package },
        { label: 'المحفظة', href: '/teacher/wallet', icon: DollarSign },
        { label: 'المواعيد', href: '/teacher/availability', icon: Clock },
        { label: 'الدعم الفني', href: '/support', icon: Headphones },
        { label: 'الإعدادات', href: '/teacher/settings', icon: Settings },
    ],
    STUDENT: [
        { label: 'لوحة التحكم', href: '/student', icon: Home },
        { label: 'البحث عن معلمين', href: '/search', icon: Search },
        { label: 'حصصي', href: '/student/bookings', icon: Calendar },
        { label: 'باقاتي', href: '/student/packages', icon: Package },
        { label: 'المحفظة', href: '/student/wallet', icon: Wallet },
        { label: 'المعلمين المفضلين', href: '/student/favorites', icon: Heart },
        { label: 'الدعم الفني', href: '/support', icon: Headphones },
        { label: 'الملف الشخصي', href: '/student/profile', icon: User },
        { label: 'الإعدادات', href: '/student/settings', icon: Settings },
    ],
    ADMIN: [
        // 1) Dashboard
        { label: 'لوحة التحكم', href: '/admin', icon: Home },

        // 2) User Management
        {
            label: 'إدارة المستخدمين',
            icon: Users,
            items: [
                { label: 'جميع المستخدمين', href: '/admin/users', icon: Users },
                { label: 'المعلمون', href: '/admin/teachers', icon: GraduationCap },
                { label: 'أولياء الأمور', href: '/admin/parents', icon: Heart },
                { label: 'الطلاب', href: '/admin/students', icon: BookOpen },
            ]
        },

        // 3) Teacher Management
        {
            label: 'إدارة المعلمين',
            icon: GraduationCap,
            items: [
                { label: 'طلبات الانضمام', href: '/admin/teacher-applications', icon: FileText },
                { label: 'المقابلات', href: '/admin/interviews', icon: Video },
            ]
        },

        // 4) Daily Operations
        {
            label: 'العمليات اليومية',
            icon: Calendar,
            items: [
                { label: 'الحجوزات', href: '/admin/bookings', icon: Calendar },
                { label: 'الحصص التجريبية', href: '/admin/demo', icon: PlayCircle },
            ]
        },

        // 5) Support & Complaints
        {
            label: 'الدعم والشكاوى',
            icon: Headphones,
            items: [
                { label: 'التذاكر والدعم', href: '/admin/support-tickets', icon: Headphones },
                { label: 'الشكاوى والنزاعات', href: '/admin/disputes', icon: AlertTriangle },
            ]
        },

        // 6) Financials
        {
            label: 'المالية',
            icon: DollarSign,
            items: [
                { label: 'لوحة المهام المالية', href: '/admin/financials', icon: CheckCircle },
                { label: 'الباقات المباعة', href: '/admin/packages', icon: Package },
                { label: 'طلبات السحب', href: '/admin/payouts', icon: FileText },
                { label: 'سجل المعاملات', href: '/admin/transactions', icon: DollarSign },
            ]
        },

        // 7) Educational Structure (Content)
        {
            label: 'الهيكل التعليمي',
            icon: BookOpen,
            items: [
                { label: 'المناهج والمواد', href: '/admin/content', icon: BookOpen },
                { label: 'إدارة الباقات الذكية', href: '/admin/package-tiers', icon: Package },
                { label: 'وسوم التدريس', href: '/admin/tags', icon: Tag },
            ]
        },

        // 8) System
        {
            label: 'النظام',
            icon: Settings,
            items: [
                { label: 'فريق الإدارة', href: '/admin/team', icon: Shield },
                { label: 'سجل العمليات', href: '/admin/audit-logs', icon: FileText },
                { label: 'إعدادات النظام', href: '/admin/settings', icon: Settings },
            ]
        }
    ],
};

import { useAuth } from '@/context/AuthContext';

export function Navigation({ userRole, userName }: NavigationProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();

    // Map all admin roles to use ADMIN menu items
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE', 'SUPPORT'];
    const effectiveRole = adminRoles.includes(userRole) ? 'ADMIN' : userRole;
    const items = menuItems[effectiveRole] || [];

    // Collapsible Groups State (track expanded groups by label)
    // Default expand common ones for easy access
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['العمليات اليومية', 'الدعم والشكاوى', 'المالية']);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const toggleGroup = (label: string) => {
        if (expandedGroups.includes(label)) {
            setExpandedGroups(expandedGroups.filter(g => g !== label));
        } else {
            setExpandedGroups([...expandedGroups, label]);
        }
    };

    // Type Guard
    const isGroup = (item: NavItem | NavGroup): item is NavGroup => {
        return (item as NavGroup).items !== undefined;
    };

    return (
        <div
            className={cn(
                "min-h-screen bg-surface border-l border-gray-200 flex flex-col font-tajawal rtl transition-all duration-300 relative",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Collapse Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -left-3 top-8 z-10 bg-primary text-white rounded-full p-1.5 shadow-lg hover:bg-primary-hover transition-colors"
                title={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
            >
                {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                ) : (
                    <ChevronLeft className="w-4 h-4" />
                )}
            </button>

            {/* Header */}
            <div className={cn(
                "p-6 border-b border-gray-200",
                isCollapsed && "p-4"
            )}>
                <div className="flex items-center justify-between">
                    {isCollapsed ? (
                        <h1 className="text-lg font-bold text-primary mx-auto">س</h1>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-primary">سدرة</h1>
                            <NotificationBell />
                        </>
                    )}
                </div>
                {userName && !isCollapsed && (
                    <p className="text-sm text-text-subtle mt-2">مرحباً، {userName}</p>
                )}
            </div>

            {/* Navigation Items */}
            <nav className={cn(
                "flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar",
                isCollapsed && "p-2"
            )}>
                {items.map((item, idx) => {
                    // Check if it's a Group
                    if (isGroup(item)) {
                        const Icon = item.icon;
                        const isExpanded = expandedGroups.includes(item.label);
                        const hasActiveChild = item.items.some(sub => pathname === sub.href);

                        return (
                            <div key={idx} className="space-y-1">
                                {!isCollapsed ? (
                                    <>
                                        {/* Group Header */}
                                        <button
                                            onClick={() => toggleGroup(item.label)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-right text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50",
                                                hasActiveChild && "text-primary bg-blue-50/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="w-4 h-4" />
                                                <span>{item.label}</span>
                                            </div>
                                            <ChevronDown className={cn("w-3 h-3 transition-transform text-gray-400", isExpanded ? "rotate-180" : "")} />
                                        </button>

                                        {/* Group Items */}
                                        {isExpanded && (
                                            <div className="pr-4 border-r-2 border-gray-100 mr-2 space-y-1 mt-1">
                                                {item.items.map(subItem => {
                                                    const SubIcon = subItem.icon;
                                                    const isSubActive = pathname === subItem.href;
                                                    return (
                                                        <button
                                                            key={subItem.href}
                                                            onClick={() => router.push(subItem.href)}
                                                            className={cn(
                                                                "w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-right text-sm",
                                                                isSubActive
                                                                    ? 'bg-primary/10 text-primary font-bold'
                                                                    : 'text-gray-600 hover:bg-gray-100'
                                                            )}
                                                        >
                                                            <SubIcon className="w-4 h-4 opacity-70" />
                                                            <span>{subItem.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* Collapsed Group View - Just Icons of children? Or Group Icon? 
                                       Let's render just the group icon for now with a tooltip, or maybe list children icons. 
                                       For now, let's render children icons directly to maintain access. 
                                    */
                                    <div className="border-b border-gray-100 pb-2 mb-2 last:border-0">
                                        {item.items.map(subItem => {
                                            const SubIcon = subItem.icon;
                                            const isSubActive = pathname === subItem.href;
                                            return (
                                                <button
                                                    key={subItem.href}
                                                    onClick={() => router.push(subItem.href)}
                                                    title={subItem.label} // Tooltip handles label
                                                    className={cn(
                                                        "w-full flex justify-center p-2 rounded-lg transition-colors mb-1",
                                                        isSubActive ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                                    )}
                                                >
                                                    <SubIcon className="w-5 h-5" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Single Item Code
                    else {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                title={isCollapsed ? item.label : undefined}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-right",
                                    isActive
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text hover:bg-gray-100',
                                    isCollapsed && "justify-center px-2"
                                )}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && (
                                    <span className="font-medium">{item.label}</span>
                                )}
                            </button>
                        );
                    }
                })}
            </nav>

            {/* Logout */}
            <div className={cn(
                "p-4 border-t border-gray-200",
                isCollapsed && "p-2"
            )}>
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    title={isCollapsed ? "تسجيل الخروج" : undefined}
                    className={cn(
                        "w-full justify-start gap-3 text-error hover:bg-error/10",
                        isCollapsed && "justify-center px-2"
                    )}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>تسجيل الخروج</span>}
                </Button>
            </div>
        </div>
    );
}
