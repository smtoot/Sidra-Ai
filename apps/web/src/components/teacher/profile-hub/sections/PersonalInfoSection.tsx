'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    User,
    Phone,
    MessageCircle,
    MapPin,
    Globe,
    Calendar
} from 'lucide-react';

interface PersonalInfoSectionProps {
    fullName: string;
    phoneNumber?: string; // From user registration (read-only)
    whatsappNumber: string;
    city: string;
    country: string;
    dateOfBirth: string; // ISO date string
    isReadOnly?: boolean;
    onUpdate: (data: {
        fullName?: string;
        whatsappNumber?: string;
        city?: string;
        country?: string;
        dateOfBirth?: string;
    }) => void;
}

export function PersonalInfoSection({
    fullName,
    phoneNumber,
    whatsappNumber,
    city,
    country,
    dateOfBirth,
    isReadOnly = false,
    onUpdate,
}: PersonalInfoSectionProps) {
    // Format date for input (YYYY-MM-DD)
    const formattedDate = dateOfBirth ? dateOfBirth.split('T')[0] : '';

    return (
        <div className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    الاسم الكامل <span className="text-red-500">*</span>
                </Label>
                <Input
                    value={fullName}
                    onChange={(e) => onUpdate({ fullName: e.target.value })}
                    placeholder="الاسم كما هو في الوثائق الرسمية"
                    className="text-right"
                    disabled={isReadOnly}
                    dir="rtl"
                />
                <p className="text-xs text-gray-500">
                    هذا الاسم سيُستخدم للتحقق من الهوية ولن يظهر للطلاب
                </p>
            </div>

            {/* Phone Number (Read-only from registration) */}
            <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    رقم الهاتف
                </Label>
                <Input
                    value={phoneNumber || ''}
                    className="text-right bg-gray-50"
                    disabled={true}
                    dir="ltr"
                />
                <p className="text-xs text-gray-500">
                    رقم الهاتف المسجل به. للتغيير، تواصل مع الدعم الفني.
                </p>
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    رقم الواتساب
                </Label>
                <Input
                    value={whatsappNumber}
                    onChange={(e) => onUpdate({ whatsappNumber: e.target.value })}
                    placeholder="+249 9XXXXXXXX"
                    className="text-right"
                    disabled={isReadOnly}
                    dir="ltr"
                />
                <p className="text-xs text-green-600">
                    مهم للتواصل السريع مع الادارة
                </p>
            </div>

            {/* City & Country Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country of Residence */}
                <div className="space-y-2">
                    <Label className="text-base font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        دولة الإقامة
                    </Label>
                    <Input
                        value={country}
                        onChange={(e) => onUpdate({ country: e.target.value })}
                        placeholder="مثال: السودان"
                        className="text-right"
                        disabled={isReadOnly}
                        dir="rtl"
                    />
                </div>

                {/* City of Residence */}
                <div className="space-y-2">
                    <Label className="text-base font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        مدينة الإقامة
                    </Label>
                    <Input
                        value={city}
                        onChange={(e) => onUpdate({ city: e.target.value })}
                        placeholder="مثال: الخرطوم"
                        className="text-right"
                        disabled={isReadOnly}
                        dir="rtl"
                    />
                </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    تاريخ الميلاد
                </Label>
                <Input
                    type="date"
                    value={formattedDate}
                    onChange={(e) => onUpdate({ dateOfBirth: e.target.value })}
                    className="text-right"
                    disabled={isReadOnly}
                    dir="ltr"
                />
            </div>
        </div>
    );
}
