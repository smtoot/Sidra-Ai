'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Settings, Save } from 'lucide-react';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>({
        defaultCommissionRate: '0.18',
        confirmationWindowHours: 48,
        paymentWindowHours: 24,
        minHoursBeforeSession: 2,
        packagesEnabled: true,
        demosEnabled: true,
        maxPricePerHour: '50000',
        defaultSessionDurationMinutes: 60,
        searchConfig: { enableGenderFilter: true, enablePriceFilter: true }
    });

    // Form state (separate from data to handle dirty state/validation)
    const [feePercent, setFeePercent] = useState('18');
    const [releaseHours, setReleaseHours] = useState('48');
    const [paymentWindowHours, setPaymentWindowHours] = useState('24');
    const [minHoursBeforeSession, setMinHoursBeforeSession] = useState('2');
    const [maxPricePerHour, setMaxPricePerHour] = useState('50000');
    const [sessionDuration, setSessionDuration] = useState('60');
    const [meetingLinkAccessMinutes, setMeetingLinkAccessMinutes] = useState('15');

    const [maxVacationDays, setMaxVacationDays] = useState('21');
    const [cancellationForm, setCancellationForm] = useState({
        flexible: { cutoffHours: 12 },
        moderate: { cutoffHours: 24 },
        strict: { cutoffHours: 48 }
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await adminApi.getSettings();
            setSettings(data);
            setFeePercent((Number(data.defaultCommissionRate) * 100).toString());
            setReleaseHours(data.confirmationWindowHours.toString());
            setPaymentWindowHours((data.paymentWindowHours || 24).toString());
            setMinHoursBeforeSession((data.minHoursBeforeSession || 2).toString());
            setMaxPricePerHour((data.maxPricePerHour || 50000).toString());
            setSessionDuration((data.defaultSessionDurationMinutes || 60).toString());
            setMeetingLinkAccessMinutes((data.meetingLinkAccessMinutesBefore || 15).toString());

            setMaxVacationDays((data.maxVacationDays || 21).toString());
            if (data.cancellationPolicies) {
                const policies = data.cancellationPolicies;
                setCancellationForm({
                    flexible: { cutoffHours: policies.flexible?.cutoffHours ?? policies.flexible?.fullRefundHours ?? 12 },
                    moderate: { cutoffHours: policies.moderate?.cutoffHours ?? policies.moderate?.fullRefundHours ?? 24 },
                    strict: { cutoffHours: policies.strict?.cutoffHours ?? policies.strict?.fullRefundHours ?? 48 },
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل الإعدادات');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const fee = Number(feePercent);
        const hours = Number(releaseHours);
        const paymentWindow = Number(paymentWindowHours);
        const minBuffer = Number(minHoursBeforeSession);
        const maxPrice = Number(maxPricePerHour);
        const duration = Number(sessionDuration);
        const linkAccessMinutes = Number(meetingLinkAccessMinutes);
        const vacationDays = Number(maxVacationDays);

        if (isNaN(fee) || fee < 0 || fee > 100) {
            toast.error('نسبة العمولة يجب أن تكون بين 0 و 100');
            return;
        }

        if (isNaN(hours) || hours < 1) {
            toast.error('مدة التعليق يجب أن تكون ساعة واحدة على الأقل');
            return;
        }

        if (isNaN(paymentWindow) || paymentWindow < 1) {
            toast.error('نافذة الدفع يجب أن تكون ساعة واحدة على الأقل');
            return;
        }

        if (isNaN(minBuffer) || minBuffer < 1) {
            toast.error('الحد الأدنى قبل الحصة يجب أن تكون ساعة واحدة على الأقل');
            return;
        }

        if (isNaN(maxPrice) || maxPrice < 100) {
            toast.error('الحد الأقصى للسعر يجب أن يكون 100 جنيه على الأقل');
            return;
        }

        if (isNaN(duration) || duration < 15 || duration > 240) {
            toast.error('مدة الحصة يجب أن تكون بين 15 و 240 دقيقة');
            return;
        }

        if (isNaN(linkAccessMinutes) || linkAccessMinutes < 5 || linkAccessMinutes > 60) {
            toast.error('وقت الوصول لرابط الاجتماع يجب أن يكون بين 5 و 60 دقيقة');
            return;
        }

        if (isNaN(vacationDays) || vacationDays < 1 || vacationDays > 90) {
            toast.error('الحد الأقصى لمدة الإجازة يجب أن يكون بين 1 و 90 يوم');
            return;
        }

        setSaving(true);
        try {
            await adminApi.updateSettings({
                platformFeePercent: fee,
                autoReleaseHours: hours,
                paymentWindowHours: paymentWindow,
                minHoursBeforeSession: minBuffer,
                packagesEnabled: settings.packagesEnabled,
                demosEnabled: settings.demosEnabled,
                maxPricePerHour: maxPrice,
                defaultSessionDurationMinutes: duration,
                meetingLinkAccessMinutesBefore: linkAccessMinutes,
                maxVacationDays: vacationDays,

                cancellationPolicies: cancellationForm
            });
            toast.success('تم تحديث الإعدادات بنجاح');
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
                        <Settings className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold text-primary">إعدادات النظام</h1>
                    </div>
                    <p className="text-text-subtle">التحكم في المتغيرات الأساسية للمنصة</p>
                </header>

                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm p-8">
                    <form onSubmit={handleSave} className="space-y-8">

                        {/* Platform Fee */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">عمولة المنصة</h3>
                                    <p className="text-sm text-text-subtle mt-1">
                                        النسبة المئوية التي تقتطعها المنصة من كل حصة مكتملة.
                                    </p>
                                </div>
                                <div className="bg-gray-50 px-3 py-1 rounded text-sm font-mono">
                                    الحالية: {Number(settings.defaultCommissionRate) * 100}%
                                </div>
                            </div>
                            <div className="relative w-full md:w-1/3">
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={feePercent}
                                    onChange={(e) => setFeePercent(e.target.value)}
                                    className="pl-8"
                                />
                                <span className="absolute left-3 top-2 text-gray-400 font-bold">%</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Escrow Timer */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">نافذة التأكيد التلقائي</h3>
                                    <p className="text-sm text-text-subtle mt-1">
                                        المدة الزمنية (بالساعات) التي يتم بعدها تحويل المبلغ للمعلم تلقائياً إذا لم يقم الطالب بالتأكيد أو رفع نزاع.
                                    </p>
                                </div>
                                <div className="bg-gray-50 px-3 py-1 rounded text-sm font-mono">
                                    الحالية: {settings.confirmationWindowHours} ساعة
                                </div>
                            </div>
                            <div className="relative w-full md:w-1/3">
                                <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={releaseHours}
                                    onChange={(e) => setReleaseHours(e.target.value)}
                                    className="pl-16"
                                />
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">ساعة</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Payment Window */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">نافذة الدفع</h3>
                                    <p className="text-sm text-text-subtle mt-1">
                                        المدة الزمنية (بالساعات) المسموح بها لولي الأمر لإتمام الدفع بعد موافقة المعلم.
                                    </p>
                                </div>
                                <div className="bg-gray-50 px-3 py-1 rounded text-sm font-mono">
                                    الحالية: {settings.paymentWindowHours} ساعة
                                </div>
                            </div>
                            <div className="relative w-full md:w-1/3">
                                <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={paymentWindowHours}
                                    onChange={(e) => setPaymentWindowHours(e.target.value)}
                                    className="pl-16"
                                />
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">ساعة</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Min Hours Before Session */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">الحد الأدنى قبل الحصة</h3>
                                    <p className="text-sm text-text-subtle mt-1">
                                        الحد الأدنى من الساعات قبل بدء الحصة الذي يجب إتمام الدفع قبله.
                                    </p>
                                </div>
                                <div className="bg-gray-50 px-3 py-1 rounded text-sm font-mono">
                                    الحالية: {settings.minHoursBeforeSession} ساعة
                                </div>
                            </div>
                            <div className="relative w-full md:w-1/3">
                                <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={minHoursBeforeSession}
                                    onChange={(e) => setMinHoursBeforeSession(e.target.value)}
                                    className="pl-16"
                                />
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">ساعة</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Max Price Per Hour */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">الحد الأقصى لسعر الساعة</h3>
                                    <p className="text-sm text-text-subtle mt-1">
                                        الحد الأقصى المسموح به للمعلمين عند تحديد سعر الحصة بالجنيه السوداني.
                                    </p>
                                </div>
                                <div className="bg-gray-50 px-3 py-1 rounded text-sm font-mono">
                                    الحالية: {Number(settings.maxPricePerHour || 50000).toLocaleString()} جنيه
                                </div>
                            </div>
                            <div className="relative w-full md:w-1/3">
                                <Input
                                    type="number"
                                    min="100"
                                    step="100"
                                    value={maxPricePerHour}
                                    onChange={(e) => setMaxPricePerHour(e.target.value)}
                                    className="pl-16"
                                />
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">جنيه</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Session Duration */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">مدة الحصة الافتراضية</h3>
                                    <p className="text-sm text-text-subtle mt-1">
                                        المدة الافتراضية للحصة بالدقائق (حالياً لجميع المعلمين، لاحقاً يمكن للمعلم الاختيار)
                                    </p>
                                </div>
                                <div className="bg-gray-50 px-3 py-1 rounded text-sm font-mono">
                                    الحالية: {Number(settings.defaultSessionDurationMinutes || 60)} دقيقة
                                </div>
                            </div>
                            <div className="relative w-full md:w-1/3">
                                <Input
                                    type="number"
                                    min="15"
                                    max="240"
                                    step="15"
                                    value={sessionDuration}
                                    onChange={(e) => setSessionDuration(e.target.value)}
                                    className="pl-16"
                                />
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">دقيقة</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Meeting Link Access Time */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">وقت الوصول لرابط الاجتماع</h3>
                                    <p className="text-sm text-text-subtle mt-1">
                                        عدد الدقائق قبل بداية الحصة التي يمكن للمعلم فيها الوصول لرابط الاجتماع والانضمام للحصة.
                                    </p>
                                </div>
                                <div className="bg-gray-50 px-3 py-1 rounded text-sm font-mono">
                                    الحالية: {settings.meetingLinkAccessMinutesBefore || 15} دقيقة
                                </div>
                            </div>
                            <div className="relative w-full md:w-1/3">
                                <Input
                                    type="number"
                                    min="5"
                                    max="60"
                                    step="5"
                                    value={meetingLinkAccessMinutes}
                                    onChange={(e) => setMeetingLinkAccessMinutes(e.target.value)}
                                    className="pl-16"
                                />
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">دقيقة</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Max Vacation Days */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">الحد الأقصى لمدة الإجازة</h3>
                                    <p className="text-sm text-text-subtle mt-1">
                                        الحد الأقصى للأيام المسموح بها للمعلمين لتفعيل وضع الإجازة.
                                    </p>
                                </div>
                                <div className="bg-gray-50 px-3 py-1 rounded text-sm font-mono">
                                    الحالية: {settings.maxVacationDays || 21} يوم
                                </div>
                            </div>
                            <div className="relative w-full md:w-1/3">
                                <Input
                                    type="number"
                                    min="1"
                                    max="90"
                                    step="1"
                                    value={maxVacationDays}
                                    onChange={(e) => setMaxVacationDays(e.target.value)}
                                    className="pl-16"
                                />
                                <span className="absolute left-3 top-2 text-gray-400 text-sm">يوم</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Feature Toggles */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900">تفعيل الخصائص</h3>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-bold">باقات الحصص</h4>
                                    <p className="text-sm text-text-subtle">تفعيل إمكانية شراء الطلاب لمجموعة حصص بخصم.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSettings({ ...settings, packagesEnabled: !settings.packagesEnabled })}
                                    className={`w-14 h-7 rounded-full transition-colors relative ${settings.packagesEnabled ? 'bg-success' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.packagesEnabled ? 'right-8' : 'right-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-bold">الحصص التجريبية</h4>
                                    <p className="text-sm text-text-subtle">تفعيل إمكانية تقديم المعلمين لحصص تجريبية مجانية.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSettings({ ...settings, demosEnabled: !settings.demosEnabled })}
                                    className={`w-14 h-7 rounded-full transition-colors relative ${settings.demosEnabled ? 'bg-success' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.demosEnabled ? 'right-8' : 'right-1'}`} />
                                </button>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Cancellation Policies */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900">سياسات الإلغاء</h3>
                            <p className="text-sm text-text-subtle">
                                تحديد مهلة الإلغاء بالساعات. قبل المهلة: استرداد كامل (100%). بعد المهلة: لا استرداد (0%).
                            </p>

                            {/* Flexible */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
                                <h4 className="font-bold text-primary">سياسة مرنة (Flexible)</h4>
                                <div className="space-y-2">
                                    <label className="text-sm">مهلة الإلغاء (ساعات)</label>
                                    <Input
                                        type="number"
                                        value={cancellationForm.flexible.cutoffHours}
                                        onChange={(e) => setCancellationForm({ ...cancellationForm, flexible: { ...cancellationForm.flexible, cutoffHours: Number(e.target.value) } })}
                                    />
                                    <p className="text-xs text-text-subtle">مجاني حتى X ساعة قبل الحصة</p>
                                </div>
                            </div>

                            {/* Moderate */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
                                <h4 className="font-bold text-primary">سياسة متوسطة (Moderate)</h4>
                                <div className="space-y-2">
                                    <label className="text-sm">مهلة الإلغاء (ساعات)</label>
                                    <Input
                                        type="number"
                                        value={cancellationForm.moderate.cutoffHours}
                                        onChange={(e) => setCancellationForm({ ...cancellationForm, moderate: { ...cancellationForm.moderate, cutoffHours: Number(e.target.value) } })}
                                    />
                                    <p className="text-xs text-text-subtle">مجاني حتى X ساعة قبل الحصة</p>
                                </div>
                            </div>

                            {/* Strict */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
                                <h4 className="font-bold text-primary">سياسة صارمة (Strict)</h4>
                                <div className="space-y-2">
                                    <label className="text-sm">مهلة الإلغاء (ساعات)</label>
                                    <Input
                                        type="number"
                                        value={cancellationForm.strict.cutoffHours}
                                        onChange={(e) => setCancellationForm({ ...cancellationForm, strict: { ...cancellationForm.strict, cutoffHours: Number(e.target.value) } })}
                                    />
                                    <p className="text-xs text-text-subtle">مجاني حتى X ساعة قبل الحصة</p>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Search Configuration */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900">إعدادات البحث</h3>
                            <p className="text-sm text-text-subtle">التحكم في فلاتر البحث المتاحة للطلاب.</p>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-bold">فلتر النوع (الجنس)</h4>
                                    <p className="text-sm text-text-subtle">إظهار خيار تصفية المعلمين حسب الجنس (ذكر/أنثى).</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSettings({
                                        ...settings,
                                        searchConfig: { ...settings.searchConfig, enableGenderFilter: !settings.searchConfig?.enableGenderFilter }
                                    })}
                                    className={`w-14 h-7 rounded-full transition-colors relative ${settings.searchConfig?.enableGenderFilter ? 'bg-success' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.searchConfig?.enableGenderFilter ? 'right-8' : 'right-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-bold">فلتر السعر</h4>
                                    <p className="text-sm text-text-subtle">إظهار خيار تصفية المعلمين حسب نطاق السعر.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSettings({
                                        ...settings,
                                        searchConfig: { ...settings.searchConfig, enablePriceFilter: !settings.searchConfig?.enablePriceFilter }
                                    })}
                                    className={`w-14 h-7 rounded-full transition-colors relative ${settings.searchConfig?.enablePriceFilter ? 'bg-success' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.searchConfig?.enablePriceFilter ? 'right-8' : 'right-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={saving} className="bg-primary text-white w-32">
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
