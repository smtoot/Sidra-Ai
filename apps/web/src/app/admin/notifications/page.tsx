'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
    Bell, Mail, Calendar, CreditCard, AlertTriangle, CheckCircle,
    Clock, User, BookOpen, Eye, Code
} from 'lucide-react';

interface EmailTemplate {
    id: string;
    name: string;
    nameAr: string;
    description: string;
    category: 'booking' | 'payment' | 'account' | 'system';
    triggers: string[];
    variables: string[];
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        id: 'booking-confirmation',
        name: 'Booking Confirmation',
        nameAr: 'تأكيد الحجز',
        description: 'يُرسل عند قبول المعلم لطلب الحجز',
        category: 'booking',
        triggers: ['BOOKING_APPROVED'],
        variables: ['studentName', 'teacherName', 'subjectName', 'sessionDate', 'sessionTime', 'meetingLink', 'bookingId']
    },
    {
        id: 'session-reminder',
        name: 'Session Reminder',
        nameAr: 'تذكير بالحصة',
        description: 'يُرسل قبل الحصة بـ 24 ساعة وساعة واحدة',
        category: 'booking',
        triggers: ['SESSION_REMINDER_24H', 'SESSION_REMINDER_1H'],
        variables: ['studentName', 'teacherName', 'subjectName', 'sessionTime', 'meetingLink', 'hoursUntil']
    },
    {
        id: 'payment-receipt',
        name: 'Payment Receipt',
        nameAr: 'إيصال الدفع',
        description: 'يُرسل عند إتمام عملية شحن المحفظة',
        category: 'payment',
        triggers: ['PAYMENT_SUCCESS', 'WALLET_TOPUP'],
        variables: ['recipientName', 'transactionId', 'amount', 'type', 'description', 'currentBalance', 'date']
    },
    {
        id: 'password-reset',
        name: 'Password Reset',
        nameAr: 'إعادة تعيين كلمة المرور',
        description: 'يُرسل عند طلب إعادة تعيين كلمة المرور',
        category: 'account',
        triggers: ['FORGOT_PASSWORD'],
        variables: ['recipientName', 'resetLink', 'title', 'message', 'actionUrl', 'actionLabel']
    },
    {
        id: 'generic-notification',
        name: 'Generic Notification',
        nameAr: 'إشعار عام',
        description: 'قالب افتراضي للإشعارات العامة',
        category: 'system',
        triggers: ['SYSTEM_ALERT', 'ADMIN_ALERT', 'ACCOUNT_UPDATE'],
        variables: ['recipientName', 'title', 'message', 'actionUrl', 'actionLabel', 'notificationType']
    }
];

const NOTIFICATION_TYPES = [
    { type: 'BOOKING_REQUEST', label: 'طلب حجز جديد', icon: Calendar, category: 'booking' },
    { type: 'BOOKING_APPROVED', label: 'تأكيد الحجز', icon: CheckCircle, category: 'booking' },
    { type: 'BOOKING_REJECTED', label: 'رفض الحجز', icon: AlertTriangle, category: 'booking' },
    { type: 'BOOKING_CANCELLED', label: 'إلغاء الحجز', icon: AlertTriangle, category: 'booking' },
    { type: 'BOOKING_RESCHEDULED', label: 'إعادة جدولة', icon: Clock, category: 'booking' },
    { type: 'SESSION_REMINDER', label: 'تذكير بالحصة', icon: Bell, category: 'booking' },
    { type: 'PAYMENT_SUCCESS', label: 'نجاح الدفع', icon: CreditCard, category: 'payment' },
    { type: 'PAYMENT_RELEASED', label: 'تحويل للمعلم', icon: CreditCard, category: 'payment' },
    { type: 'DEPOSIT_APPROVED', label: 'إيداع معتمد', icon: CheckCircle, category: 'payment' },
    { type: 'DEPOSIT_REJECTED', label: 'إيداع مرفوض', icon: AlertTriangle, category: 'payment' },
    { type: 'ESCROW_REMINDER', label: 'تذكير الضمان', icon: Clock, category: 'payment' },
    { type: 'DISPUTE_RAISED', label: 'شكوى جديدة', icon: AlertTriangle, category: 'system' },
    { type: 'DISPUTE_UPDATE', label: 'تحديث الشكوى', icon: Bell, category: 'system' },
    { type: 'ACCOUNT_UPDATE', label: 'تحديث الحساب', icon: User, category: 'account' },
    { type: 'SYSTEM_ALERT', label: 'تنبيه النظام', icon: Bell, category: 'system' },
];

