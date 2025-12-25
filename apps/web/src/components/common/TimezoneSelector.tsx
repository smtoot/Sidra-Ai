'use client';

import { useState } from 'react';
import { COMMON_TIMEZONES, getTimezoneDisplay } from '@/lib/utils/timezone';

interface TimezoneSelectorProps {
    value: string;
    onChange: (timezone: string) => void;
    label?: string;
    className?: string;
    disabled?: boolean;
}

export default function TimezoneSelector({
    value,
    onChange,
    label = 'المنطقة الزمنية',
    className = '',
    disabled = false
}: TimezoneSelectorProps) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                dir="rtl"
            >
                {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                        {tz.label} ({tz.offset})
                    </option>
                ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
                المنطقة الزمنية الحالية: {getTimezoneDisplay(value)}
            </p>
        </div>
    );
}
