'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { teacherApi } from '@/lib/api/teacher';
import { Link as LinkIcon, Save, CheckCircle, Globe, Play, ToggleLeft, ToggleRight } from 'lucide-react';
import TimezoneSelector from '@/components/common/TimezoneSelector';
import { getUserTimezone } from '@/lib/utils/timezone';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AccountSettingsSectionProps {
    isReadOnly?: boolean;
}

export function AccountSettingsSection({ isReadOnly = false }: AccountSettingsSectionProps) {
    const [meetingLink, setMeetingLink] = useState('');
    const [timezone, setTimezone] = useState('UTC');
    const [demoEnabled, setDemoEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);

    useEffect(() => {
        loadProfile();
        loadDemoSettings();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const profile = await teacherApi.getProfile();
            if (profile.meetingLink) {
                setMeetingLink(profile.meetingLink);
            }
            if (!profile.timezone || profile.timezone === 'UTC') {
                const detectedTimezone = getUserTimezone();
                setTimezone(detectedTimezone);
            } else {
                setTimezone(profile.timezone);
            }
        } catch (err) {
            console.error('Failed to load profile', err);
            setTimezone(getUserTimezone());
        } finally {
            setLoading(false);
        }
    };

    const loadDemoSettings = async () => {
        try {
            const settings = await teacherApi.getDemoSettings();
            setDemoEnabled(settings?.demoEnabled ?? false);
        } catch (err) {
            console.error('Failed to load demo settings', err);
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
            toast.error('الرجاء إدخال رابط الاجتماع');
            return;
        }

        if (!isValidMeetingLink(meetingLink)) {
            toast.error('رابط الاجتماع غير صالح. يرجى استخدام رابط Google Meet أو Zoom أو Microsoft Teams صحيح.');
            return;
        }

        setLoading(true);
        try {
            await teacherApi.updateProfile({ meetingLink });
            toast.success('تم حفظ رابط الاجتماع');
        } catch (err: any) {
            console.error('Failed to save settings', err);
            toast.error(err?.response?.data?.message?.[0] || 'فشل في حفظ الإعدادات');
        } finally {
            setLoading(false);
        }
    };

    const handleTimezoneChange = async (newTimezone: string) => {
        setTimezone(newTimezone);
        try {
            await teacherApi.updateProfile({ timezone: newTimezone });
            toast.success('تم حفظ المنطقة الزمنية');
        } catch (err) {
            console.error('Failed to save timezone', err);
            toast.error('فشل في حفظ المنطقة الزمنية');
        }
    };

    const handleDemoToggle = async () => {
        if (isReadOnly) return;

        setDemoLoading(true);
        const newValue = !demoEnabled;
        try {
            await teacherApi.updateDemoSettings(newValue);
            setDemoEnabled(newValue);
            toast.success(newValue ? 'تم تفعيل الحصص التجريبية' : 'تم إيقاف الحصص التجريبية');
        } catch (err) {
            console.error('Failed to update demo settings', err);
            toast.error('فشل في تحديث إعدادات الحصص التجريبية');
        } finally {
            setDemoLoading(false);
        }
    };

    const platform = meetingLink ? getMeetingPlatform(meetingLink) : null;

    return (
        <div className="space-y-6">
            {/* Demo Session Toggle */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 space-y-4">
                <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-sm">الحصص التجريبية</h3>
                </div>

                <p className="text-xs text-gray-600">
                    اسمح للطلاب الجدد بحجز حصة تجريبية مجانية (30 دقيقة) معك لمرة واحدة
                </p>

                <button
                    onClick={handleDemoToggle}
                    disabled={isReadOnly || demoLoading}
                    className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-lg border transition-all",
                        demoEnabled
                            ? "bg-green-50 border-green-300 hover:bg-green-100"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100",
                        isReadOnly && "opacity-60 cursor-not-allowed"
                    )}
                >
                    {demoEnabled ? (
                        <ToggleRight className="w-8 h-8 text-green-600" />
                    ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                    <div className="flex-1 text-right">
                        <p className={cn(
                            "font-medium text-sm",
                            demoEnabled ? "text-green-700" : "text-gray-600"
                        )}>
                            {demoEnabled ? 'الحصص التجريبية مفعّلة' : 'الحصص التجريبية معطّلة'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {demoEnabled
                                ? 'الطلاب يمكنهم حجز حصة تجريبية مجانية معك'
                                : 'لن يتمكن الطلاب من حجز حصص تجريبية'}
                        </p>
                    </div>
                </button>
            </div>

            {/* Meeting Link Section */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
                <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">رابط الاجتماع</h3>
                </div>

                <p className="text-xs text-gray-500">
                    رابط غرفة الاجتماع الافتراضي الخاص بك (Google Meet، Zoom، Teams)
                </p>

                <div className="space-y-2">
                    <Label className="text-sm">الرابط</Label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                type="url"
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                disabled={isReadOnly || loading}
                                dir="ltr"
                                className={cn(
                                    "text-left",
                                    meetingLink && !isValidMeetingLink(meetingLink) && "border-red-300 focus:border-red-500"
                                )}
                            />
                        </div>
                        {!isReadOnly && (
                            <Button
                                onClick={handleSaveMeetingLink}
                                disabled={loading || !meetingLink}
                                className="gap-2"
                            >
                                <Save className="w-4 h-4" />
                                حفظ
                            </Button>
                        )}
                    </div>

                    {platform && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded ${platform.color}`}>
                                {platform.name}
                            </span>
                            {isValidMeetingLink(meetingLink) && (
                                <span className="text-[10px] text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    رابط صالح
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Timezone Section */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">المنطقة الزمنية</h3>
                </div>

                <p className="text-xs text-gray-500">
                    سيتم عرض مواعيدك للطلاب بناءً على هذه المنطقة الزمنية
                </p>

                {!isReadOnly && (
                    <TimezoneSelector
                        value={timezone}
                        onChange={handleTimezoneChange}
                    />
                )}
                {isReadOnly && (
                    <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border">
                        {timezone}
                    </p>
                )}
            </div>
        </div>
    );
}
