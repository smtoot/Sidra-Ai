'use client';

import { useState, useEffect } from 'react';
import { Package, Loader2, Info, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { teacherApi } from '@/lib/api/teacher';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PackageSettingsProps {
    isReadOnly?: boolean;
}

interface PackageTier {
    tier: {
        id: string;
        sessionCount: number;
        discountPercent: number;
        recurringRatio: number;
        floatingRatio: number;
        nameAr?: string;
        nameEn?: string;
        isFeatured: boolean;
        badge?: string;
        isActive: boolean;
        displayOrder: number;
    };
    isEnabled: boolean;
}

export function PackageSettings({ isReadOnly = false }: PackageSettingsProps) {
    const [packagesEnabled, setPackagesEnabled] = useState(false);
    const [tiers, setTiers] = useState<PackageTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadPackageSettings();
    }, []);

    const loadPackageSettings = async () => {
        setLoading(true);
        try {
            // Load package settings
            const tierSettings = await teacherApi.getPackageTiers();
            setTiers(tierSettings);

            // TODO: Get master toggle from teacher profile or demo settings
            // For now, default to false
            setPackagesEnabled(false);
        } catch (err) {
            console.error('Failed to load package tiers', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePackageToggle = async () => {
        if (isReadOnly) return;

        setUpdating(true);
        const newValue = !packagesEnabled;
        try {
            await teacherApi.updatePackageSettings({ packagesEnabled: newValue });
            setPackagesEnabled(newValue);
            toast.success(newValue ? 'تم تفعيل الباقات الذكية' : 'تم إيقاف الباقات الذكية');
        } catch (err) {
            console.error('Failed to update package settings', err);
            toast.error('فشل في تحديث إعدادات الباقات');
        } finally {
            setUpdating(false);
        }
    };

    const handleTierToggle = async (tierId: string, currentValue: boolean) => {
        if (isReadOnly || !packagesEnabled) return;

        try {
            await teacherApi.updateTierSetting(tierId, { isEnabled: !currentValue });

            // Update local state
            setTiers(tiers.map(t =>
                t.tier.id === tierId
                    ? { ...t, isEnabled: !currentValue }
                    : t
            ));

            toast.success(!currentValue ? 'تم تفعيل الباقة' : 'تم إيقاف الباقة');
        } catch (err) {
            console.error('Failed to update tier setting', err);
            toast.error('فشل في تحديث إعدادات الباقة');
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    const activeTiers = tiers.filter(t => t.tier.isActive).sort((a, b) => a.tier.displayOrder - b.tier.displayOrder);

    return (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200 space-y-4">
            <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm">الباقات الذكية</h3>
            </div>

            <p className="text-xs text-gray-600">
                اسمح للطلاب بشراء باقات من الحصص بأسعار مخفضة مع جدولة تلقائية
            </p>

            {/* Master Toggle */}
            <button
                onClick={handlePackageToggle}
                disabled={isReadOnly || updating}
                className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg border transition-all",
                    packagesEnabled
                        ? "bg-green-50 border-green-300 hover:bg-green-100"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100",
                    isReadOnly && "opacity-60 cursor-not-allowed"
                )}
            >
                {packagesEnabled ? (
                    <ToggleRight className="w-8 h-8 text-green-600" />
                ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
                <div className="flex-1 text-right">
                    <p className={cn(
                        "font-medium text-sm",
                        packagesEnabled ? "text-green-700" : "text-gray-600"
                    )}>
                        {packagesEnabled ? 'الباقات الذكية مفعّلة' : 'الباقات الذكية معطّلة'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {packagesEnabled
                            ? 'الطلاب يمكنهم شراء الباقات منك'
                            : 'لن يتمكن الطلاب من شراء الباقات'}
                    </p>
                </div>
            </button>

            {/* Per-Tier Toggles */}
            {packagesEnabled && activeTiers.length > 0 && (
                <div className="space-y-2 pt-2">
                    <p className="text-xs font-medium text-gray-700">تخصيص الباقات المتاحة:</p>

                    {activeTiers.map((tierSetting) => {
                        const { tier, isEnabled } = tierSetting;
                        const recurringCount = Math.round(tier.sessionCount * tier.recurringRatio);
                        const floatingCount = tier.sessionCount - recurringCount;

                        return (
                            <div
                                key={tier.id}
                                className={cn(
                                    "border rounded-lg p-3 transition-all",
                                    isEnabled ? "border-purple-200 bg-white" : "border-gray-200 bg-gray-50"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleTierToggle(tier.id, isEnabled)}
                                        disabled={isReadOnly}
                                        className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                                            isEnabled
                                                ? "bg-purple-600 border-purple-600"
                                                : "bg-white border-gray-300",
                                            isReadOnly && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {isEnabled && <Check className="w-3 h-3 text-white" />}
                                    </button>

                                    <div className="flex-1 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <p className={cn(
                                                "text-sm font-medium",
                                                isEnabled ? "text-gray-900" : "text-gray-500"
                                            )}>
                                                {tier.nameAr || `باقة ${tier.sessionCount} حصص`}
                                            </p>
                                            {tier.isFeatured && (
                                                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                                    موصى بها
                                                </span>
                                            )}
                                            {tier.badge && (
                                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                                    {tier.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {tier.sessionCount} حصة ({recurringCount} تلقائية + {floatingCount} مرنة) - خصم {tier.discountPercent}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {packagesEnabled && activeTiers.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                        لا توجد باقات نشطة حالياً. يتم إدارة الباقات من قبل الإدارة.
                    </p>
                </div>
            )}

            {/* Info Box */}
            {packagesEnabled && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-700 space-y-1">
                            <p>• الحصص التلقائية: تُجدول تلقائياً بنمط أسبوعي (مثل: كل ثلاثاء 5م)</p>
                            <p>• الحصص المرنة: يحجزها الطالب متى شاء قبل انتهاء الباقة</p>
                            <p>• تُسترد الحصص المرنة غير المستخدمة تلقائياً عند انتهاء الباقة</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Link to Packages Page */}
            {packagesEnabled && (
                <Link href="/teacher/packages">
                    <Button variant="outline" className="w-full text-sm">
                        <Package className="w-4 h-4 ml-2" />
                        عرض باقاتي المباعة
                    </Button>
                </Link>
            )}
        </div>
    );
}
