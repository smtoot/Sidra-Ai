'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { teacherApi } from '@/lib/api/teacher';
import { Link as LinkIcon, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MeetingLinkSettingsProps {
    isReadOnly?: boolean;
}

export function MeetingLinkSettings({ isReadOnly = false }: MeetingLinkSettingsProps) {
    const [meetingLink, setMeetingLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const profile = await teacherApi.getProfile();
            if (profile.meetingLink) {
                setMeetingLink(profile.meetingLink);
            }
        } catch (err) {
            console.error('Failed to load profile', err);
        }
    };

    const MEETING_LINK_REGEX = /^https:\/\/(meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}|([a-z0-9]+\.)?zoom\.us\/(j|my)\/[a-zA-Z0-9]+|teams\.microsoft\.com\/l\/meetup-join\/.+)(\?.*)?$/i;

    const isValidMeetingLink = (url: string): boolean => {
        return MEETING_LINK_REGEX.test(url);
    };

    const getMeetingPlatform = (url: string): { name: string; color: string } | null => {
        if (url.includes('meet.google.com')) return { name: 'Google Meet', color: 'bg-green-100 text-green-700' };
        if (url.includes('zoom.us')) return { name: 'Zoom', color: 'bg-blue-100 text-blue-700' };
        if (url.includes('teams.microsoft.com')) return { name: 'Microsoft Teams', color: 'bg-purple-100 text-purple-700' };
        return null;
    };

    const handleSaveMeetingLink = async () => {
        if (!meetingLink) {
            setError('الرجاء إدخال رابط الاجتماع');
            return;
        }

        if (!isValidMeetingLink(meetingLink)) {
            setError('رابط الاجتماع غير صالح. يرجى استخدام رابط Google Meet أو Zoom أو Microsoft Teams صحيح.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await teacherApi.updateProfile({ meetingLink });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            toast.success('تم حفظ رابط الاجتماع');
        } catch (err: any) {
            console.error('Failed to save settings', err);
            const msg = err?.response?.data?.message?.[0] || 'فشل في حفظ الإعدادات';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const platform = meetingLink ? getMeetingPlatform(meetingLink) : null;

    return (
        <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-5 h-5 text-primary" />
                <h2 className="font-bold">رابط الاجتماع</h2>
            </div>
            <p className="text-sm text-text-subtle mb-4">
                أدخل رابط Zoom أو Google Meet أو Teams الخاص بك. سيتم مشاركته مع الطلاب عند تأكيد الحجز.
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
                        placeholder="https://meet.google.com/abc-defg-hij"
                        value={meetingLink}
                        onChange={(e) => {
                            setMeetingLink(e.target.value);
                            setError('');
                        }}
                        className="text-left font-mono text-sm"
                        dir="ltr"
                        disabled={isReadOnly}
                    />
                </div>
                <Button onClick={handleSaveMeetingLink} disabled={loading || isReadOnly} className="gap-2">
                    <Save className="w-4 h-4" />
                    حفظ
                </Button>
            </div>

            {meetingLink && (
                <div className="mt-3 flex items-center gap-2">
                    {isValidMeetingLink(meetingLink) ? (
                        <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className={`text-sm px-2 py-1 rounded ${platform?.color}`}>
                                ✓ {platform?.name}
                            </span>
                        </>
                    ) : (
                        <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            ⚠️ الرابط غير صالح - استخدم رابط Google Meet أو Zoom أو Teams
                        </span>
                    )}
                </div>
            )}

            <div className="mt-4 bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                <strong className="block mb-2">كيفية الحصول على الرابط:</strong>
                <ul className="space-y-1 list-disc list-inside">
                    <li><strong>Google Meet:</strong> افتح meet.google.com → "اجتماع جديد" → انسخ الرابط</li>
                    <li><strong>Zoom:</strong> افتح zoom.us → "اجتماعاتي" → انسخ رابط الاجتماع الشخصي</li>
                    <li><strong>Teams:</strong> افتح Teams → "اجتماع جديد" → انسخ رابط الانضمام</li>
                </ul>
            </div>
        </div>
    );
}
