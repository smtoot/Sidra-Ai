'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, LogOut, LayoutDashboard, Search, Bell } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';

const NAV_LINKS = [
    { href: '/search', label: 'ابحث عن معلم' },
    { href: '/how-it-works', label: 'كيف نعمل' },
    { href: '/join-as-teacher', label: 'انضم كمعلم' },
];

export function PublicNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const { user, logout } = useAuth();
    const isLoggedIn = !!user;
    const userRole = user?.role;

    // Track scroll for navbar shadow
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getDashboardLink = () => {
        switch (userRole) {
            case 'TEACHER': return '/teacher/sessions';
            case 'PARENT': return '/parent';
            case 'STUDENT': return '/student';
            case 'ADMIN':
            case 'SUPER_ADMIN':
            case 'MODERATOR':
            case 'CONTENT_ADMIN':
            case 'FINANCE':
            case 'SUPPORT':
                return '/admin/financials';
            default: return '/login';
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const getInitials = () => {
        if (!user?.email) return 'U';
        return user.email.charAt(0).toUpperCase();
    };

    const isActiveLink = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <>
            <nav
                className={cn(
                    "bg-white/95 backdrop-blur-sm border-b sticky top-0 z-50 transition-all duration-300",
                    isScrolled ? "border-gray-200 shadow-md" : "border-gray-100"
                )}
                role="navigation"
                aria-label="Main navigation"
            >
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-24">
                        {/* Logo */}
                        <Link href="/" className="flex items-center group" aria-label="Sidra - الصفحة الرئيسية">
                            <div>
                                <Image
                                    src="/images/logo.png"
                                    alt="Sidra Logo"
                                    width={280}
                                    height={80}
                                    className="h-14 w-auto object-contain"
                                    priority
                                />
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "relative text-gray-600 hover:text-primary transition-colors font-medium py-2",
                                        isActiveLink(link.href) && "text-primary"
                                    )}
                                >
                                    {link.label}
                                    {/* Active indicator */}
                                    <span
                                        className={cn(
                                            "absolute bottom-0 right-0 w-full h-0.5 bg-primary rounded-full transition-transform origin-right",
                                            isActiveLink(link.href) ? "scale-x-100" : "scale-x-0"
                                        )}
                                    />
                                </Link>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="hidden md:flex items-center gap-2">
                            {/* Quick Search Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowSearchModal(true)}
                                className="text-gray-500 hover:text-primary"
                                aria-label="بحث سريع"
                            >
                                <Search className="w-5 h-5" />
                            </Button>

                            {isLoggedIn ? (
                                <>
                                    {/* Notifications */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-500 hover:text-primary relative"
                                        aria-label="الإشعارات"
                                    >
                                        <Bell className="w-5 h-5" />
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                                                <Avatar
                                                    src=""
                                                    alt={user?.email || ''}
                                                    fallback={getInitials()}
                                                    className="border border-gray-200"
                                                />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="end" forceMount>
                                            <DropdownMenuLabel className="font-normal text-right">
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-medium leading-none text-right">حسابي</p>
                                                    <p className="text-xs leading-none text-muted-foreground text-right">
                                                        {user?.email}
                                                    </p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => router.push(getDashboardLink())} className="justify-end cursor-pointer">
                                                <span className="ml-2">لوحة التحكم</span>
                                                <LayoutDashboard className="h-4 w-4 text-gray-500" />
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleLogout} className="justify-end text-red-600 focus:text-red-600 cursor-pointer">
                                                <span className="ml-2">تسجيل خروج</span>
                                                <LogOut className="h-4 w-4" />
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            ) : (
                                <>
                                    <Button variant="ghost" onClick={() => router.push('/login')}>
                                        تسجيل الدخول
                                    </Button>
                                    <Button onClick={() => router.push('/register')}>
                                        حساب جديد
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-expanded={mobileMenuOpen}
                            aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
                        >
                            <div className="relative w-6 h-6">
                                <span className={cn(
                                    "absolute left-0 w-6 h-0.5 bg-gray-700 transition-all duration-300",
                                    mobileMenuOpen ? "top-3 rotate-45" : "top-1"
                                )} />
                                <span className={cn(
                                    "absolute left-0 top-3 w-6 h-0.5 bg-gray-700 transition-all duration-300",
                                    mobileMenuOpen ? "opacity-0" : "opacity-100"
                                )} />
                                <span className={cn(
                                    "absolute left-0 w-6 h-0.5 bg-gray-700 transition-all duration-300",
                                    mobileMenuOpen ? "top-3 -rotate-45" : "top-5"
                                )} />
                            </div>
                        </button>
                    </div>

                    {/* Mobile Menu with Animation */}
                    <div
                        className={cn(
                            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
                            mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                        )}
                    >
                        <div className="py-4 border-t border-gray-100">
                            <div className="flex flex-col gap-2">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            "text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium py-3 px-4 rounded-lg",
                                            isActiveLink(link.href) && "text-primary bg-primary/5"
                                        )}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 mt-2">
                                    {isLoggedIn ? (
                                        <>
                                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                                                <Avatar
                                                    fallback={getInitials()}
                                                    className="h-10 w-10 border border-gray-200"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">حسابي</span>
                                                    <span className="text-xs text-gray-500">{user?.email}</span>
                                                </div>
                                            </div>
                                            <Button onClick={() => router.push(getDashboardLink())} className="w-full gap-2 justify-center">
                                                <LayoutDashboard className="w-4 h-4" />
                                                لوحة التحكم
                                            </Button>
                                            <Button variant="outline" onClick={handleLogout} className="w-full gap-2 justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100">
                                                <LogOut className="w-4 h-4" />
                                                تسجيل خروج
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="flex gap-3 px-4">
                                            <Button variant="outline" onClick={() => router.push('/login')} className="flex-1">
                                                تسجيل الدخول
                                            </Button>
                                            <Button onClick={() => router.push('/register')} className="flex-1">
                                                حساب جديد
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Quick Search Modal */}
            {showSearchModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4"
                    onClick={() => setShowSearchModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ابحث عن معلم أو مادة..."
                                className="flex-1 text-lg outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const value = (e.target as HTMLInputElement).value;
                                        router.push(`/search?q=${encodeURIComponent(value)}`);
                                        setShowSearchModal(false);
                                    }
                                }}
                            />
                            <button
                                onClick={() => setShowSearchModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">عمليات بحث شائعة</p>
                            <div className="flex flex-wrap gap-2">
                                {['رياضيات', 'فيزياء', 'لغة عربية', 'لغة إنجليزية', 'كيمياء'].map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => {
                                            router.push(`/search?q=${encodeURIComponent(term)}`);
                                            setShowSearchModal(false);
                                        }}
                                        className="px-4 py-2 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-full text-sm transition-colors"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
