'use client';

import { Info } from 'lucide-react';

export function GuestInfoBanner() {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="font-medium text-blue-900 text-sm mb-1">
                        تصفح بحرية، سجّل دخول للحجز
                    </p>
                    <p className="text-xs text-blue-700">
                        يمكنك استكشاف الأسعار والمواعيد المتاحة. تسجيل الدخول مطلوب فقط عند إتمام الحجز.
                    </p>
                </div>
            </div>
        </div>
    );
}
