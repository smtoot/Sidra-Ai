'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TEACHER_EVENTS } from '@sidra/shared';
import { trackEvent } from '@/lib/analytics';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { authApi } from '@/lib/api/auth';
import { COUNTRY_CODES } from '@/lib/constants/country-codes';
import { Mail, Lock, User, Phone, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

type Step = 'details' | 'otp';

export default function RegisterPage() {
    const router = useRouter();

    // Form state
    const [step, setStep] = useState<Step>('details');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+249'); // Default to Sudan
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState<string>('PARENT');
    const [otp, setOtp] = useState('');

    // UI state
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);

    // Start countdown for resend button
    const startResendCountdown = () => {
        setCanResend(false);
        setResendCountdown(60);
        const interval = setInterval(() => {
            setResendCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Step 1: Request Registration (Send OTP)
    const handleRequestRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate email
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
            await authApi.requestRegistration({
                email: email.trim(),
                phoneNumber: fullPhoneNumber,
                password,
                role: role as any,
                firstName: firstName.trim(),
                lastName: lastName.trim()
            });

            setSuccess('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
            setStep('otp');
            startResendCountdown();
        } catch (err: any) {
            const message = err.response?.data?.message || 'فشل إرسال رمز التحقق. حاول مرة أخرى.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (otp.length !== 6) {
            setError('يجب إدخال 6 أرقام');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.verifyRegistration({
                email: email.trim(),
                otp: otp.trim()
            });

            // Store tokens
            localStorage.setItem('token', response.access_token);
            if (response.refresh_token) {
                localStorage.setItem('refresh_token', response.refresh_token);
            }

            // Track successful registration
            if (role === 'TEACHER') {
                trackEvent(TEACHER_EVENTS.SIGNUP_COMPLETED);
            }

            setSuccess('تم إنشاء الحساب بنجاح! جاري تحويلك...');

            // Redirect based on role
            setTimeout(() => {
                if (role === 'PARENT') {
                    router.push('/parent');
                } else if (role === 'TEACHER') {
                    router.push('/teacher/onboarding');
                } else if (role === 'STUDENT') {
                    router.push('/student');
                } else {
                    router.push('/');
                }
            }, 1500);
        } catch (err: any) {
            const message = err.response?.data?.message || 'رمز التحقق غير صحيح. حاول مرة أخرى.';
            setError(message);
            setOtp('');
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        setError('');
        setIsLoading(true);

        try {
            await authApi.resendOtp({ email: email.trim() });
            setSuccess('تم إرسال رمز تحقق جديد');
            startResendCountdown();
        } catch (err: any) {
            const message = err.response?.data?.message || 'فشل إرسال الرمز. حاول مرة أخرى.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    // Go back to details step
    const handleBack = () => {
        setStep('details');
        setOtp('');
        setError('');
        setSuccess('');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <PublicNavbar />

            <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-8">
                <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                    {/* Header */}
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {step === 'details' ? 'إنشاء حساب جديد' : 'تأكيد البريد الإلكتروني'}
                        </h2>
                        {step === 'otp' && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                أدخل الرمز المكون من 6 أرقام المرسل إلى<br />
                                <span className="font-medium text-gray-900 dark:text-white">{email}</span>
                            </p>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-3 rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-red-700">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="flex items-start gap-3 rounded-lg border border-green-400 bg-green-50 px-4 py-3 text-green-700">
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{success}</span>
                        </div>
                    )}

                    {/* Step 1: Details Form */}
                    {step === 'details' && (
                        <form onSubmit={handleRequestRegistration} className="space-y-5">
                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    أنا أريد التسجيل كـ:
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="PARENT"
                                            checked={role === 'PARENT'}
                                            onChange={() => setRole('PARENT')}
                                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
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
                                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
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
                                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-gray-900 dark:text-gray-100">معلم</span>
                                    </label>
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    البريد الإلكتروني <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        className="block w-full rounded-md border border-gray-300 pr-10 p-2.5 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    كلمة المرور <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        placeholder="••••••••"
                                        className="block w-full rounded-md border border-gray-300 pr-10 p-2.5 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">8 أحرف على الأقل</p>
                            </div>

                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        الاسم الأول <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="محمد"
                                            className="block w-full rounded-md border border-gray-300 pr-10 p-2.5 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        اسم العائلة <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="أحمد"
                                        className="block w-full rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                                    <div className="relative flex-1">
                                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            required
                                            placeholder="9XXXXXXXX"
                                            className="block w-full rounded-md border border-gray-300 pr-10 p-2.5 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                            dir="ltr"
                                        />
                                    </div>
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="w-[140px] rounded-md border border-gray-300 p-2.5 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
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
                                className="flex w-full justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            {/* OTP Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-center">
                                    رمز التحقق <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    placeholder="••••••"
                                    className="block w-full text-center text-2xl tracking-[0.5em] rounded-md border border-gray-300 p-3 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    dir="ltr"
                                    autoFocus
                                />
                                <p className="mt-2 text-xs text-center text-gray-500">
                                    يستغرق وصول الرمز 1-2 دقيقة
                                </p>
                            </div>

                            {/* Verify Button */}
                            <button
                                type="submit"
                                disabled={isLoading || otp.length !== 6}
                                className="flex w-full justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'جاري التحقق...' : 'تأكيد وإنشاء الحساب'}
                            </button>

                            {/* Resend Button */}
                            <div className="text-center">
                                {canResend ? (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={isLoading}
                                        className="text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                                    >
                                        إعادة إرسال الرمز
                                    </button>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        يمكنك إعادة الإرسال بعد {resendCountdown} ثانية
                                    </p>
                                )}
                            </div>

                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                رجوع لتعديل البيانات
                            </button>
                        </form>
                    )}

                    {/* Login Link */}
                    {step === 'details' && (
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                            لديك حساب بالفعل؟{' '}
                            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                                تسجيل الدخول
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
