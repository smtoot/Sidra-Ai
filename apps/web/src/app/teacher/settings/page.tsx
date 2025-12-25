'use client';
import { cn } from '@/lib/utils';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { teacherApi, SlugInfo } from '@/lib/api/teacher';
import { TeacherDocumentUpload } from '@/components/teacher/TeacherDocumentUpload';
import { Settings, Link as LinkIcon, Save, CheckCircle, Globe, FileText, Lock, AtSign, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';
import TimezoneSelector from '@/components/common/TimezoneSelector';
import { getUserTimezone } from '@/lib/utils/timezone';
import { useTeacherApplicationStatus } from '@/hooks/useTeacherApplicationStatus';


export default function TeacherSettingsPage() {
    const [meetingLink, setMeetingLink] = useState('');
    const [timezone, setTimezone] = useState('UTC');
    const [loading, setLoading] = useState(false);
    const [savingTimezone, setSavingTimezone] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [timezoneSuccess, setTimezoneSuccess] = useState(false);

    // Slug state
    const [slugInfo, setSlugInfo] = useState<SlugInfo | null>(null);
    const [slugInput, setSlugInput] = useState('');
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [slugError, setSlugError] = useState('');
    const [checkingSlug, setCheckingSlug] = useState(false);
    const [savingSlug, setSavingSlug] = useState(false);
    const [slugSuccess, setSlugSuccess] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [copied, setCopied] = useState(false);

    const { status: appStatus, isApproved, isChangesRequested, loading: loadingStatus } = useTeacherApplicationStatus();
    const isReadOnly = !loadingStatus && !isApproved;

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const profile = await teacherApi.getProfile();
            if (profile.meetingLink) {
                setMeetingLink(profile.meetingLink);
            }
            // Auto-detect timezone if not set or if default
            if (!profile.timezone || profile.timezone === 'UTC') {
                const detectedTimezone = getUserTimezone();
                setTimezone(detectedTimezone);
            } else {
                setTimezone(profile.timezone);
            }
        } catch (err) {
            console.error('Failed to load profile', err);
            // Auto-detect on error
            setTimezone(getUserTimezone());
        } finally {
            setLoading(false);
        }
    };

    // Exact same regex as backend for consistency
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
        } catch (err: any) {
            console.error('Failed to save settings', err);
            // Show backend error if available
            setError(err?.response?.data?.message?.[0] || 'فشل في حفظ الإعدادات');
        } finally {
            setLoading(false);
        }
    };

    const handleTimezoneChange = async (newTimezone: string) => {
        setTimezone(newTimezone);
        setSavingTimezone(true);
        try {
            await teacherApi.updateProfile({ timezone: newTimezone });
            setTimezoneSuccess(true);
            setTimeout(() => setTimezoneSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to save timezone', err);
        } finally {
            setSavingTimezone(false);
        }
    };

    // Load slug info on mount
    useEffect(() => {
        loadSlugInfo();
    }, []);

    const loadSlugInfo = async () => {
        try {
            const info = await teacherApi.getSlugInfo();
            setSlugInfo(info);
            setSlugInput(info.slug || info.suggestedSlug || '');
        } catch (err) {
            console.error('Failed to load slug info', err);
        }
    };

    // Debounced slug availability check
    useEffect(() => {
        if (!slugInput || slugInput === slugInfo?.slug) {
            setSlugAvailable(null);
            setSlugError('');
            return;
        }

        const timer = setTimeout(async () => {
            setCheckingSlug(true);
            setSlugError('');
            try {
                const result = await teacherApi.checkSlugAvailability(slugInput);
                setSlugAvailable(result.available);
                if (!result.available && result.error) {
                    setSlugError(result.error);
                }
            } catch (err: any) {
                setSlugError(err?.response?.data?.message || 'حدث خطأ');
                setSlugAvailable(false);
            } finally {
                setCheckingSlug(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [slugInput, slugInfo?.slug]);

    const handleSlugSave = async () => {
        if (!slugInput || slugAvailable === false) return;

        setSavingSlug(true);
        try {
            const result = await teacherApi.updateSlug(slugInput);
            setSlugInfo(prev => prev ? { ...prev, slug: result.slug } : null);
            setSlugSuccess(true);
            setTimeout(() => setSlugSuccess(false), 3000);
        } catch (err: any) {
            setSlugError(err?.response?.data?.message || 'فشل في الحفظ');
        } finally {
            setSavingSlug(false);
        }
    };

    const handleSlugConfirm = async () => {
        if (!slugInput) return;

        setSavingSlug(true);
        try {
            const result = await teacherApi.confirmSlug(slugInput);
            setSlugInfo(prev => prev ? {
                ...prev,
                slug: result.slug,
                isLocked: result.locked,
                slugLockedAt: result.locked ? new Date().toISOString() : null
            } : null);
            setShowConfirmDialog(false);
            setSlugSuccess(true);
            setTimeout(() => setSlugSuccess(false), 3000);
        } catch (err: any) {
            setSlugError(err?.response?.data?.message || 'فشل في التأكيد');
        } finally {
            setSavingSlug(false);
        }
    };

    const copyProfileUrl = () => {
        const url = `${window.location.origin}/teachers/${slugInfo?.slug || slugInput}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

            {/* Read Only Banner */}
            {isReadOnly && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                    <Lock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-yellow-800">الإعدادات للقراءة فقط</h3>
                        <p className="text-sm text-yellow-700">
                            لا يمكنك تعديل الإعدادات حتى تتم الموافقة على طلبك.
                        </p>
                    </div>
                </div>
            )}

            {/* Meeting Link Section */}
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
                                setError(''); // Clear error on change
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

                {/* Platform Detection Badge */}
                {meetingLink && (
                    <div className="mt-3 flex items-center gap-2">
                        {isValidMeetingLink(meetingLink) ? (
                            <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className={`text-sm px-2 py-1 rounded ${getMeetingPlatform(meetingLink)?.color}`}>
                                    ✓ {getMeetingPlatform(meetingLink)?.name}
                                </span>
                            </>
                        ) : (
                            <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                ⚠️ الرابط غير صالح - استخدم رابط Google Meet أو Zoom أو Teams
                            </span>
                        )}
                    </div>
                )}

                {/* Help Box */}
                <div className="mt-4 bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    <strong className="block mb-2">كيفية الحصول على الرابط:</strong>
                    <ul className="space-y-1 list-disc list-inside">
                        <li><strong>Google Meet:</strong> افتح meet.google.com → "اجتماع جديد" → انسخ الرابط</li>
                        <li><strong>Zoom:</strong> افتح zoom.us → "اجتماعاتي" → انسخ رابط الاجتماع الشخصي</li>
                        <li><strong>Teams:</strong> افتح Teams → "اجتماع جديد" → انسخ رابط الانضمام</li>
                    </ul>
                </div>
            </div>

            {/* Timezone Section */}
            <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        <h2 className="font-bold">المنطقة الزمنية</h2>
                    </div>
                    {savingTimezone && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            جاري الحفظ...
                        </span>
                    )}
                    {timezoneSuccess && !savingTimezone && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            تم الحفظ
                        </span>
                    )}
                </div>
                <p className="text-sm text-text-subtle mb-4">
                    حدد منطقتك الزمنية لضمان عرض مواعيد الحصص بشكل صحيح للطلاب
                </p>

                <TimezoneSelector
                    value={timezone}
                    onChange={handleTimezoneChange}
                    label=""
                    disabled={isReadOnly}
                />

                <div className="mt-4 text-xs text-text-subtle">
                    <p>ℹ️ سيتم استخدام هذه المنطقة الزمنية لعرض مواعيد توفرك للطلاب</p>
                </div>
            </div>

            {/* Profile URL Slug Section */}
            <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <AtSign className="w-5 h-5 text-primary" />
                        <h2 className="font-bold">رابط الملف الشخصي</h2>
                    </div>
                    {slugInfo?.isLocked && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            مؤكد
                        </span>
                    )}
                </div>
                <p className="text-sm text-text-subtle mb-4">
                    اختر رابطاً مميزاً لملفك الشخصي يسهل على الطلاب الوصول إليك
                </p>

                {slugError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                        {slugError}
                    </div>
                )}

                {slugSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        تم الحفظ بنجاح
                    </div>
                )}

                {/* URL Preview */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center justify-between" dir="ltr">
                    <span className="text-sm text-gray-500 font-mono truncate">
                        sidra.com/teachers/<span className="text-primary font-medium">{slugInput || 'your-name'}</span>
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyProfileUrl}
                        disabled={!slugInfo?.slug}
                        className="gap-1"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'تم النسخ' : 'نسخ'}
                    </Button>
                </div>

                {slugInfo?.isLocked ? (
                    // Locked state - show current slug
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-green-800">تم تأكيد الرابط</h3>
                                <p className="text-sm text-green-700 mt-1">
                                    الرابط الخاص بك هو: <strong>{slugInfo.slug}</strong>
                                </p>
                                <p className="text-xs text-green-600 mt-2">
                                    لا يمكن تغيير الرابط بعد التأكيد للحفاظ على استقرار الروابط
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Editable state
                    <>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Input
                                    type="text"
                                    placeholder="your-name"
                                    value={slugInput}
                                    onChange={(e) => {
                                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                        setSlugInput(value);
                                        setSlugError('');
                                    }}
                                    className="text-left font-mono text-sm"
                                    dir="ltr"
                                    disabled={isReadOnly || savingSlug}
                                />
                                {checkingSlug && (
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                                {!checkingSlug && slugAvailable === true && (
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    </div>
                                )}
                                {!checkingSlug && slugAvailable === false && (
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                    </div>
                                )}
                            </div>
                            <Button
                                onClick={handleSlugSave}
                                disabled={isReadOnly || savingSlug || !slugInput || slugAvailable === false || slugInput === slugInfo?.slug}
                                variant="outline"
                                className="gap-2"
                            >
                                <Save className="w-4 h-4" />
                                حفظ
                            </Button>
                        </div>

                        {/* Confirmation Section */}
                        {slugInfo?.slug && !slugInfo?.isLocked && (
                            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-yellow-800">تأكيد الرابط نهائياً</h3>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            بعد التأكيد، لن تتمكن من تغيير الرابط لاحقاً. تأكد من اختيار الرابط المناسب.
                                        </p>
                                        <div className="mt-3">
                                            {!showConfirmDialog ? (
                                                <Button
                                                    onClick={() => setShowConfirmDialog(true)}
                                                    variant="outline"
                                                    className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
                                                >
                                                    تأكيد الرابط نهائياً
                                                </Button>
                                            ) : (
                                                <div className="bg-white border border-yellow-300 rounded-lg p-4">
                                                    <p className="text-sm text-gray-700 mb-3">
                                                        هل أنت متأكد من تأكيد الرابط <strong dir="ltr">{slugInfo.slug}</strong>؟
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={handleSlugConfirm}
                                                            disabled={savingSlug}
                                                            className="bg-primary"
                                                        >
                                                            {savingSlug ? 'جاري التأكيد...' : 'نعم، تأكيد'}
                                                        </Button>
                                                        <Button
                                                            onClick={() => setShowConfirmDialog(false)}
                                                            variant="outline"
                                                        >
                                                            إلغاء
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Help text */}
                        <div className="mt-4 text-xs text-text-subtle space-y-1">
                            <p>• استخدم أحرف إنجليزية صغيرة وأرقام وشرطات فقط</p>
                            <p>• الطول: 3-50 حرفاً</p>
                            <p>• مثال: mohamed-ali, teacher-ahmed</p>
                        </div>
                    </>
                )}
            </div>

            {/* Documents Section */}
            <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="font-bold">المستندات للتحقق</h2>
                </div>
                <p className="text-sm text-text-subtle mb-4">
                    قم برفع شهاداتك ومستنداتك الرسمية للتحقق من حسابك وزيادة ثقة الطلاب
                </p>
                <TeacherDocumentUpload disabled={isReadOnly} />
            </div>

            {/* Cancellation Policy Section */}
            <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                <h2 className="font-bold mb-4">سياسة الإلغاء</h2>
                <p className="text-sm text-text-subtle mb-4">
                    اختر السياسة التي تناسبك للإلغاء من قبل الطلاب
                </p>

                <div className="space-y-3">
                    <label className={cn(
                        "flex items-start gap-3 p-4 border rounded-lg transition-colors",
                        isReadOnly ? "cursor-not-allowed opacity-70 bg-gray-50" : "cursor-pointer hover:bg-gray-50"
                    )}>
                        <input type="radio" name="policy" value="FLEXIBLE" className="mt-1 accent-primary" defaultChecked disabled={isReadOnly} />
                        <div>
                            <p className="font-bold">مرنة</p>
                            <p className="text-sm text-text-subtle">إلغاء مجاني حتى 24 ساعة قبل الحصة</p>
                        </div>
                    </label>
                    <label className={cn(
                        "flex items-start gap-3 p-4 border rounded-lg transition-colors",
                        isReadOnly ? "cursor-not-allowed opacity-70 bg-gray-50" : "cursor-pointer hover:bg-gray-50"
                    )}>
                        <input type="radio" name="policy" value="MODERATE" className="mt-1 accent-primary" disabled={isReadOnly} />
                        <div>
                            <p className="font-bold">معتدلة</p>
                            <p className="text-sm text-text-subtle">إلغاء مجاني حتى 48 ساعة، بعدها 50% رسوم</p>
                        </div>
                    </label>
                    <label className={cn(
                        "flex items-start gap-3 p-4 border rounded-lg transition-colors",
                        isReadOnly ? "cursor-not-allowed opacity-70 bg-gray-50" : "cursor-pointer hover:bg-gray-50"
                    )}>
                        <input type="radio" name="policy" value="STRICT" className="mt-1 accent-primary" disabled={isReadOnly} />
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
