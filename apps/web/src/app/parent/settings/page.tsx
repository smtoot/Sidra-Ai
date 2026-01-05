'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Lock, Eye, EyeOff, Loader2, CheckCircle, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';

export default function ParentSettingsPage() {
    // Notifications state (UI only for now)
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <header>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="w-7 h-7 text-primary-600" />
                        الإعدادات ⚙️
                    </h1>
                    <p className="text-gray-600 mt-1">إعدادات حسابك وتفضيلاتك</p>
                </header>

                {/* Change Password Section */}
                <ChangePasswordForm />

                {/* Notification Preferences */}
                <Card className="border-r-4 border-r-success-600">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-success-600" />
                            تفضيلات الإشعارات
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">إشعارات البريد الإلكتروني</p>
                                <p className="text-sm text-gray-500">استلام تنبيهات عبر البريد الإلكتروني</p>
                            </div>
                            <button
                                onClick={() => setEmailNotifications(!emailNotifications)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${emailNotifications ? 'bg-primary-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${emailNotifications ? 'translate-x-6' : ''
                                    }`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">إشعارات الرسائل النصية</p>
                                <p className="text-sm text-gray-500">استلام تنبيهات عبر SMS</p>
                            </div>
                            <button
                                onClick={() => setSmsNotifications(!smsNotifications)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${smsNotifications ? 'bg-primary-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${smsNotifications ? 'translate-x-6' : ''
                                    }`} />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                            🚧 تفضيلات الإشعارات قيد التطوير - سيتم حفظها قريباً
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
