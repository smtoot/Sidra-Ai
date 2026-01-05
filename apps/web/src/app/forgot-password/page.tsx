'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authApi.forgotPassword(email);
            setIsSuccess(true);
        } catch (error: any) {
            console.error(error);
            // We generally don't show specific errors for security, but for UX on dev:
            // toast.error('Something went wrong. Please try again.');
            // But spec said logic: "If account exists, email sent".
            // So success state is always shown or specific error if invalid format?
            // API returns success even if user not found (security).
            setIsSuccess(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">تحقق من بريدك الإلكتروني</CardTitle>
                        <CardDescription>
                            إذا كان هذا البريد الإلكتروني مسجلاً لدينا، فقد أرسلنا لك رابطًا لإعادة تعيين كلمة المرور.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-500 text-center">
                            الرجاء التحقق من صندوق الوارد (والمجلد غير المرغوب فيه) واتباع التعليمات.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/login">
                                العودة لصفحة الدخول
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">نسيت كلمة المرور؟</CardTitle>
                    <CardDescription className="text-center">
                        أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <div className="relative">
                                <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    className="pr-9"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
                        </Button>
                        <Button asChild variant="ghost" className="w-full gap-2 text-gray-500">
                            <Link href="/login">
                                <ArrowRight className="w-4 h-4" />
                                العودة لتسجيل الدخول
                            </Link>
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
