'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi, SlugInfo } from '@/lib/api/teacher';
import { AtSign, Lock, Copy, Check, Save, AlertTriangle, CheckCircle } from 'lucide-react';

interface SlugSettingsProps {
    isReadOnly?: boolean;
}

export function SlugSettings({ isReadOnly = false }: SlugSettingsProps) {
    const [slugInfo, setSlugInfo] = useState<SlugInfo | null>(null);
    const [slugInput, setSlugInput] = useState('');
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [slugError, setSlugError] = useState('');
    const [checkingSlug, setCheckingSlug] = useState(false);
    const [savingSlug, setSavingSlug] = useState(false);
    const [slugSuccess, setSlugSuccess] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [copied, setCopied] = useState(false);

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
                    sidra.sd/teachers/<span className="text-primary font-medium">{slugInput || 'your-name'}</span>
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
    );
}
