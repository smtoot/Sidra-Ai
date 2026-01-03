'use client';

import { useState, useEffect } from 'react';
import { packageApi, PackageTier, StudentPackage, DemoEligibility } from '@/lib/api/package';
import { Play, Package, Clock, Check, AlertCircle, Tag, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from './formatUtils';

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
    isRecommended?: boolean;
    recurringRatio?: number; // From tier, e.g., 0.8 for 80% recurring
}

interface BookingTypeSelectorV2Props {
    teacherId: string;
    subjectId: string;
    basePrice: number;
    onSelect: (option: BookingTypeOption) => void;
    selectedOption: BookingTypeOption | null;
}

// =====================================================
// COMPONENT
// =====================================================

export function BookingTypeSelectorV2({
    teacherId,
    subjectId,
    basePrice,
    onSelect,
    selectedOption
}: BookingTypeSelectorV2Props) {
    const [loading, setLoading] = useState(true);
    const [demoEnabled, setDemoEnabled] = useState(false);
    const [demoEligibility, setDemoEligibility] = useState<DemoEligibility | null>(null);
    const [tiers, setTiers] = useState<PackageTier[]>([]);
    const [existingPackage, setExistingPackage] = useState<StudentPackage | null>(null);
    // Auto-expand other options if demo is available or no recommended option
    const [showOtherOptions, setShowOtherOptions] = useState(true);

    useEffect(() => {
        if (teacherId && subjectId) {
            loadOptions();
        }
    }, [teacherId, subjectId]);

    const loadOptions = async () => {
        setLoading(true);
        try {
            const [demoEnabledResult, eligibilityResult, tiersResult, activePackage] = await Promise.all([
                packageApi.isTeacherDemoEnabled(teacherId).catch(() => false),
                // For guests, eligibility check will fail - that's ok, we'll show demo as available
                // and they'll need to login to actually book
                packageApi.checkDemoEligibility(teacherId).catch(() => ({ allowed: true, reason: undefined })),
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

    // Build options
    const recommendedOption: BookingTypeOption | null = (() => {
        // Priority 1: Existing active package
        if (existingPackage) {
            const sessionsRemaining = existingPackage.sessionCount - existingPackage.sessionsUsed;
            if (sessionsRemaining > 0 && existingPackage.status === 'ACTIVE') {
                return {
                    type: 'PACKAGE',
                    enabled: true,
                    packageId: existingPackage.id,
                    price: 0,
                    displayPrice: 'من باقتك الحالية',
                    sessionsRemaining,
                    sessionCount: existingPackage.sessionCount,
                    expiresAt: existingPackage.expiresAt,
                    isRecommended: true
                };
            }
        }

        // Priority 2: Best value package tier (highest discount)
        if (tiers.length > 0) {
            const bestTier = tiers.reduce((best, tier) =>
                tier.discountPercent > best.discountPercent ? tier : best
            );

            const totalPrice = basePrice * bestTier.sessionCount;
            const discountedTotal = Math.round(totalPrice * (1 - bestTier.discountPercent / 100));
            const savings = totalPrice - discountedTotal;

            return {
                type: 'PACKAGE',
                enabled: true,
                tierId: bestTier.id,
                price: discountedTotal,
                displayPrice: formatCurrency(discountedTotal),
                sessionCount: bestTier.sessionCount,
                savings: `${formatCurrency(savings).replace(' SDG', '')} (${bestTier.discountPercent}%)`,
                isRecommended: true,
                recurringRatio: bestTier.recurringRatio
            };
        }

        return null;
    })();

    // Other options
    const otherOptions: BookingTypeOption[] = [];

    // Demo - always show if teacher has enabled demos (regardless of recommended option)
    if (demoEnabled) {
        otherOptions.push({
            type: 'DEMO',
            enabled: demoEligibility?.allowed ?? false,
            reason: demoEligibility?.reason ? getDemoDisabledReason(demoEligibility.reason) : undefined,
            price: 0,
            displayPrice: 'مجاناً'
        });
    }

    // Single session (if not recommended)
    if (!recommendedOption || recommendedOption.type !== 'SINGLE') {
        otherOptions.push({
            type: 'SINGLE',
            enabled: true,
            price: basePrice,
            displayPrice: formatCurrency(basePrice)
        });
    }

    // Other package tiers (not recommended)
    tiers.forEach((tier) => {
        if (recommendedOption?.tierId === tier.id) return; // Skip recommended

        const totalPrice = basePrice * tier.sessionCount;
        const discountedTotal = Math.round(totalPrice * (1 - tier.discountPercent / 100));
        const savings = totalPrice - discountedTotal;

        otherOptions.push({
            type: 'PACKAGE',
            enabled: true,
            tierId: tier.id,
            price: discountedTotal,
            displayPrice: formatCurrency(discountedTotal),
            sessionCount: tier.sessionCount,
            savings: `${formatCurrency(savings).replace(' SDG', '')} (${tier.discountPercent}%)`,
            recurringRatio: tier.recurringRatio
        });
    });

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className="h-24 bg-gray-100 rounded-xl" />
                <div className="h-16 bg-gray-100 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Recommended Option */}
            {recommendedOption && (
                <RecommendedCard
                    option={recommendedOption}
                    basePrice={basePrice}
                    isSelected={isOptionSelected(selectedOption, recommendedOption)}
                    onSelect={() => onSelect(recommendedOption)}
                />
            )}

            {/* Other Options */}
            {otherOptions.length > 0 && (
                <div className="space-y-2">
                    {otherOptions.length > 5 ? (
                        <>
                            <button
                                onClick={() => setShowOtherOptions(!showOtherOptions)}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                {showOtherOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <span>خيارات أخرى ({otherOptions.length})</span>
                            </button>

                            {showOtherOptions && (
                                <div className="grid gap-2">
                                    {otherOptions.map((option, idx) => (
                                        <OptionCard
                                            key={`${option.type}-${option.tierId || idx}`}
                                            option={option}
                                            isSelected={isOptionSelected(selectedOption, option)}
                                            onSelect={() => option.enabled && onSelect(option)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="grid gap-2">
                            {otherOptions.map((option, idx) => (
                                <OptionCard
                                    key={`${option.type}-${option.tierId || idx}`}
                                    option={option}
                                    isSelected={isOptionSelected(selectedOption, option)}
                                    onSelect={() => option.enabled && onSelect(option)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// =====================================================
// SUB-COMPONENTS
// =====================================================

interface CardProps {
    option: BookingTypeOption;
    basePrice?: number;
    isSelected: boolean;
    onSelect: () => void;
}

function RecommendedCard({ option, basePrice, isSelected, onSelect }: CardProps) {
    return (
        <button
            onClick={onSelect}
            disabled={!option.enabled}
            className={cn(
                "relative w-full p-5 rounded-xl border-2 transition-all text-right",
                isSelected
                    ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg ring-2 ring-primary/20"
                    : "border-primary/30 bg-white hover:border-primary hover:shadow-md",
                !option.enabled && "opacity-60 cursor-not-allowed"
            )}
        >
            {/* Recommended Badge */}
            <div className="absolute -top-2 right-4 bg-gradient-to-r from-primary to-secondary px-3 py-1 rounded-full text-white text-xs font-bold shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                الأنسب لك
            </div>

            <div className="flex items-start justify-between mt-2">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                            isSelected ? "border-primary bg-primary" : "border-gray-300"
                        )}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-gray-900">
                                {option.sessionCount ? `باقة ${option.sessionCount} حصص` : getOptionTitle(option.type)}
                            </h4>
                            {option.packageId && option.sessionsRemaining !== undefined && (
                                <p className="text-xs text-primary font-semibold">
                                    متبقي {option.sessionsRemaining} من {option.sessionCount} حصة
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Price Breakdown */}
                    {option.tierId && basePrice && option.sessionCount && (
                        <div className="pr-9 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center justify-between">
                                <span>السعر الأصلي:</span>
                                <span className="line-through">{formatCurrency(basePrice * option.sessionCount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-green-600 font-semibold">
                                <span>الخصم:</span>
                                <span>وفّر {option.savings}</span>
                            </div>
                            <div className="flex items-center justify-between font-bold text-primary text-base pt-2 border-t">
                                <span>الإجمالي:</span>
                                <span>{formatCurrency(option.price)}</span>
                            </div>
                        </div>
                    )}

                    {option.packageId && (
                        <p className="pr-9 text-xs text-gray-500 mt-2">
                            استخدم حصة من باقتك الحالية (بدون تكلفة إضافية)
                        </p>
                    )}
                </div>

                <Package className="w-8 h-8 text-primary" />
            </div>
        </button>
    );
}

function OptionCard({ option, isSelected, onSelect }: Omit<CardProps, 'basePrice'>) {
    return (
        <button
            onClick={onSelect}
            disabled={!option.enabled}
            className={cn(
                "w-full p-3 rounded-lg border transition-all text-right flex items-center justify-between",
                isSelected
                    ? "border-primary bg-primary/5"
                    : option.enabled
                        ? "border-gray-200 hover:border-primary/50 bg-white"
                        : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
            )}
        >
            <div className="flex items-center gap-2 flex-1">
                <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                    isSelected ? "border-primary" : "border-gray-300"
                )}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="text-right">
                    <p className="font-medium text-sm text-gray-900">
                        {option.tierId ? `باقة ${option.sessionCount} حصص` : getOptionTitle(option.type)}
                    </p>
                    <p className="text-xs text-gray-500">
                        {getOptionDescription(option)}
                    </p>
                    {!option.enabled && option.reason && (
                        <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {option.reason}
                        </p>
                    )}
                </div>
            </div>

            <div className="text-right">
                {option.type === 'DEMO' ? (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        مجاناً
                    </span>
                ) : (
                    <div>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(option.price)}</p>
                        {option.savings && (
                            <p className="text-[10px] text-green-600 font-semibold">وفّر {option.savings}</p>
                        )}
                    </div>
                )}
            </div>
        </button>
    );
}

// =====================================================
// HELPERS
// =====================================================

function isOptionSelected(selected: BookingTypeOption | null, option: BookingTypeOption): boolean {
    if (!selected) return false;

    return selected.type === option.type &&
        (option.tierId ? selected.tierId === option.tierId :
            option.packageId ? selected.packageId === option.packageId :
                option.type !== 'PACKAGE');
}

function getOptionTitle(type: BookingType): string {
    switch (type) {
        case 'DEMO': return 'حصة تجريبية';
        case 'SINGLE': return 'حصة واحدة';
        case 'PACKAGE': return 'من الباقة';
        default: return '';
    }
}

function getOptionDescription(option: BookingTypeOption): string {
    switch (option.type) {
        case 'DEMO': return '30 دقيقة تجريبية مجانية لمرة واحدة';
        case 'SINGLE': return 'حصة كاملة (60 دقيقة)';
        case 'PACKAGE':
            if (option.tierId) return `شراء باقة جديدة والبدء فوراً`;
            return 'استخدم حصة من باقتك المشتراة';
        default: return '';
    }
}

function getDemoDisabledReason(reason: string): string {
    switch (reason) {
        case 'ALREADY_USED': return 'سبق أن استخدمت الحصة التجريبية مع هذا المعلم';
        case 'PENDING_EXISTS': return 'لديك حجز تجريبي قيد الانتظار';
        case 'DEMO_DISABLED': return 'المعلم لا يوفر حصص تجريبية حالياً';
        default: return 'غير متاح';
    }
}
