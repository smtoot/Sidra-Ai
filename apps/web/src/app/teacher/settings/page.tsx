'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { teacherApi } from '@/lib/api/teacher';
import { Settings, Link as LinkIcon, Save, CheckCircle } from 'lucide-react';

export default function TeacherSettingsPage() {
    const [meetingLink, setMeetingLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const profile = await teacherApi.getProfile();
            // Note: meeting link is encrypted, we can't show it
            // For now, just show empty or a placeholder
        } catch (err) {
            console.error('Failed to load profile', err);
        } finally {
            setLoading(false);
        }
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return url.includes('zoom') || url.includes('meet.google') || url.includes('teams');
        } catch {
            return false;
        }
    };

    const handleSaveMeetingLink = async () => {
        if (!meetingLink) {
            setError('الرجاء إدخال رابط الاجتماع');
            return;
        }

        if (!isValidUrl(meetingLink)) {
            setError('الرجاء إدخال رابط صالح (Zoom, Google Meet, أو Teams)');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await teacherApi.updateProfile({
                meetingLink
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to save meeting link', err);
            setError('فشل في حفظ الرابط');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 font-tajawal" dir="rtl">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Settings className="w-6 h-6" />
                    الإعدادات
                </h1>
                <p className="text-text-subtle mt-1">إعدادات حسابك كمعلم</p>
            </header>

            {/* Meeting Link Section */}
            <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <LinkIcon className="w-5 h-5 text-primary" />
                    <h2 className="font-bold">رابط الاجتماع</h2>
                </div>
                <p className="text-sm text-text-subtle mb-4">
                    أدخل رابط Zoom أو Google Meet الخاص بك. سيتم مشاركته مع الطلاب عند تأكيد الحجز.
                </p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        تم الحفظ بنجاح
                    </div>
                )}

                <div className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            type="url"
                            placeholder="https://zoom.us/j/xxx أو https://meet.google.com/xxx"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            className="text-left"
                            dir="ltr"
                        />
                    </div>
                    <Button onClick={handleSaveMeetingLink} disabled={loading} className="gap-2">
                        <Save className="w-4 h-4" />
                        حفظ
                    </Button>
                </div>

                <div className="mt-4 text-xs text-text-subtle">
                    <p>💡 نصيحة: استخدم رابط اجتماع متكرر (Personal Meeting Room) لسهولة الإدارة</p>
                </div>
            </div>

            {/* Cancellation Policy Section */}
            <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                <h2 className="font-bold mb-4">سياسة الإلغاء</h2>
                <p className="text-sm text-text-subtle mb-4">
                    اختر السياسة التي تناسبك للإلغاء من قبل الطلاب
                </p>

                <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" name="policy" value="FLEXIBLE" className="mt-1 accent-primary" defaultChecked />
                        <div>
                            <p className="font-bold">مرنة</p>
                            <p className="text-sm text-text-subtle">إلغاء مجاني حتى 24 ساعة قبل الحصة</p>
                        </div>
                    </label>
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" name="policy" value="MODERATE" className="mt-1 accent-primary" />
                        <div>
                            <p className="font-bold">معتدلة</p>
                            <p className="text-sm text-text-subtle">إلغاء مجاني حتى 48 ساعة، بعدها 50% رسوم</p>
                        </div>
                    </label>
                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" name="policy" value="STRICT" className="mt-1 accent-primary" />
                        <div>
                            <p className="font-bold">صارمة</p>
                            <p className="text-sm text-text-subtle">إلغاء مجاني حتى 7 أيام، بعدها لا استرداد</p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Bank Info Section - Coming Soon */}
            <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 opacity-60">
                <h2 className="font-bold mb-2">معلومات البنك</h2>
                <p className="text-sm text-text-subtle">
                    🚧 قريباً - ستتمكن من إضافة معلوماتك البنكية لاستلام الأرباح
                </p>
            </div>
        </div>
    );
}
