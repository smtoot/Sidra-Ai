'use client';

import { useState, useEffect } from 'react';
import { Package, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PackageSettingsProps {
    isReadOnly?: boolean;
}

interface PackageTier {
    id: string;
    sessionCount: number;
    discountPercent: number;
    isActive: boolean;
    displayOrder: number;
}

export function PackageSettings({ isReadOnly = false }: PackageSettingsProps) {
    const [tiers, setTiers] = useState<PackageTier[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPackageSettings();
    }, []);

    const loadPackageSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/packages/tiers');
            const data = await response.json();
            setTiers(data || []);
        } catch (err) {
            console.error('Failed to load package tiers', err);
        } finally {
            setLoading(false);
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

    const activeTiers = tiers.filter(t => t.isActive).sort((a, b) => a.displayOrder - b.displayOrder);

    return (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200 space-y-4">
            <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm">الباقات والعروض</h3>
            </div>

            <p className="text-xs text-gray-600">
                الطلاب يمكنهم شراء باقات حصص بخصومات تلقائية حسب عدد الحصص
            </p>

            {/* Available Tiers Info */}
            {activeTiers.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">الباقات المتاحة حالياً:</p>
                    {activeTiers.map(tier => (
                        <div
                            key={tier.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white border border-purple-200"
                        >
                            <div>
                                <p className="font-medium text-sm text-purple-700">
                                    باقة {tier.sessionCount} حصص
                                </p>
                                <p className="text-xs text-gray-500">
                                    خصم {tier.discountPercent}% تلقائي
                                </p>
                            </div>
                            <Package className="w-5 h-5 text-purple-400" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                        لا توجد باقات نشطة حالياً. يتم إدارة الباقات من قبل الإدارة.
                    </p>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700 space-y-1">
                        <p>• تُطبق الخصومات تلقائياً عند شراء الطلاب للباقات</p>
                        <p>• يمكنك متابعة الباقات المباعة من صفحة الباقات</p>
                        <p>• الأرباح تُحوّل إلى محفظتك بعد كل حصة مكتملة</p>
                    </div>
                </div>
            </div>

            {/* Link to Packages Page */}
            <Link href="/teacher/packages">
                <Button variant="outline" className="w-full text-sm">
                    <Package className="w-4 h-4 ml-2" />
                    عرض باقاتي المباعة
                </Button>
            </Link>
        </div>
    );
}
