'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@sidra/shared';
import Link from 'next/link';

// Common country codes for MENA region
const COUNTRY_CODES = [
    { code: '+966', country: 'السعودية', flag: '🇸🇦' },
    { code: '+971', country: 'الإمارات', flag: '🇦🇪' },
    { code: '+965', country: 'الكويت', flag: '🇰🇼' },
    { code: '+973', country: 'البحرين', flag: '🇧🇭' },
    { code: '+968', country: 'عُمان', flag: '🇴🇲' },
    { code: '+974', country: 'قطر', flag: '🇶🇦' },
    { code: '+20', country: 'مصر', flag: '🇪🇬' },
    { code: '+962', country: 'الأردن', flag: '🇯🇴' },
    { code: '+961', country: 'لبنان', flag: '🇱🇧' },
    { code: '+970', country: 'فلسطين', flag: '🇵🇸' },
    { code: '+212', country: 'المغرب', flag: '🇲🇦' },
    { code: '+216', country: 'تونس', flag: '🇹🇳' },
    { code: '+213', country: 'الجزائر', flag: '🇩🇿' },
    { code: '+967', country: 'اليمن', flag: '🇾🇪' },
    { code: '+964', country: 'العراق', flag: '🇮🇶' },
    { code: '+963', country: 'سوريا', flag: '🇸🇾' },
];

export default function RegisterPage() {
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+966');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [role, setRole] = useState<string>('PARENT');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Name is required for all roles
    const isTeacher = role === 'TEACHER';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate name for all roles
        if (!firstName.trim()) {
            setError('الاسم مطلوب');
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
                email: email || undefined,
                phoneNumber: fullPhoneNumber,
                password,
                role: role as any,
                firstName: firstName.trim()
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'فشل التسجيل. حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900" dir="rtl">
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
                                    onChange={() => setRole('TEACHER')}
                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-gray-900 dark:text-gray-100">معلم</span>
                            </label>
                        </div>
                    </div>

                    {/* Name Field - Required for ALL roles */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {isTeacher ? 'الاسم الكامل' : 'الاسم الأول'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder={isTeacher ? 'أدخل اسمك الكامل' : 'أدخل اسمك الأول'}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        {isTeacher && (
                            <p className="mt-1 text-xs text-gray-500">سيظهر هذا الاسم في ملفك الشخصي</p>
                        )}
                    </div>

                    {/* Phone Number with Country Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            رقم الجوال <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 flex gap-2">
                            {/* Country Code Selector */}
                            <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="w-[140px] rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                            >
                                {COUNTRY_CODES.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.flag} {c.code}
                                    </option>
                                ))}
                            </select>
                            {/* Phone Number Input */}
                            <input
                                type="tel"
                                required
                                placeholder="5XXXXXXXX"
                                className="flex-1 rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                dir="ltr"
                            />
                        </div>
                    </div>

                    {/* Email - Optional */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            البريد الإلكتروني (اختياري)
                        </label>
                        <input
                            type="email"
                            placeholder="example@email.com"
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
    );
}
