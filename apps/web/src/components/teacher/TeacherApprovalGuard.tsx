'use client';

import { useState, useEffect } from 'react';
import { useTeacherApplicationStatus } from '@/hooks/useTeacherApplicationStatus';
import { Lock, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TeacherApprovalGuardProps {
    children: React.ReactNode;
}

export function TeacherApprovalGuard({ children }: TeacherApprovalGuardProps) {
    const { status, loading } = useTeacherApplicationStatus();

    if (loading) {
        return <div className="p-12 text-center text-gray-500">جاري التحقق من الصلاحيات...</div>;
    }

    if (status?.applicationStatus === 'APPROVED') {
        return <>{children}</>;
    }

    // Dynamic Content based on Status
    const getContent = () => {
        switch (status?.applicationStatus) {
            case 'DRAFT':
                return {
                    title: 'طلبك غير مكتمل',
                    message: 'يرجى استكمال طلب الانضمام كمعلم لتتمكن من استخدام هذه الميزة.',
                    buttonText: 'استكمال الطلب',
                    buttonLink: '/teacher/onboarding'
                };
            case 'CHANGES_REQUESTED':
                return {
                    title: 'مطلوب تعديلات',
                    message: 'يرجى مراجعة الملاحظات على طلبك وتحديث البيانات المطلوبة.',
                    buttonText: 'تحديث الطلب',
                    buttonLink: '/teacher/onboarding'
                };
            case 'INTERVIEW_REQUIRED':
                return {
                    title: 'مطلوب مقابلة',
                    message: 'يرجى حجز موعد للمقابلة الشخصية لاستكمال إجراءات القبول.',
                    buttonText: 'حجز موعد',
                    buttonLink: '/teacher/dashboard'
                };
            case 'INTERVIEW_SCHEDULED':
                return {
                    title: 'تم تحديد موعد المقابلة',
                    message: `موعد مقابلتك: ${status.interviewScheduledAt ? new Date(status.interviewScheduledAt).toLocaleDateString() : 'قريباً'}.`,
                    buttonText: 'التفاصيل',
                    buttonLink: '/teacher/dashboard'
                };
            case 'REJECTED':
                return {
                    title: 'تم رفض الطلب',
                    message: 'نعتذر، لم يتم قبول طلبك في الوقت الحالي.',
                    buttonText: 'العودة للرئيسية',
                    buttonLink: '/teacher/dashboard'
                };
            case 'SUBMITTED':
            default:
                return {
                    title: 'طلبك قيد المراجعة',
                    message: 'جاري مراجعة طلبك من قبل المشرفين. ستصلك رسالة فور الموافقة عليه.',
                    buttonText: 'متابعة الحالة',
                    buttonLink: '/teacher/dashboard'
                };
        }
    };

    const content = getContent();

    // Locked State UI
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 m-8">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-10 h-10 text-gray-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {content.title}
            </h2>

            <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg mb-4 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                الميزة مقفلة
            </div>

            <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                {content.message}
            </p>

            <div className="flex gap-4">
                <Link href={content.buttonLink}>
                    <Button className="gap-2">
                        <Clock className="w-4 h-4" />
                        {content.buttonText}
                    </Button>
                </Link>
            </div>
        </div>
    );
}
