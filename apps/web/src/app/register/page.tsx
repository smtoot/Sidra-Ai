'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole, TEACHER_EVENTS, STUDENT_EVENTS } from '@sidra/shared';
import Link from 'next/link';
import { Home, Search, Info, HelpCircle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

// Country codes - MENA region first (Sudan priority), then international
import { COUNTRY_CODES } from '@/lib/constants/country-codes';

export default function RegisterPage() {
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+249'); // Default to Sudan
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState<string>('PARENT');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Name is required for all roles
    const isTeacher = role === 'TEACHER';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate email - PRIMARY
        if (!email.trim()) {
            setError('البريد الإلكتروني مطلوب');
            return;
        }

        // Validate password
        if (password.length < 8) {
            setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }

        // Validate name
        if (!firstName.trim()) {
            setError('الاسم الأول مطلوب');
            return;
        }
        if (!lastName.trim()) {
            setError('اسم العائلة مطلوب');
            return;
        }

        // Validate phone number
        if (!phoneNumber.trim()) {
            setError('رقم الجوال مطلوب');
            return;
        }

        // Format full phone number with country code
        const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;

        setIsLoading(true);
        try {
            await register({
                email: email.trim(),
                phoneNumber: fullPhoneNumber,
                password,
                role: role as any,
                firstName: firstName.trim(),
                lastName: lastName.trim()
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'فشل التسجيل. حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
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
                        إنشاء حساب جديد
                    </h2>

                    {error && (
                        <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                أنا أريد التسجيل كـ:
                            </label>
                            <div className="mt-2 flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="PARENT"
                                        checked={role === 'PARENT'}
                                        onChange={() => setRole('PARENT')}
                                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-900 dark:text-gray-100">ولي أمر</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="STUDENT"
                                        checked={role === 'STUDENT'}
                                        onChange={() => setRole('STUDENT')}
                                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-900 dark:text-gray-100">طالب</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="TEACHER"
                                        checked={role === 'TEACHER'}
                                        onChange={() => {
                                            setRole('TEACHER');
                                            trackEvent(TEACHER_EVENTS.SIGNUP_STARTED);
                                        }}
                                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-900 dark:text-gray-100">معلم</span>
                                </label>
                            </div>
                        </div>

                        {/* Email - Moved to Top */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                البريد الإلكتروني <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="name@example.com"
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                dir="ltr"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                كلمة المرور <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                placeholder="••••••••"
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <p className="mt-1 text-xs text-gray-500">8 أحرف على الأقل</p>
                        </div>

                        {/* Name Fields - firstName + lastName */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* First Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    الاسم الأول <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="محمد"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            {/* Last Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    اسم العائلة <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="أحمد"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Phone Number - Moved to Bottom & Optional */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                رقم الجوال <span className="text-red-500">*</span>
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
                                {/* Country Code Selector */}
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="w-[140px] rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
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

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            تسجيل الدخول
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
