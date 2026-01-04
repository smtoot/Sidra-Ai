'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, GraduationCap, User, LogOut, LayoutDashboard } from 'lucide-react';
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

const NAV_LINKS = [
    { href: '/search', label: 'ابحث عن معلم' },
    { href: '/how-it-works', label: 'كيف نعمل' },
    { href: '/join-as-teacher', label: 'انضم كمعلم' },
];

export function PublicNavbar() {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // SECURITY FIX: Use AuthContext instead of localStorage for role
    const { user, logout } = useAuth();
    const isLoggedIn = !!user;
    const userRole = user?.role;

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

    // Get initials for avatar fallback
    const getInitials = () => {
        if (!user?.email) return 'U';
        return user.email.charAt(0).toUpperCase();
    };

    return (
        <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-primary">سدرة</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-gray-600 hover:text-primary transition-colors font-medium"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {isLoggedIn ? (
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
                        className="md:hidden p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100">
                        <div className="flex flex-col gap-4">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-gray-600 hover:text-primary transition-colors font-medium py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                                {isLoggedIn ? (
                                    <>
                                        <div className="flex items-center gap-3 px-2 py-2 mb-2 bg-gray-50 rounded-lg">
                                            <Avatar
                                                fallback={getInitials()}
                                                className="h-8 w-8 border border-gray-200"
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
                                    <div className="flex gap-3">
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
                )}
            </div>
        </nav>
    );
}
