'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, GraduationCap, User } from 'lucide-react';

const NAV_LINKS = [
    { href: '/search', label: 'ابحث عن معلم' },
    { href: '/how-it-works', label: 'كيف نعمل' },
    { href: '/join-as-teacher', label: 'انضم كمعلم' },
];

export function PublicNavbar() {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        setIsLoggedIn(!!token);
        setUserRole(role);
    }, []);

    const getDashboardLink = () => {
        switch (userRole) {
            case 'TEACHER': return '/teacher/sessions';
            case 'PARENT': return '/parent';
            case 'STUDENT': return '/student';
            case 'ADMIN': return '/admin/financials';
            default: return '/login';
        }
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
                            <Button onClick={() => router.push(getDashboardLink())} className="gap-2">
                                <User className="w-4 h-4" />
                                لوحة التحكم
                            </Button>
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
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                {isLoggedIn ? (
                                    <Button onClick={() => router.push(getDashboardLink())} className="flex-1">
                                        لوحة التحكم
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outline" onClick={() => router.push('/login')} className="flex-1">
                                            تسجيل الدخول
                                        </Button>
                                        <Button onClick={() => router.push('/register')} className="flex-1">
                                            حساب جديد
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
