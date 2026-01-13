'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Video, Save } from 'lucide-react';

export default function AdminVideoSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [jitsiConfig, setJitsiConfig] = useState<any>({});

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await adminApi.getSettings();
            setJitsiConfig(data.jitsiConfig || {});
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل الإعدادات');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Only update jitsiConfig, leaving other settings untouched
            await adminApi.updateSettings({
                jitsiConfig: jitsiConfig
            });
            toast.success('تم تحديث إعدادات الفيديو بنجاح');
            loadSettings(); // Reload to confirm
        } catch (error) {
            console.error(error);
            toast.error('فشل حفظ الإعدادات');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-subtle">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <div className="flex items-center gap-2 mb-2">
                        <Video className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold text-primary">إعدادات الفيديو (Jitsi)</h1>
                    </div>
                    <p className="text-text-subtle">التحكم في خصائص الاجتماع وأزرار التحكم للفصول الافتراضية.</p>
                </header>

                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm p-8">
                    <form onSubmit={handleSave} className="space-y-8">

                        {/* Feature Flags */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900">الميزات العامة</h3>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100">
                                <div>
                                    <span className="font-bold block text-gray-900">بدء الاجتماع بصوت مكتوم (للطلاب)</span>
                                    <span className="text-sm text-text-subtle">عند انضمام الطالب، يكون الميكروفون مغلقاً افتراضياً.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={jitsiConfig.startAudioMuted || false}
                                    onChange={(e) => setJitsiConfig({ ...jitsiConfig, startAudioMuted: e.target.checked })}
                                    className="w-5 h-5 accent-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100">
                                <div>
                                    <span className="font-bold block text-gray-900">بدء الاجتماع بفيديو مغلق</span>
                                    <span className="text-sm text-text-subtle">عند الانضمام، تكون الكاميرا مغلقة افتراضياً للجميع.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={jitsiConfig.startVideoMuted || false}
                                    onChange={(e) => setJitsiConfig({ ...jitsiConfig, startVideoMuted: e.target.checked })}
                                    className="w-5 h-5 accent-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100">
                                <div>
                                    <span className="font-bold block text-gray-900">تفعيل المحادثة (Chat)</span>
                                    <span className="text-sm text-text-subtle">السماح باستخدام صندوق المحادثة النصية أثناء الحصة.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={jitsiConfig.enableChat !== false} // Default to true
                                    onChange={(e) => setJitsiConfig({ ...jitsiConfig, enableChat: e.target.checked })}
                                    className="w-5 h-5 accent-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100">
                                <div>
                                    <span className="font-bold block text-gray-900">تفعيل مشاركة الشاشة</span>
                                    <span className="text-sm text-text-subtle">السماح للمعلم والطالب بمشاركة الشاشة.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={jitsiConfig.enableScreenSharing !== false} // Default to true
                                    onChange={(e) => setJitsiConfig({ ...jitsiConfig, enableScreenSharing: e.target.checked })}
                                    className="w-5 h-5 accent-primary"
                                />
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Advanced Config overrides */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900">إعدادات متقدمة (للمطورين)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Jitsi App ID Override</label>
                                    <Input
                                        value={jitsiConfig.appId || ''}
                                        onChange={(e) => setJitsiConfig({ ...jitsiConfig, appId: e.target.value })}
                                        placeholder="اتركه فارغاً لاستخدام الإعدادات الافتراضية"
                                        className="text-left ltr"
                                    />
                                    <p className="text-xs text-text-subtle">يستخدم فقط إذا كان لديك خادم Jitsi مخصص يتطلب App ID مختلف.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Jitsi Domain Override</label>
                                    <Input
                                        value={jitsiConfig.domain || ''}
                                        onChange={(e) => setJitsiConfig({ ...jitsiConfig, domain: e.target.value })}
                                        placeholder="meet.sidra.sd"
                                        className="text-left ltr"
                                    />
                                    <p className="text-xs text-text-subtle">رابط خادم Jitsi (بدون https://). اتركه فارغاً للافتراضي.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={saving} className="bg-primary text-white w-40">
                                {saving ? 'جاري الحفظ...' : (
                                    <>
                                        <Save className="w-4 h-4 ml-2" />
                                        حفظ التعديلات
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
