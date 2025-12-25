'use client';

import { useState, useEffect } from 'react';
import { teacherApi, ApplicationStatusType, TeacherApplicationStatus } from '@/lib/api/teacher';
import { CheckCircle, Clock, AlertCircle, MessageSquare, Calendar, XCircle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ApplicationStatusBannerProps {
    onStatusChange?: () => void;
}

interface StatusConfig {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    message: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
    showEditButton?: boolean;
    showSubmitButton?: boolean;
}

const STATUS_CONFIG: Record<ApplicationStatusType, StatusConfig> = {
    DRAFT: {
        icon: Edit,
        title: 'أكمل ملفك الشخصي',
        message: 'أكمل بياناتك وأرسل طلبك للمراجعة للبدء في التدريس',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        iconColor: 'text-blue-600',
        showSubmitButton: true,
    },
    SUBMITTED: {
        icon: Clock,
        title: 'تم استلام طلبك! ✨',
        message: 'سنراجع طلبك خلال ٢-٣ أيام عمل',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900',
        iconColor: 'text-green-600',
    },
    CHANGES_REQUESTED: {
        icon: MessageSquare,
        title: 'يرجى تحديث بياناتك',
        message: '', // Will be set dynamically from changeRequestReason
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        textColor: 'text-yellow-900',
        iconColor: 'text-yellow-600',
        showEditButton: true,
        showSubmitButton: true,
    },
    INTERVIEW_REQUIRED: {
        icon: MessageSquare,
        title: 'نود التحدث معك! 📞',
        message: 'سنتواصل معك قريباً لتحديد موعد المقابلة',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        iconColor: 'text-blue-600',
    },
    INTERVIEW_SCHEDULED: {
        icon: Calendar,
        title: 'موعد المقابلة محدد',
        message: '', // Will be set dynamically from interviewScheduledAt
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        iconColor: 'text-blue-600',
    },
    APPROVED: {
        icon: CheckCircle,
        title: 'مرحباً بك في سدرة! 🎉',
        message: 'تم قبول طلبك. يمكنك الآن البدء في استقبال الحجوزات',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900',
        iconColor: 'text-green-600',
    },
    REJECTED: {
        icon: XCircle,
        title: 'للأسف، لم يتم قبول طلبك',
        message: '', // Will be set dynamically from rejectionReason
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-900',
        iconColor: 'text-red-600',
    },
};

export function ApplicationStatusBanner({ onStatusChange }: ApplicationStatusBannerProps) {
    const [status, setStatus] = useState<TeacherApplicationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // Storage key for dismissal persistence
    const DISMISSED_KEY = 'sidra_approved_banner_dismissed';

    useEffect(() => {
        // Check if banner was previously dismissed (only for APPROVED status)
        const wasDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
        setDismissed(wasDismissed);
        loadStatus();
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        // Persist dismissal to localStorage
        localStorage.setItem(DISMISSED_KEY, 'true');
    };

    const loadStatus = async () => {
        try {
            const data = await teacherApi.getApplicationStatus();
            setStatus(data);
        } catch (error) {
            console.error('Failed to load application status', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await teacherApi.submitForReview();
            toast.success('تم إرسال طلبك للمراجعة بنجاح! ✨');
            loadStatus();
            onStatusChange?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'فشل إرسال الطلب');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !status) return null;

    // Don't show banner for approved teachers (after dismissal)
    if (status.applicationStatus === 'APPROVED' && dismissed) return null;

    const config = STATUS_CONFIG[status.applicationStatus];
    const Icon = config.icon;

    // Build dynamic message
    let message = config.message;
    if (status.applicationStatus === 'CHANGES_REQUESTED' && status.changeRequestReason) {
        message = status.changeRequestReason;
    }
    if (status.applicationStatus === 'REJECTED' && status.rejectionReason) {
        message = status.rejectionReason;
    }
    if (status.applicationStatus === 'INTERVIEW_SCHEDULED' && status.interviewScheduledAt) {
        const date = new Date(status.interviewScheduledAt);
        message = `الموعد: ${format(date, 'EEEE d MMMM yyyy الساعة h:mm a', { locale: ar })}`;
    }

    return (
        <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4 mb-6`}>
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${config.bgColor}`}>
                    <Icon className={`w-6 h-6 ${config.iconColor}`} />
                </div>
                <div className="flex-1">
                    <h3 className={`font-bold text-lg ${config.textColor}`}>
                        {config.title}
                    </h3>
                    <p className={`mt-1 ${config.textColor} opacity-80`}>
                        {message}
                    </p>

                    {/* Interview Link */}
                    {status.applicationStatus === 'INTERVIEW_SCHEDULED' && status.interviewLink && (
                        <a
                            href={status.interviewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-blue-600 hover:underline"
                        >
                            🔗 رابط الاجتماع
                        </a>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-3">
                        {config.showSubmitButton && (
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="bg-primary text-white"
                            >
                                {submitting ? 'جاري الإرسال...' : 'إرسال للمراجعة'}
                            </Button>
                        )}

                        {status.applicationStatus === 'APPROVED' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDismiss}
                            >
                                إخفاء
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