const categoryColors = {
    booking: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    payment: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    account: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    system: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
};

const categoryLabels = {
    booking: 'الحجوزات',
    payment: 'المدفوعات',
    account: 'الحساب',
    system: 'النظام'
};

export default function AdminNotificationsPage() {
    const [activeTab, setActiveTab] = useState<'templates' | 'types'>('templates');
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Mail className="w-6 h-6" />
                        قوالب الإشعارات
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">عرض قوالب البريد الإلكتروني وأنواع الإشعارات</p>
                </header>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`${activeTab === 'templates'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                        >
                            <Mail className="w-4 h-4" />
                            قوالب البريد الإلكتروني
                        </button>
                        <button
                            onClick={() => setActiveTab('types')}
                            className={`${activeTab === 'types'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                        >
                            <Bell className="w-4 h-4" />
                            أنواع الإشعارات
                        </button>
                    </nav>
                </div>

                {/* Content */}
                {activeTab === 'templates' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Templates List */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">القوالب المتاحة</h2>
                            {EMAIL_TEMPLATES.map(template => {
                                const colors = categoryColors[template.category];
                                return (
                                    <Card
                                        key={template.id}
                                        className={`cursor-pointer transition-all ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary-500' : 'hover:shadow-md'}`}
                                        onClick={() => setSelectedTemplate(template)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                                                            {categoryLabels[template.category]}
                                                        </span>
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                    <h3 className="font-bold text-gray-900">{template.nameAr}</h3>
                                                    <p className="text-sm text-gray-500 font-mono">{template.id}</p>
                                                    <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                                                </div>
                                                <Eye className="w-5 h-5 text-gray-400" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Template Details */}
                        <div>
                            {selectedTemplate ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Code className="w-5 h-5" />
                                            تفاصيل القالب
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">اسم القالب</label>
                                            <p className="font-bold text-lg">{selectedTemplate.nameAr}</p>
                                            <p className="text-sm text-gray-500 font-mono">{selectedTemplate.name}</p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500">الوصف</label>
                                            <p className="text-gray-700">{selectedTemplate.description}</p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 block mb-2">المحفزات (Triggers)</label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTemplate.triggers.map(trigger => (
                                                    <StatusBadge key={trigger} variant="info" showDot={false}>
                                                        {trigger}
                                                    </StatusBadge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 block mb-2">المتغيرات (Variables)</label>
                                            <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm">
                                                {selectedTemplate.variables.map((variable, idx) => (
                                                    <div key={variable} className="flex items-center gap-2 py-1">
                                                        <span className="text-primary-600">{`{{${variable}}}`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <p className="text-xs text-gray-500">
                                                القوالب مُعرَّفة في الكود المصدري ويتم تقديمها باستخدام React Email.
                                                لتعديل القوالب، يرجى تحديث الملفات في <code className="bg-gray-100 px-1 rounded">apps/api/src/emails/</code>
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="h-64 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>اختر قالباً لعرض التفاصيل</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'types' && (
                    <div className="space-y-6">
                        {/* Group by category */}
                        {(['booking', 'payment', 'account', 'system'] as const).map(category => {
                            const colors = categoryColors[category];
                            const categoryTypes = NOTIFICATION_TYPES.filter(t => t.category === category);

                            return (
                                <Card key={category}>
                                    <CardHeader>
                                        <CardTitle className={`flex items-center gap-2 ${colors.text}`}>
                                            {category === 'booking' && <Calendar className="w-5 h-5" />}
                                            {category === 'payment' && <CreditCard className="w-5 h-5" />}
                                            {category === 'account' && <User className="w-5 h-5" />}
                                            {category === 'system' && <Bell className="w-5 h-5" />}
                                            {categoryLabels[category]}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {categoryTypes.map(notif => {
                                                const Icon = notif.icon;
                                                return (
                                                    <div
                                                        key={notif.type}
                                                        className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Icon className={`w-4 h-4 ${colors.text}`} />
                                                            <span className={`font-medium ${colors.text}`}>{notif.label}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-mono mt-1">{notif.type}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
