'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Home, Search, Info, HelpCircle } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const isEmail = identifier.includes('@');
            await login({
                email: isEmail ? identifier : undefined,
                phoneNumber: !isEmail ? identifier : undefined,
                password
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            {/* Navigation Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
                        >
                            سدرة
                        </Link>
                        <nav className="flex items-center gap-1 sm:gap-4">
                            <Link
                                href="/"
                                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">الرئيسية</span>
                            </Link>
                            <Link
                                href="/search"
                                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                <Search className="w-4 h-4" />
                                <span className="hidden sm:inline">ابحث عن معلم</span>
                            </Link>
                            <Link
                                href="/how-it-works"
                                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                <Info className="w-4 h-4" />
                                <span className="hidden sm:inline">كيف تعمل</span>
                            </Link>
                            <Link
                                href="/faq"
                                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">الأسئلة الشائعة</span>
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-8">
                <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                    <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        تسجيل الدخول
                    </h2>

                {error && (
                    <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            البريد الإلكتروني أو رقم الجوال
                        </label>
                        <input
                            name="identifier"
                            type="text"
                            required
                            placeholder="البريد الإلكتروني أو رقم الجوال"
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            كلمة المرور
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        دخول
                    </button>
                </form>

                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        ليس لديك حساب؟{' '}
                        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                            سجل الآن
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
