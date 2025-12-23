'use client';

import { useState, useEffect } from 'react';
import { packageApi, PackageTier, StudentPackage, DemoEligibility } from '@/lib/api/package';
import { Play, Package, Clock, Check, AlertCircle, Tag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// TYPES
// =====================================================

export type BookingType = 'DEMO' | 'SINGLE' | 'PACKAGE';

export interface BookingTypeOption {
    type: BookingType;
    enabled: boolean;
    reason?: string;
    packageId?: string;
    tierId?: string;
    price: number;
    displayPrice?: string;
    savings?: string;
    sessionCount?: number;
    sessionsRemaining?: number;
    expiresAt?: string;
}

interface BookingTypeSelectorProps {
    teacherId: string;
    subjectId: string;
    basePrice: number;
    onSelect: (option: BookingTypeOption) => void;
    selectedType: BookingType | null;
}

// =====================================================
// COMPONENT
// =====================================================

export function BookingTypeSelector({
    teacherId,
    subjectId,
    basePrice,
    onSelect,
    selectedType
}: BookingTypeSelectorProps) {
    const [loading, setLoading] = useState(true);
    const [demoEnabled, setDemoEnabled] = useState(false);
    const [demoEligibility, setDemoEligibility] = useState<DemoEligibility | null>(null);
    const [tiers, setTiers] = useState<PackageTier[]>([]);
    const [existingPackage, setExistingPackage] = useState<StudentPackage | null>(null);

    useEffect(() => {
        if (teacherId && subjectId) {
            loadOptions();
        }
    }, [teacherId, subjectId]);

    const loadOptions = async () => {
        setLoading(true);
        try {
            // Parallel fetch for performance
            const [demoEnabledResult, eligibilityResult, tiersResult, activePackage] = await Promise.all([
                packageApi.isTeacherDemoEnabled(teacherId).catch(() => false),
                packageApi.checkDemoEligibility(teacherId).catch(() => ({ allowed: false, reason: 'NOT_ELIGIBLE' as const })),
                packageApi.getTiers().catch(() => []),
                packageApi.getActivePackageForTeacher(teacherId, subjectId).catch(() => null)
            ]);

            setDemoEnabled(demoEnabledResult);
            setDemoEligibility(eligibilityResult);
            setTiers(tiersResult);
            setExistingPackage(activePackage);
        } catch (err) {
            console.error('Failed to load booking options', err);
        } finally {
            setLoading(false);
        }
    };

    // Build options based on fetched data
    const options: BookingTypeOption[] = [];

    // 1. Demo option (first priority)
    if (demoEnabled) {
        const demoOption: BookingTypeOption = {
            type: 'DEMO',
            enabled: demoEligibility?.allowed ?? false,
            reason: demoEligibility?.reason ? getDemoDisabledReason(demoEligibility.reason) : undefined,
            price: 0,
            displayPrice: 'مجاني'
        };
        options.push(demoOption);
    }

    // 2. Single session (always available)
    options.push({
        type: 'SINGLE',
        enabled: true,
        price: basePrice,
        displayPrice: `${basePrice} SDG`
    });

    // 3. Existing package (if user has active one for this teacher+subject)
    if (existingPackage) {
        const sessionsRemaining = existingPackage.sessionCount - existingPackage.sessionsUsed;
        options.push({
            type: 'PACKAGE',
            enabled: sessionsRemaining > 0 && existingPackage.status === 'ACTIVE',
            reason: sessionsRemaining === 0 ? 'لا توجد حصص متبقية' : undefined,
            packageId: existingPackage.id,
            price: 0, // Already paid
            displayPrice: 'من باقتك',
            sessionsRemaining,
            sessionCount: existingPackage.sessionCount,
            expiresAt: existingPackage.expiresAt
        });
    }

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className="h-20 bg-gray-100 rounded-xl" />
                <div className="h-20 bg-gray-100 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="font-bold text-sm text-gray-700">نوع الحجز</h3>

            {options.map((option) => (
                <button
                    key={option.type}
                    onClick={() => option.enabled && onSelect(option)}
                    disabled={!option.enabled}
                    className={cn(
                        "w-full p-4 rounded-xl border-2 transition-all text-right",
                        option.enabled && selectedType === option.type
                            ? "border-primary bg-primary/5"
                            : option.enabled
                                ? "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                                : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                    )}
                >
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            option.type === 'DEMO' && "bg-amber-100 text-amber-600",
                            option.type === 'SINGLE' && "bg-blue-100 text-blue-600",
                            option.type === 'PACKAGE' && "bg-green-100 text-green-600"
                        )}>
                            {option.type === 'DEMO' && <Play className="w-5 h-5" />}
                            {option.type === 'SINGLE' && <Clock className="w-5 h-5" />}
                            {option.type === 'PACKAGE' && <Package className="w-5 h-5" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">
                                    {getOptionTitle(option.type)}
                                </span>
                                <span className={cn(
                                    "font-bold",
                                    option.type === 'DEMO' && "text-amber-600",
                                    option.type === 'SINGLE' && "text-gray-800",
                                    option.type === 'PACKAGE' && "text-green-600"
                                )}>
                                    {option.displayPrice}
                                </span>
                            </div>

                            <p className="text-xs text-gray-500 mt-1">
                                {getOptionDescription(option)}
                            </p>

                            {/* Package remaining sessions */}
                            {option.type === 'PACKAGE' && option.sessionsRemaining !== undefined && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        {option.sessionsRemaining} حصص متبقية
                                    </span>
                                </div>
                            )}

                            {/* Disabled reason */}
                            {!option.enabled && option.reason && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                                    <AlertCircle className="w-3 h-3" />
                                    {option.reason}
                                </div>
                            )}
                        </div>

                        {/* Selection indicator */}
                        {option.enabled && selectedType === option.type && (
                            <Check className="w-5 h-5 text-primary shrink-0" />
                        )}
                    </div>
                </button>
            ))}

            {/* Package tiers section (if no existing package) */}
            {!existingPackage && tiers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h4 className="font-bold text-sm text-gray-700">اشتري باقة ووفّر!</h4>
                    </div>
                    <div className="grid gap-2">
                        {tiers.map((tier) => {
                            const totalPrice = basePrice * tier.sessionCount;
                            const discountedTotal = totalPrice * (1 - tier.discountPercent / 100);
                            const savings = totalPrice - discountedTotal;

                            return (
                                <div
                                    key={tier.id}
                                    className="p-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/50"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-amber-600" />
                                            <span className="font-medium text-sm">
                                                {tier.sessionCount} حصص
                                            </span>
                                            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                                                خصم {tier.discountPercent}%
                                            </span>
                                        </div>
                                        <div className="text-left">
                                            <span className="font-bold text-amber-700">
                                                {discountedTotal.toFixed(0)} SDG
                                            </span>
                                            <span className="text-xs text-gray-500 line-through mr-2">
                                                {totalPrice.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">
                                        وفّر {savings.toFixed(0)} SDG
                                    </p>
                                </div>
                            );
                        })}
                        <p className="text-xs text-gray-400 text-center mt-1">
                            يمكنك شراء باقة من صفحة الباقات
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// =====================================================
// HELPERS
// =====================================================

function getOptionTitle(type: BookingType): string {
    switch (type) {
        case 'DEMO':
            return 'حصة تجريبية';
        case 'SINGLE':
            return 'حصة واحدة';
        case 'PACKAGE':
            return 'من الباقة';
        default:
            return '';
    }
}

function getOptionDescription(option: BookingTypeOption): string {
    switch (option.type) {
        case 'DEMO':
            return '30 دقيقة تجريبية مجانية لمرة واحدة';
        case 'SINGLE':
            return 'حصة كاملة (60 دقيقة)';
        case 'PACKAGE':
            return 'استخدم حصة من باقتك المشتراة';
        default:
            return '';
    }
}

function getDemoDisabledReason(reason: string): string {
    switch (reason) {
        case 'ALREADY_USED':
            return 'سبق أن استخدمت الحصة التجريبية مع هذا المعلم';
        case 'PENDING_EXISTS':
            return 'لديك حجز تجريبي قيد الانتظار';
        case 'DEMO_DISABLED':
            return 'المعلم لا يوفر حصص تجريبية حالياً';
        default:
            return 'غير متاح';
    }
}
