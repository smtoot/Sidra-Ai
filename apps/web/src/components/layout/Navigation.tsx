'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, Home, Search, Calendar, Wallet, Users, DollarSign, BookOpen, FileText, Clock, Settings, Shield, AlertTriangle, ChevronLeft, ChevronRight, Package, PlayCircle, CheckCircle, ChevronDown, GraduationCap, Heart, Headphones, Video, Tag, Menu, X, RotateCcw, Share2, Mail, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { teacherApi } from '@/lib/api/teacher';

interface NavItem {
    label: string;
    href: string;
    icon: any;
    count?: number; // Badge count
    tourId?: string; // Product tour target ID
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
        { label: 'لوحة التحكم', href: '/parent', icon: Home, tourId: 'nav-dashboard' },
        { label: 'البحث عن معلمين', href: '/search', icon: Search, tourId: 'nav-book-teacher' },
        { label: 'حجوزاتي', href: '/parent/bookings', icon: Calendar, tourId: 'nav-lessons' },
        { label: 'باقات الدروس', href: '/parent/packages', icon: Package },
        { label: 'أبنائي', href: '/parent/children', icon: Users, tourId: 'nav-children' },
        { label: 'المحفظة', href: '/parent/wallet', icon: Wallet, tourId: 'nav-wallet' },
        { label: 'الدعم الفني', href: '/support', icon: Headphones, tourId: 'nav-help' },
        { label: 'الملف الشخصي', href: '/parent/profile', icon: User, tourId: 'nav-profile' },
        { label: 'الإعدادات', href: '/parent/settings', icon: Settings },
    ],
    TEACHER: [
        { label: 'الرئيسية', href: '/teacher', icon: Home, tourId: 'nav-dashboard' },
        { label: 'ملفي الشخصي', href: '/teacher/profile-hub', icon: User, tourId: 'nav-profile' },
        { label: 'طلبات التدريس', href: '/teacher/requests', icon: FileText },
        { label: 'حصصي', href: '/teacher/sessions', icon: Calendar, tourId: 'nav-lessons' },
        { label: 'باقات الدروس', href: '/teacher/packages', icon: Package },
        { label: 'المحفظة', href: '/teacher/wallet', icon: DollarSign, tourId: 'nav-wallet' },
        { label: 'المواعيد', href: '/teacher/availability', icon: Clock, tourId: 'nav-availability' },
        { label: 'الدعم الفني', href: '/support', icon: Headphones, tourId: 'nav-help' },
        { label: 'روّج لنفسك', href: '/teacher/promote', icon: Share2 },
        { label: 'الإعدادات', href: '/teacher/settings', icon: Settings },
    ],
    STUDENT: [
        { label: 'لوحة التحكم', href: '/student', icon: Home, tourId: 'nav-dashboard' },
        { label: 'البحث عن معلمين', href: '/search', icon: Search, tourId: 'nav-book-teacher' },
        { label: 'حجوزاتي', href: '/student/bookings', icon: Calendar, tourId: 'nav-lessons' },
        { label: 'باقات الدروس', href: '/student/packages', icon: Package },
        { label: 'المحفظة', href: '/student/wallet', icon: Wallet, tourId: 'nav-wallet' },
        { label: 'المعلمين المفضلين', href: '/student/favorites', icon: Heart },
        { label: 'الدعم الفني', href: '/support', icon: Headphones, tourId: 'nav-help' },
        { label: 'الملف الشخصي', href: '/student/profile', icon: User, tourId: 'nav-profile' },
        { label: 'الإعدادات', href: '/student/settings', icon: Settings },
    ],
    ADMIN: [
        { label: 'لوحة التحكم', href: '/admin', icon: Home },
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
        {
            label: 'إدارة المعلمين',
            icon: GraduationCap,
            items: [
                { label: 'طلبات الانضمام', href: '/admin/teacher-applications', icon: FileText },
                { label: 'المقابلات', href: '/admin/interviews', icon: Video },
            ]
        },
        {
            label: 'العمليات اليومية',
            icon: Calendar,
            items: [
                { label: 'الحجوزات', href: '/admin/bookings', icon: Calendar },
                { label: 'الحصص التجريبية', href: '/admin/demo', icon: PlayCircle },
            ]
        },
        {
            label: 'الدعم والشكاوى',
            icon: Headphones,
            items: [
                { label: 'طلبات المساعدة', href: '/admin/support-tickets', icon: Headphones },
                { label: 'الشكاوى والنزاعات', href: '/admin/disputes', icon: AlertTriangle },
            ]
        },
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
        {
            label: 'الهيكل التعليمي',
            icon: BookOpen,
            items: [
                { label: 'المناهج والمواد', href: '/admin/content', icon: BookOpen },
                { label: 'إدارة الباقات الذكية', href: '/admin/package-tiers', icon: Package },
                { label: 'وسوم التدريس', href: '/admin/tags', icon: Tag },
            ]
        },
        {
            label: 'التقارير والتحليلات',
            icon: BarChart3,
            items: [
                { label: 'لوحة التحليلات', href: '/admin/analytics', icon: BarChart3 },
            ]
        },
        {
            label: 'النظام',
            icon: Settings,
            items: [
                { label: 'فريق الإدارة', href: '/admin/team', icon: Shield },
                { label: 'سجل العمليات', href: '/admin/audit-logs', icon: FileText },
                { label: 'إعدادات الفيديو', href: '/admin/video-settings', icon: Video },
                { label: 'إعدادات النظام', href: '/admin/settings', icon: Settings },
                { label: 'قوالب البريد', href: '/admin/email-previews', icon: Mail },
            ]
        }
    ],
};

