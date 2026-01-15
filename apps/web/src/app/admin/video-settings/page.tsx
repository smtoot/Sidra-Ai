'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Video, Save, Check } from 'lucide-react';

const TOOLBAR_BUTTONS = [
    { id: 'microphone', label: 'الميكروفون' },
    { id: 'camera', label: 'الكاميرا' },
    { id: 'desktop', label: 'مشاركة الشاشة' },
    { id: 'chat', label: 'المحادثة' },
    { id: 'raisehand', label: 'رفع اليد' },
    { id: 'participants-pane', label: 'قائمة المشاركين' },
    { id: 'tileview', label: 'عرض الشبكة' },
    { id: 'fullscreen', label: 'ملء الشاشة' },
    { id: 'recording', label: 'التسجيل' },
    { id: 'livestreaming', label: 'البث المباشر' },
    { id: 'closedcaptions', label: 'الترجمة' },
    { id: 'sharedvideo', label: 'مشاركة فيديو' },
    { id: 'etherpad', label: 'المستند المشترك' },
    { id: 'virtual-background', label: 'الخلفية الافتراضية' },
    { id: 'videoquality', label: 'جودة الفيديو' },
    { id: 'filmstrip', label: 'شريط الفيديو' },
    { id: 'shortcuts', label: 'الاختصارات' },
    { id: 'help', label: 'المساعدة' },
    { id: 'mute-everyone', label: 'كتم الكل' },
    { id: 'security', label: 'خيارات الأمان' },
];

export default function AdminVideoSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [jitsiConfig, setJitsiConfig] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');

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

    const toggleToolbarButton = (role: 'teacher' | 'student', buttonId: string) => {
        const key = role === 'teacher' ? 'teacherToolbarButtons' : 'studentToolbarButtons';
        const currentButtons = jitsiConfig[key] || [];

        let newButtons;
        if (currentButtons.includes(buttonId)) {
            newButtons = currentButtons.filter((id: string) => id !== buttonId);
        } else {
            newButtons = [...currentButtons, buttonId];
        }

        setJitsiConfig({ ...jitsiConfig, [key]: newButtons });
    };

    const isButtonEnabled = (role: 'teacher' | 'student', buttonId: string) => {
        const key = role === 'teacher' ? 'teacherToolbarButtons' : 'studentToolbarButtons';
        const currentButtons = jitsiConfig[key];
        // If undefined (no override), we can't easily know the backend default here without duplicating logic.
        // Strategy: If undefined, assume NOT CHECKED (since this is an override), but show a warning that defaults are used.
        // OR: Better, when loading, populate with defaults if empty?
        // For now, let's treat undefined as empty array in the UI, but show a warning message.
        if (!currentButtons) return false;
        return currentButtons.includes(buttonId);
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

                            {/* Global Jitsi Enable Toggle - Most Important */}
                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border-2 border-primary/30">
                                <div>
                                    <span className="font-bold block text-gray-900">تفعيل اجتماعات Jitsi</span>
                                    <span className="text-sm text-text-subtle">عند التفعيل، ستستخدم جميع الحصص نظام Jitsi المدمج. عند الإيقاف، سيظهر رابط الاجتماع الخارجي فقط.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={jitsiConfig.enabled !== false} // Default to true if undefined
                                    onChange={(e) => setJitsiConfig({ ...jitsiConfig, enabled: e.target.checked })}
                                    className="w-6 h-6 accent-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100">
                                <div>
                                    <span className="font-bold block text-gray-900">تفعيل التسجيل (Recording)</span>
                                    <span className="text-sm text-text-subtle">السماح بتسجيل الحصص.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={jitsiConfig.enableRecording !== false} // Default to true if undefined
                                    onChange={(e) => setJitsiConfig({ ...jitsiConfig, enableRecording: e.target.checked })}
                                    className="w-5 h-5 accent-primary"
                                />
                            </div>

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
                                    checked={jitsiConfig.enableChat !== false}
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
                                    checked={jitsiConfig.enableScreenSharing !== false}
                                    onChange={(e) => setJitsiConfig({ ...jitsiConfig, enableScreenSharing: e.target.checked })}
                                    className="w-5 h-5 accent-primary"
                                />
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Toolbar Configuration */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">تخصيص شريط الأدوات</h3>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('teacher')}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'teacher' ? 'bg-white shadow text-primary' : 'text-text-subtle hover:text-gray-900'}`}
                                    >
                                        أدوات المعلم
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('student')}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'student' ? 'bg-white shadow text-primary' : 'text-text-subtle hover:text-gray-900'}`}
                                    >
                                        أدوات الطالب
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-text-subtle">اختر الأزرار التي ستظهر في شريط التحكم لكل فئة. إذا لم يتم تحديد أي زر، سيتم استخدام الإعدادات الافتراضية للنظام.</p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {TOOLBAR_BUTTONS.map((btn) => {
                                    const isEnabled = isButtonEnabled(activeTab, btn.id);
                                    return (
                                        <button
                                            key={btn.id}
                                            type="button"
                                            onClick={() => toggleToolbarButton(activeTab, btn.id)}
                                            className={`flex items-center justify-between p-3 rounded border text-sm transition-all ${isEnabled
                                                ? 'border-primary/50 bg-primary/5 text-primary font-medium'
                                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span>{btn.label}</span>
                                            {isEnabled && <Check className="w-4 h-4" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {!jitsiConfig[activeTab === 'teacher' ? 'teacherToolbarButtons' : 'studentToolbarButtons'] && (
                                <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200 flex gap-2">
                                    <span>⚠️</span>
                                    <span>لم يتم تحديد أزرار خاصة لهذا الدور بعد. حالياً يتم استخدام القائمة الافتراضية الكاملة. انقر على الأزرار أعلاه لتخصيص القائمة.</span>
                                </div>
                            )}
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
