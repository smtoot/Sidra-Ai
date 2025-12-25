'use client';

import { useOnboarding } from '../OnboardingContext';
import { Check, Clock, Circle, MessageCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function StatusDashboard() {
    const { data, setCurrentStep } = useOnboarding();
    const status = data.applicationStatus?.applicationStatus || 'SUBMITTED';

    const getStatusInfo = () => {
        switch (status) {
            case 'SUBMITTED':
                return {
                    title: '🎉 تم استلام طلبك!',
                    subtitle: 'فريقنا يراجع ملفك الآن',
                    color: 'blue',
                };
            case 'CHANGES_REQUESTED':
                return {
                    title: '📝 مطلوب تعديلات',
                    subtitle: 'يرجى تحديث ملفك وإعادة الإرسال',
                    color: 'amber',
                };
            case 'INTERVIEW_REQUIRED':
                return {
                    title: '📅 مطلوب مقابلة',
                    subtitle: 'سيتم التواصل معك لتحديد موعد المقابلة',
                    color: 'purple',
                };
            case 'INTERVIEW_SCHEDULED':
                const date = data.applicationStatus?.interviewScheduledAt
                    ? format(new Date(data.applicationStatus.interviewScheduledAt), 'EEEE d MMMM yyyy - h:mm a', { locale: ar })
                    : 'قريباً';
                return {
                    title: '📅 تم تحديد موعد المقابلة',
                    subtitle: `الموعد: ${date}`,
                    color: 'indigo',
                };
            case 'APPROVED':
                return {
                    title: '🎊 تم قبول طلبك!',
                    subtitle: 'مبروك! يمكنك الآن البدء في التدريس',
                    color: 'green',
                };
            case 'REJECTED':
                return {
                    title: '❌ لم يتم قبول الطلب',
                    subtitle: data.applicationStatus?.rejectionReason || 'يمكنك التواصل مع الدعم لمزيد من المعلومات',
                    color: 'red',
                };
            default:
                return {
                    title: 'حالة الطلب',
                    subtitle: 'جاري التحقق...',
                    color: 'gray',
                };
        }
    };

    const statusInfo = getStatusInfo();

    const steps = [
        { id: 1, label: 'إنشاء الملف', done: true },
        { id: 2, label: 'مراجعة الفريق', done: status === 'APPROVED' || status === 'REJECTED', current: status === 'SUBMITTED' || status === 'CHANGES_REQUESTED' },
        { id: 3, label: 'الموافقة', done: status === 'APPROVED' },
    ];

    return (
        <div className="space-y-8 font-tajawal py-10">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                    statusInfo.color === 'green' && "bg-green-100",
                    statusInfo.color === 'blue' && "bg-blue-100",
                    statusInfo.color === 'amber' && "bg-amber-100",
                    statusInfo.color === 'red' && "bg-red-100",
                    statusInfo.color === 'purple' && "bg-purple-100",
                    statusInfo.color === 'indigo' && "bg-indigo-100",
                )}>
                    <span className="text-4xl">{statusInfo.title.split(' ')[0]}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                    {statusInfo.title.split(' ').slice(1).join(' ')}
                </h1>
                <p className="text-text-subtle">{statusInfo.subtitle}</p>
            </div>

            {/* Progress Steps */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-700 mb-6 text-center">حالة الطلب</h3>
                <div className="flex justify-between items-center max-w-md mx-auto">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                        step.done && "bg-green-500 text-white",
                                        step.current && "bg-blue-500 text-white animate-pulse",
                                        !step.done && !step.current && "bg-gray-200 text-gray-400"
                                    )}
                                >
                                    {step.done ? (
                                        <Check className="w-5 h-5" />
                                    ) : step.current ? (
                                        <Clock className="w-5 h-5" />
                                    ) : (
                                        <Circle className="w-5 h-5" />
                                    )}
                                </div>
                                <span className={cn(
                                    "mt-2 text-xs font-medium text-center",
                                    step.done && "text-green-600",
                                    step.current && "text-blue-600",
                                    !step.done && !step.current && "text-gray-400"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={cn(
                                    "flex-1 h-1 mx-3 rounded-full",
                                    step.done ? "bg-green-500" : "bg-gray-200"
                                )} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Expected Time */}
            {status === 'SUBMITTED' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <p className="text-blue-800">
                        ⏱ الوقت المتوقع للمراجعة: <strong>2-3 أيام عمل</strong>
                    </p>
                </div>
            )}

            {/* While Waiting Actions */}
            {(status === 'SUBMITTED' || status === 'INTERVIEW_REQUIRED') && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h3 className="font-bold text-gray-700">بينما تنتظر:</h3>
                    <div className="space-y-3">
                        <Link
                            href="/teacher/guide"
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-medium">قراءة دليل المعلم</span>
                        </Link>
                        <Link
                            href="/support"
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-medium">التواصل مع الدعم</span>
                        </Link>
                    </div>
                </div>
            )}

            {/* Approved Actions */}
            {status === 'APPROVED' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
                    <p className="text-green-800 font-medium">
                        🎊 مبروك! أنت الآن معلم معتمد في سِدرة
                    </p>
                    <Link
                        href="/teacher"
                        className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                    >
                        انتقل إلى لوحة التحكم
                    </Link>
                </div>
            )}

            {/* Changes Requested Actions */}
            {status === 'CHANGES_REQUESTED' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-amber-100 text-right">
                        <p className="font-bold text-amber-800 mb-2">ملاحظات فريق المراجعة:</p>
                        <p className="text-gray-700">{data.applicationStatus?.changeRequestReason || 'يرجى مراجعة البيانات المدخلة'}</p>
                    </div>

                    <p className="text-amber-700 text-sm">
                        يمكنك تعديل بياناتك وإعادة إرسال الطلب للمراجعة.
                    </p>

                    <Button
                        onClick={() => setCurrentStep(0)}
                        className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        تعديل الطلب
                    </Button>
                </div>
            )}
        </div>
    );
}
