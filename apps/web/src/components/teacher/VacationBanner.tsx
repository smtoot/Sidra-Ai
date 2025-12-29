'use client';

import { Palmtree, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

interface VacationBannerProps {
    isOnVacation: boolean;
    vacationEndDate: string | null;
}

export function VacationBanner({ isOnVacation, vacationEndDate }: VacationBannerProps) {
    if (!isOnVacation) return null;

    // Calculate remaining days
    const getRemainingDays = () => {
        if (!vacationEndDate) return null;
        const endDate = new Date(vacationEndDate);
        const now = new Date();
        const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const remainingDays = getRemainingDays();

    return (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-full">
                            <Palmtree className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">أنت في وضع الإجازة</h3>
                            <p className="text-amber-100 text-sm flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                {vacationEndDate && (
                                    <span>
                                        تنتهي في {format(new Date(vacationEndDate), 'd MMMM yyyy', { locale: ar })}
                                        {remainingDays !== null && remainingDays > 0 && (
                                            <span className="mr-1">({remainingDays} يوم متبقي)</span>
                                        )}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-amber-100 text-xs hidden sm:block">
                            لا يمكن للطلاب حجز حصص معك حالياً
                        </p>
                        <Link
                            href="/teacher/settings"
                            className="bg-white text-amber-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-amber-50 transition-colors flex items-center gap-1.5"
                        >
                            <X className="w-3.5 h-3.5" />
                            إنهاء الإجازة
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
