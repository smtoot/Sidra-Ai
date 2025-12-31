'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@sidra/shared';
import Link from 'next/link';
import { Home, Search, Info, HelpCircle } from 'lucide-react';

// Country codes - MENA region first (Sudan priority), then international
const COUNTRY_CODES = [
    // Primary - Sudan, Egypt, Saudi Arabia
    { code: '+249', country: 'السودان', flag: '🇸🇩' },
    { code: '+20', country: 'مصر', flag: '🇪🇬' },
    { code: '+966', country: 'السعودية', flag: '🇸🇦' },
    // Gulf Countries
    { code: '+971', country: 'الإمارات', flag: '🇦🇪' },
    { code: '+965', country: 'الكويت', flag: '🇰🇼' },
    { code: '+973', country: 'البحرين', flag: '🇧🇭' },
    { code: '+968', country: 'عُمان', flag: '🇴🇲' },
    { code: '+974', country: 'قطر', flag: '🇶🇦' },
    // Levant
    { code: '+962', country: 'الأردن', flag: '🇯🇴' },
    { code: '+961', country: 'لبنان', flag: '🇱🇧' },
    { code: '+970', country: 'فلسطين', flag: '🇵🇸' },
    { code: '+963', country: 'سوريا', flag: '🇸🇾' },
    { code: '+964', country: 'العراق', flag: '🇮🇶' },
    // North Africa
    { code: '+212', country: 'المغرب', flag: '🇲🇦' },
    { code: '+216', country: 'تونس', flag: '🇹🇳' },
    { code: '+213', country: 'الجزائر', flag: '🇩🇿' },
    { code: '+218', country: 'ليبيا', flag: '🇱🇾' },
    // Other Arab
    { code: '+967', country: 'اليمن', flag: '🇾🇪' },
    { code: '+222', country: 'موريتانيا', flag: '🇲🇷' },
    { code: '+252', country: 'الصومال', flag: '🇸🇴' },
    { code: '+253', country: 'جيبوتي', flag: '🇩🇯' },
    { code: '+269', country: 'جزر القمر', flag: '🇰🇲' },
    // International - Common
    { code: '+1', country: 'الولايات المتحدة', flag: '🇺🇸' },
    { code: '+44', country: 'المملكة المتحدة', flag: '🇬🇧' },
    { code: '+33', country: 'فرنسا', flag: '🇫🇷' },
    { code: '+49', country: 'ألمانيا', flag: '🇩🇪' },
    { code: '+90', country: 'تركيا', flag: '🇹🇷' },
    { code: '+91', country: 'الهند', flag: '🇮🇳' },
    { code: '+92', country: 'باكستان', flag: '🇵🇰' },
    { code: '+60', country: 'ماليزيا', flag: '🇲🇾' },
    { code: '+62', country: 'إندونيسيا', flag: '🇮🇩' },
    { code: '+234', country: 'نيجيريا', flag: '🇳🇬' },
    { code: '+27', country: 'جنوب أفريقيا', flag: '🇿🇦' },
    { code: '+55', country: 'البرازيل', flag: '🇧🇷' },
    { code: '+61', country: 'أستراليا', flag: '🇦🇺' },
    { code: '+86', country: 'الصين', flag: '🇨🇳' },
];

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

        // Validate first name
        if (!firstName.trim()) {
            setError('الاسم الأول مطلوب');
            return;
        }

        // Validate last name
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
                email: email || undefined,
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
                                    onChange={() => setRole('TEACHER')}
                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-gray-900 dark:text-gray-100">معلم</span>
                            </label>
                        </div>
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

                    {/* Phone Number with Country Code */}
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
                            {/* Country Code Selector - Second in DOM = Left side in RTL */}
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
        </div>
    );
}
