'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    User,
    Sparkles,
    Phone,
    MessageCircle,
    MapPin,
    Globe,
    Calendar
} from 'lucide-react';

interface PersonalInfoSectionProps {
    // Name fields
    firstName: string;
    lastName: string;
    displayName: string;
    slug?: string;
    // Contact
    phoneNumber?: string; // From user registration (read-only)
    whatsappNumber: string;
    // Location
    city: string;
    country: string;
    // Other
    dateOfBirth: string; // ISO date string
    isReadOnly?: boolean;
    onUpdate: (data: {
        firstName?: string;
        lastName?: string;
        displayName?: string;
        slug?: string;
        whatsappNumber?: string;
        city?: string;
        country?: string;
        dateOfBirth?: string;
    }) => void;
}

export function PersonalInfoSection({
    firstName,
    lastName,
    displayName,
    slug = '',
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
            {/* Name Section Header */}
            <div className="pb-2 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الأسماء
                </h3>
            </div>

            {/* First Name & Last Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">
                        الاسم الأول <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        value={firstName}
                        onChange={(e) => onUpdate({ firstName: e.target.value })}
                        placeholder="محمد"
                        className="text-right"
                        disabled={isReadOnly}
                        dir="rtl"
                    />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">
                        اسم العائلة <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        value={lastName}
                        onChange={(e) => onUpdate({ lastName: e.target.value })}
                        placeholder="أحمد"
                        className="text-right"
                        disabled={isReadOnly}
                        dir="rtl"
                    />
                </div>
            </div>
            <p className="text-xs text-gray-500 -mt-4">
                اسمك الكامل للأغراض الإدارية والتحقق من الهوية
            </p>

            {/* Display Name (Student-facing) */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-base font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        الاسم الظاهر للطلاب <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        value={displayName}
                        onChange={(e) => onUpdate({ displayName: e.target.value })}
                        placeholder="مثال: أ. محمد أحمد"
                        className="text-right"
                        disabled={isReadOnly}
                        dir="rtl"
                    />
                    <p className="text-xs text-primary/70">
                        هذا الاسم سيظهر للطلاب وأولياء الأمور في صفحة ملفك الشخصي
                    </p>
                </div>

                {/* Public Profile URL Slug */}
                <div className="space-y-2">
                    <Label className="text-base font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500" />
                        رابط صفحتك العامة
                    </Label>
                    <div className="flex items-center gap-2" dir="ltr">
                        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            sidra.sd/teachers/
                        </span>
                        <Input
                            value={slug}
                            onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                onUpdate({ slug: val });
                            }}
                            placeholder="my-name"
                            className="text-left flex-1 font-mono text-sm"
                            disabled={isReadOnly}
                        />
                    </div>
                    <p className="text-xs text-gray-500 text-right">
                        يمكنك تخصيص الرابط الخاص بصفحتك. استخدم أحرف إنجليزية وأرقام فقط.
                    </p>
                </div>
            </div>

            {/* Contact Section Header */}
            <div className="pb-2 border-b border-gray-100 mt-8">
                <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    التواصل
                </h3>
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

            {/* Location Section Header */}
            <div className="pb-2 border-b border-gray-100 mt-8">
                <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    الموقع
                </h3>
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
