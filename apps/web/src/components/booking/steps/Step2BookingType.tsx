'use client';

import { BookingTypeSelectorV2 } from '../BookingTypeSelectorV2';
import { BookingTypeOption } from '../types';

interface Step2BookingTypeProps {
    teacherId: string;
    subjectId: string;
    basePrice: number;
    selectedOption: BookingTypeOption | null;
    onSelect: (option: BookingTypeOption) => void;
}

export function Step2BookingType({
    teacherId,
    subjectId,
    basePrice,
    selectedOption,
    onSelect
}: Step2BookingTypeProps) {
    return (
        <div>
            <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                    اختر الباقة أو نوع الحصة
                </h3>
                <p className="text-xs text-gray-500">
                    وفّر أكثر مع الباقات - اختر ما يناسب احتياجاتك
                </p>
            </div>

            <BookingTypeSelectorV2
                teacherId={teacherId}
                subjectId={subjectId}
                basePrice={basePrice}
                onSelect={onSelect}
                selectedOption={selectedOption}
            />
        </div>
    );
}
