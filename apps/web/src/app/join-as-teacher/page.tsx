'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@sidra/shared';
import Link from 'next/link';
import { Home, Search, Info, HelpCircle, GraduationCap, CheckCircle } from 'lucide-react';

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

const TEACHER_BENEFITS = [
    'جدولك ومواعيدك بيدك',
    'دخل إضافي مضمون وآمن',
    'مجتمع تعليمي متميز',
    'دعم فني وتسويقي مستمر'
];

export default function JoinAsTeacherPage() {
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+249'); // Default to Sudan
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
                role: UserRole.TEACHER,
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

            <div className="container mx-auto px-4 py-8 sm:py-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    {/* Left Column: Form */}
                    <div className="w-full max-w-md mx-auto space-y-8 rounded-2xl bg-white p-6 sm:p-8 shadow-xl dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                انضم كمعلم
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                ابدأ رحلتك التعليمية مع سدرة اليوم
                            </p>
                        </div>

                        {error && (
                            <div className="rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        الاسم الأول <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="محمد"
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm p-2.5 border"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        اسم العائلة <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="أحمد"
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm p-2.5 border"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    رقم الجوال <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        required
                                        placeholder="9XXXXXXXX"
                                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm p-2.5 border"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        dir="ltr"
                                    />
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="w-[120px] rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm p-2.5 border"
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

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    البريد الإلكتروني (اختياري)
                                </label>
                                <input
                                    type="email"
                                    placeholder="example@email.com"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm p-2.5 border"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    dir="ltr"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    كلمة المرور <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="••••••••"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm p-2.5 border"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <p className="mt-1.5 text-xs text-gray-500">8 أحرف على الأقل</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'جاري إنشاء الحساب...' : 'سجّل الآن كمعلم'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                            لديك حساب بالفعل؟{' '}
                            <Link href="/login" className="font-bold text-primary hover:text-primary-700">
                                تسجيل الدخول
                            </Link>
                        </p>
                    </div>

                    {/* Right Column: Info/Marketing (Hidden on mobile) */}
                    <div className="hidden lg:block space-y-8">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
                                شارك معرفتك مع
                                <br />
                                <span className="text-primary">آلاف الطلاب</span>
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                                انضم إلى منصة سدرة وكن جزءاً من نخبة المعلمين. نحن نوفر لك الأدوات والبيئة المناسبة للنمو وزيادة دخلك.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {TEACHER_BENEFITS.map((benefit, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transform transition-transform hover:scale-[1.02]">
                                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                        {benefit}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Optional: Testimonial or Stat */}
                        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                            <div className="flex items-center gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <span key={s} className="text-yellow-400">★</span>
                                ))}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 italic font-medium">
                                "منصة رائعة سهلت علي الوصول لطلابي وتنظيم جدولي. الدعم الفني ممتاز والمدفوعات منتظمة."
                            </p>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed" alt="Teacher" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">أ. أحمد محمد</p>
                                    <p className="text-xs text-gray-500">معلم رياضيات</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
