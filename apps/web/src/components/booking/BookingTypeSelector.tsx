'use client';

import { useState, useEffect } from 'react';
import { packageApi, PackageTier, StudentPackage, DemoEligibility } from '@/lib/api/package';
import { Play, Package, Clock, Check, AlertCircle, Tag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSystemConfig } from '@/context/SystemConfigContext';

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
    selectedOption: BookingTypeOption | null;  // Changed from selectedType to track full option
}

// =====================================================
// COMPONENT
// =====================================================

export function BookingTypeSelector({
    teacherId,
    subjectId,
    basePrice,
    onSelect,
    selectedOption  // Changed from selectedType
}: BookingTypeSelectorProps) {
    const { demosEnabled: globalDemosEnabled } = useSystemConfig();
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

    // 1. Existing package (Highest priority)
    if (existingPackage) {
        const sessionsRemaining = existingPackage.sessionCount - existingPackage.sessionsUsed;
        if (sessionsRemaining > 0 && existingPackage.status === 'ACTIVE') {
            options.push({
                type: 'PACKAGE',
                enabled: true,
                packageId: existingPackage.id,
                price: 0,
                displayPrice: 'من باقتك الحالية',
                sessionsRemaining,
                sessionCount: existingPackage.sessionCount,
                expiresAt: existingPackage.expiresAt
            });
        }
    }

    // 2. Demo option
    if (demoEnabled && globalDemosEnabled) {
        options.push({
            type: 'DEMO',
            enabled: demoEligibility?.allowed ?? false,
            reason: demoEligibility?.reason ? getDemoDisabledReason(demoEligibility.reason) : undefined,
            price: 0,
            displayPrice: 'مجاناً'
        });
    }

    // 3. Single session
    options.push({
        type: 'SINGLE',
        enabled: true,
        price: basePrice,
        displayPrice: `${basePrice} SDG`
    });

    // 4. Package Tiers (as new purchases)
    tiers.forEach((tier) => {
        const totalPrice = basePrice * tier.sessionCount;
        const discountedTotal = Math.round(totalPrice * (1 - tier.discountPercent / 100));
        const savings = totalPrice - discountedTotal;

        options.push({
            type: 'PACKAGE',
            enabled: true,
            tierId: tier.id,
            price: discountedTotal,
            displayPrice: `${discountedTotal} SDG`,
            sessionCount: tier.sessionCount,
            savings: `وفّر ${savings.toFixed(0)} SDG (${tier.discountPercent}%)`
        });
    });

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className="h-16 bg-gray-100 rounded-xl" />
                <div className="h-16 bg-gray-100 rounded-xl" />
                <div className="h-16 bg-gray-100 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="font-bold text-sm text-gray-700 mb-2">نوع الحجز</h3>

            <div className="grid gap-3">
                {options.map((option, idx) => {
                    // Proper selection check: match type AND specific tier/package ID
                    const isSelected = selectedOption?.type === option.type &&
                        (option.tierId
                            ? selectedOption?.tierId === option.tierId
                            : option.packageId
                                ? selectedOption?.packageId === option.packageId
                                : option.type !== 'PACKAGE' || (!option.tierId && !option.packageId));

                    return (
                        <button
                            key={`${option.type}-${option.tierId || option.packageId || idx}`}
                            onClick={() => option.enabled && onSelect(option)}
                            disabled={!option.enabled}
                            className={cn(
                                "relative w-full p-4 rounded-xl border-2 transition-all text-right flex flex-col gap-1",
                                isSelected
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : option.enabled
                                        ? "border-gray-100 hover:border-primary/30"
                                        : "border-gray-50 bg-gray-50/50 opacity-60 cursor-not-allowed"
                            )}
                        >
                            <div className="flex items-center justify-between pointer-events-none">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                        isSelected ? "border-primary" : "border-gray-300"
                                    )}>
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">
                                                {option.tierId ? `باقة ${option.sessionCount} حصص` : getOptionTitle(option.type)}
                                            </span>
                                            {option.type === 'DEMO' && (
                                                <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                                    مجاناً
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end">
                                    {option.type === 'DEMO' ? (
                                        <Play className="w-5 h-5 text-amber-500" />
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-bold text-primary">{option.price}</span>
                                                <span className="text-[10px] text-primary font-medium">SDG</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pr-8 pointer-events-none">
                                <p className="text-[11px] text-gray-500 leading-tight">
                                    {option.tierId ? `شراء باقة جديدة والبدء فوراً` : getOptionDescription(option)}
                                    {option.savings && <span className="text-green-600 font-bold mr-2">({option.savings})</span>}
                                    {option.sessionsRemaining !== undefined && (
                                        <span className="text-primary font-bold mr-2">
                                            (متبقي {option.sessionsRemaining} حصص)
                                        </span>
                                    )}
                                </p>

                                {!option.enabled && option.reason && (
                                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {option.reason}
                                    </p>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
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
