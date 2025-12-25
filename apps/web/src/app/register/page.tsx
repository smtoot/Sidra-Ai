'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@sidra/shared';
import Link from 'next/link';

export default function RegisterPage() {
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [role, setRole] = useState<string>('PARENT');
    const [error, setError] = useState('');

    // firstName is required for PARENT and STUDENT only
    const isFirstNameRequired = role === 'PARENT' || role === 'STUDENT';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isFirstNameRequired && !firstName.trim()) {
            setError('الاسم الأول مطلوب');
            return;
        }
        try {
            await register({
                email: email || undefined,
                phoneNumber,
                password,
                role: role as any,
                firstName: firstName || undefined
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            أنا أريد التسجيل كـ:
                        </label>
                        <div className="mt-2 flex gap-4">
                            <label className="flex items-center gap-2">
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
                            <label className="flex items-center gap-2">
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
                            <label className="flex items-center gap-2">
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

                    {/* First Name - Required for Parent/Student */}
                    {isFirstNameRequired && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                الاسم الأول *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="أدخل اسمك الأول"
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            رقم الجوال *
                        </label>
                        <input
                            type="tel"
                            required
                            placeholder="05XXXXXXXX"
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            البريد الإلكتروني (اختياري)
                        </label>
                        <input
                            type="email"
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            كلمة المرور
                        </label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        إنشاء الحساب
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
