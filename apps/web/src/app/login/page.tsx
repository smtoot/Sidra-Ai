'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Home, Search, Info, HelpCircle } from 'lucide-react';
import { COUNTRY_CODES } from '@/lib/constants/country-codes';

export default function LoginPage() {
    const { login } = useAuth();
    const [loginMethod, setLoginMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL'); // Default to EMAIL
    const [countryCode, setCountryCode] = useState('+249');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let identifier = '';

            if (loginMethod === 'PHONE') {
                if (!phoneNumber) {
                    setError('رقم الجوال مطلوب');
                    return;
                }
                // Format: +249123456789 (remove leading zeros)
                identifier = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
            } else {
                if (!email) {
                    setError('البريد الإلكتروني مطلوب');
                    return;
                }
                identifier = email;
            }

            await login({
                // Pass formatted phone if method is PHONE, otherwise pass identifier as email
                phoneNumber: loginMethod === 'PHONE' ? identifier : undefined,
                email: loginMethod === 'EMAIL' ? identifier : undefined,
                password
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'فشل تسجيل الدخول');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            {/* Header omitted in this chunk, assuming unchanged */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
                            سدرة
                        </Link>
                        {/* Navigation links omitted for brevity, assuming generic header logic */}
                        <nav className="flex items-center gap-1 sm:gap-4">
                            <Link href="/" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-sm text-gray-600 hover:text-primary transition-colors">
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">الرئيسية</span>
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

                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            className={`flex-1 py-2 text-center font-medium text-sm border-b-2 transition-colors ${loginMethod === 'EMAIL'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setLoginMethod('EMAIL')}
                        >
                            البريد الإلكتروني
                        </button>
                        <button
                            className={`flex-1 py-2 text-center font-medium text-sm border-b-2 transition-colors ${loginMethod === 'PHONE'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setLoginMethod('PHONE')}
                        >
                            رقم الجوال
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {loginMethod === 'PHONE' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    رقم الجوال
                                </label>
                                <div className="mt-1 flex gap-2">
                                    {/* Phone Number Input - First in DOM = Right side in RTL */}
                                    <input
                                        type="tel"
                                        required
                                        placeholder="9XXXXXXXX"
                                        className="flex-1 rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        dir="ltr"
                                    />
                                    {/* Country Code Selector - Second in DOM = Left side in RTL */}
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="w-[35%] sm:w-[140px] rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                                        dir="ltr"
                                    >
                                        {COUNTRY_CODES.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.code}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    البريد الإلكتروني
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="example@email.com"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                        )}

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
                        <div className="flex justify-start">
                            <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                نسيت كلمة المرور؟
                            </Link>
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