export function Navigation({ userRole, userName }: NavigationProps) {

    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();
    const { packagesEnabled } = useSystemConfig();

    const [isApproved, setIsApproved] = useState(false);

    useEffect(() => {
        if (userRole === 'TEACHER') {
            teacherApi.getApplicationStatus()
                .then(data => setIsApproved(data.applicationStatus === 'APPROVED'))
                .catch(err => console.error('Failed to check status', err));
        }
    }, [userRole]);

    // Map all admin roles to use ADMIN menu items
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE', 'SUPPORT'];
    const effectiveRole = adminRoles.includes(userRole) ? 'ADMIN' : userRole;
    let items = menuItems[effectiveRole] || [];

    // Filter Promote Page if not approved
    if (userRole === 'TEACHER' && !isApproved) {
        items = items.filter(item => {
            // Check top level
            if ('href' in item && item.href === '/teacher/promote') return false;
            return true;
        });
    }

    // Filter out Package items if disabled
    if (!packagesEnabled) {
        items = items.map(item => {
            if ('items' in item) { // Check if it's a group
                // Filter sub-items
                const filteredSub = item.items.filter(sub =>
                    !sub.href.includes('/packages') &&
                    !sub.href.includes('/package-tiers')
                );
                return { ...item, items: filteredSub };
            }
            return item;
        }).filter(item => {
            // Filter top-level items
            if ('href' in item && typeof item.href === 'string') {
                if (item.href.includes('/packages')) return false;
            }
            // Remove empty groups (optional, but good for UI)
            if ('items' in item && item.items.length === 0) return false;
            return true;
        });
    }

    // State
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['العمليات اليومية', 'الدعم والشكاوى', 'المالية']);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [counts, setCounts] = useState<{ upcoming: number, support: number }>({ upcoming: 0, support: 0 });

    // Mock Fetch Counts (In production, fetch from API or Context)
    useEffect(() => {
        if (userRole === 'STUDENT') {
            // Simulate fetching data
            // In real app: const data = await studentApi.getDashboardStats()
            // setCounts({ upcoming: data.upcomingClasses.length, support: 0 })
            setCounts({ upcoming: 0, support: 0 });
        }
    }, [userRole]);

    // Helper to check if item is a group
    const isGroup = (item: NavItem | NavGroup): item is NavGroup => {
        return (item as NavGroup).items !== undefined;
    };

    // Inject counts into items
    const itemsWithCounts = items.map(item => {
        if (isGroup(item)) return item;

        // Add badges for Student
        if (userRole === 'STUDENT') {
            if (item.label === 'حجوزاتي') {
                return { ...item, count: counts.upcoming > 0 ? counts.upcoming : undefined };
            }
            if (item.label === 'الدعم الفني') {
                return { ...item, count: counts.support > 0 ? counts.support : undefined };
            }
        }
        return item;
    });

    // Use itemsWithCounts instead of items below


    // Listen for custom events (Product Tour)
    useEffect(() => {
        const handleOpenMobileMenu = () => setMobileMenuOpen(true);
        const handleExpandSidebar = () => setIsCollapsed(false);

        window.addEventListener('open-mobile-menu', handleOpenMobileMenu);
        window.addEventListener('expand-sidebar', handleExpandSidebar);

        return () => {
            window.removeEventListener('open-mobile-menu', handleOpenMobileMenu);
            window.removeEventListener('expand-sidebar', handleExpandSidebar);
        };
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const handleRestartTour = () => {
        setMobileMenuOpen(false);
        // Dispatch event to trigger the product tour
        window.dispatchEvent(new CustomEvent('start-product-tour'));
    };

    const toggleGroup = (label: string) => {
        if (expandedGroups.includes(label)) {
            setExpandedGroups(expandedGroups.filter(g => g !== label));
        } else {
            setExpandedGroups([...expandedGroups, label]);
        }
    };



    const handleNavClick = (href: string) => {
        router.push(href);
        setMobileMenuOpen(false);
    };

    // Shared Navigation Content (used in both desktop sidebar and mobile drawer)
    const NavigationContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <>
            {/* Header */}
            <div className={cn(
                "p-6 border-b border-gray-200",
                isCollapsed && !isMobile && "p-4"
            )}>
                <div className="flex items-center justify-between">
                    {isCollapsed && !isMobile ? (
                        <button
                            onClick={() => router.push('/')}
                            className="relative w-16 h-16 mx-auto hover:opacity-80 transition-opacity"
                        >
                            <Image
                                src="/images/logo-icon.png"
                                alt="Sidra"
                                fill
                                className="object-contain"
                            />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center hover:opacity-80 transition-opacity"
                            >
                                <div className="relative w-40 h-40">
                                    <Image
                                        src="/images/logo.png"
                                        alt="Sidra Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </button>
                            <div className="flex items-center gap-2">
                                <NotificationBell />
                                {isMobile && (
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
                {userName && (!isCollapsed || isMobile) && (
                    <p className="text-sm text-text-subtle mt-2">مرحباً، {userName}</p>
                )}
            </div>

            {/* Navigation Items */}
            <nav className={cn(
                "flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar",
                isCollapsed && !isMobile && "p-2"
            )}>
                {itemsWithCounts.map((item, idx) => {
                    if (isGroup(item)) {
                        const Icon = item.icon;
                        const isExpanded = expandedGroups.includes(item.label);
                        const hasActiveChild = item.items.some(sub => pathname === sub.href);

                        return (
                            <div key={idx} className="space-y-1">
                                {(!isCollapsed || isMobile) ? (
                                    <>
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

                                        {isExpanded && (
                                            <div className="pr-4 border-r-2 border-gray-100 mr-2 space-y-1 mt-1">
                                                {item.items.map(subItem => {
                                                    const SubIcon = subItem.icon;
                                                    const isSubActive = pathname === subItem.href;
                                                    return (
                                                        <button
                                                            key={subItem.href}
                                                            onClick={() => handleNavClick(subItem.href)}
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
                                    <div className="border-b border-gray-100 pb-2 mb-2 last:border-0">
                                        {item.items.map(subItem => {
                                            const SubIcon = subItem.icon;
                                            const isSubActive = pathname === subItem.href;
                                            return (
                                                <button
                                                    key={subItem.href}
                                                    onClick={() => handleNavClick(subItem.href)}
                                                    title={subItem.label}
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
                    } else {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        const count = item.count;

                        return (
                            <button
                                key={item.href}
                                onClick={() => handleNavClick(item.href)}
                                title={isCollapsed && !isMobile ? item.label : undefined}
                                data-tour={item.tourId}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-right relative",
                                    isActive
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text hover:bg-gray-100',
                                    isCollapsed && !isMobile && "justify-center px-2"
                                )}
                            >
                                <div className="relative">
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {/* Collapsed Badge */}
                                    {isCollapsed && !isMobile && count && count > 0 && (
                                        <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border border-white">
                                            {count > 9 ? '9+' : count}
                                        </span>
                                    )}
                                </div>
                                {(!isCollapsed || isMobile) && (
                                    <>
                                        <span className="font-medium flex-1 text-right">{item.label}</span>
                                        {/* Expanded Badge */}
                                        {count && count > 0 && (
                                            <span className={cn(
                                                "px-2 py-0.5 text-xs font-bold rounded-full",
                                                isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                                            )}>
                                                {count > 9 ? '+9' : count}
                                            </span>
                                        )}
                                    </>
                                )}
                            </button>
                        );
                    }
                })}
            </nav>

            {/* Footer Actions */}
            <div className={cn(
                "p-4 border-t border-gray-200 space-y-2",
                isCollapsed && !isMobile && "p-2"
            )}>
                {/* Restart Tour - Only for non-admin users */}
                {['PARENT', 'TEACHER', 'STUDENT'].includes(userRole) && (
                    <Button
                        variant="ghost"
                        onClick={handleRestartTour}
                        title={isCollapsed && !isMobile ? "إعادة الجولة التعريفية" : undefined}
                        className={cn(
                            "w-full justify-start gap-3 text-primary hover:bg-primary/10",
                            isCollapsed && !isMobile && "justify-center px-2"
                        )}
                    >
                        <RotateCcw className="w-5 h-5 flex-shrink-0" />
                        {(!isCollapsed || isMobile) && <span>إعادة الجولة التعريفية</span>}
                    </Button>
                )}
                {/* Logout */}
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    title={isCollapsed && !isMobile ? "تسجيل الخروج" : undefined}
                    className={cn(
                        "w-full justify-start gap-3 text-error hover:bg-error/10",
                        isCollapsed && !isMobile && "justify-center px-2"
                    )}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {(!isCollapsed || isMobile) && <span>تسجيل الخروج</span>}
                </Button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Header - Fixed at top */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        aria-label="فتح القائمة"
                    >
                        <Menu className="w-6 h-6 text-gray-700" />
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center hover:opacity-80 transition-opacity"
                    >
                        <div className="relative w-20 h-20">
                            <Image
                                src="/images/logo.png"
                                alt="Sidra Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </button>
                    <NotificationBell />
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 z-50 bg-black/50"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <div
                className={cn(
                    "md:hidden fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-white transform transition-transform duration-300 ease-in-out flex flex-col",
                    mobileMenuOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <NavigationContent isMobile={true} />
            </div>

            {/* Desktop Sidebar - Hidden on mobile */}
            <div
                className={cn(
                    "hidden md:flex min-h-screen bg-surface border-l border-gray-200 flex-col font-tajawal rtl transition-all duration-300 relative",
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

                <NavigationContent isMobile={false} />
            </div>
        </>
    );
}
