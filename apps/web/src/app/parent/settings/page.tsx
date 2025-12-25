'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Lock, Eye, EyeOff, Loader2, CheckCircle, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function ParentSettingsPage() {
    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Notifications state (UI only for now)
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(true);

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword) {
            toast.error('يرجى إدخال كلمة المرور الحالية');
            return;
        }
        if (!newPassword) {
            toast.error('يرجى إدخال كلمة المرور الجديدة');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('كلمة المرور الجديدة غير متطابقة');
            return;
        }

        setChangingPassword(true);
        try {
            await authApi.changePassword(currentPassword, newPassword);
            toast.success('تم تغيير كلمة المرور بنجاح ✓');
            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            const message = error?.response?.data?.message || 'فشل تغيير كلمة المرور';
            toast.error(message);
        } finally {
            setChangingPassword(false);
        }
    };

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
                <Card className="border-r-4 border-r-primary-600">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary-600" />
                            تغيير كلمة المرور
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                كلمة المرور الحالية
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pl-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                كلمة المرور الجديدة
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pl-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">يجب أن تكون 6 أحرف على الأقل</p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                تأكيد كلمة المرور الجديدة
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="••••••••"
                            />
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">كلمات المرور غير متطابقة</p>
                            )}
                            {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    كلمات المرور متطابقة
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleChangePassword}
                            disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                            className="w-full md:w-auto"
                        >
                            {changingPassword ? (
                                <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    جاري التغيير...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4 ml-2" />
                                    تغيير كلمة المرور
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

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
