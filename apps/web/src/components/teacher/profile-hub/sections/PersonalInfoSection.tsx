'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// Removed Select imports
import {
    User,
    Sparkles,
    Phone,
    MessageCircle,
    MapPin,
    Globe,
    Calendar,
    Lock,
    Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const PRIORITY_COUNTRIES = [
    'السودان',
    'مصر',
    'السعودية',
    'الإمارات',
    'قطر',
    'الكويت',
    'البحرين',
    'عمان',
    'الأردن',
    'ليبيا',
    'العراق',
    'لبنان',
    'الجزائر',
    'المغرب',
    'تونس',
    'اليمن',
    'فلسطين',
    'سوريا'
];

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
    // Lock slug if it was already set on initial load
    // We use a lazy initializer to calculate this only once on mount
    const [isSlugLocked] = useState(() => (slug || '').trim().length > 0);

    // Format date for input (YYYY-MM-DD)
    const formattedDate = dateOfBirth ? dateOfBirth.split('T')[0] : '';

    // Country logic - Initialize based on incoming country
    const [isCustomCountry, setIsCustomCountry] = useState(() => {
        return !!(country && !PRIORITY_COUNTRIES.includes(country) && country !== 'other');
    });

    const handleCountryChange = (value: string) => {
        if (value === 'other') {
            setIsCustomCountry(true);
            onUpdate({ country: '' });
        } else {
            setIsCustomCountry(false);
            onUpdate({ country: value });
        }
    };

    const handleCopyPhoneToWhatsapp = () => {
        if (phoneNumber) {
            // Remove any non-digit chars if needed, but phone usually comes clean or with +
            onUpdate({ whatsappNumber: phoneNumber });
        }
    };

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
                    <Label className="text-base font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" />
                            رابط صفحتك العامة
                        </div>
                        {isSlugLocked && (
                            <span className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                                <Lock className="w-3 h-3" />
                                لا يمكن تغيير الرابط
                            </span>
                        )}
                    </Label>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 overflow-hidden" dir="ltr">
                        <span className={cn(
                            "text-sm px-3 py-2 rounded-lg border whitespace-nowrap",
                            isSlugLocked ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-gray-50 text-gray-500 border-gray-200"
                        )}>
                            sidra.sd/teachers/
                        </span>
                        <Input
                            value={slug}
                            onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                onUpdate({ slug: val });
                            }}
                            placeholder="my-name"
                            className={cn(
                                "text-left flex-1 min-w-0 font-mono text-sm shadow-sm",
                                isSlugLocked && "bg-gray-50 text-gray-500"
                            )}
                            disabled={isReadOnly || isSlugLocked}
                        />
                    </div>
                    {isSlugLocked ? (
                        <p className="text-xs text-gray-400 text-right">
                            لقد قمت بتعيين الرابط الخاص بك مسبقاً ولا يمكن تغييره.
                        </p>
                    ) : (
                        <div className="flex justify-between items-start">
                            <p className="text-xs text-amber-600 text-right">
                                تنبيه: بمجرد تعيين الرابط وحفظه، لن تتمكن من تغييره لاحقاً.
                            </p>
                            <p className="text-xs text-gray-500 text-right">
                                استخدم أحرف إنجليزية وأرقام فقط.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Section Header */}
            <div className="pb-2 border-b border-gray-100 mt-6 md:mt-8">
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
                    className="text-right bg-gray-50 direction-ltr text-left"
                    disabled={true}
                    dir="ltr"
                />
                <p className="text-xs text-gray-500">
                    رقم الهاتف المسجل به. للتغيير، تواصل مع الدعم الفني.
                </p>
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-2">
                <Label className="text-base font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-green-500" />
                        رقم الواتساب
                    </div>
                    {!isReadOnly && phoneNumber && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                            onClick={handleCopyPhoneToWhatsapp}
                        >
                            <Copy className="w-3 h-3 ml-1" />
                            نسخ رقم الهاتف
                        </Button>
                    )}
                </Label>
                <Input
                    value={whatsappNumber}
                    onChange={(e) => onUpdate({ whatsappNumber: e.target.value })}
                    placeholder="+249 9XXXXXXXX"
                    className="text-right direction-ltr text-left"
                    disabled={isReadOnly}
                    dir="ltr"
                />
                <p className="text-xs text-green-600">
                    مهم للتواصل السريع مع الادارة
                </p>
            </div>

            {/* Location Section Header */}
            <div className="pb-2 border-b border-gray-100 mt-6 md:mt-8">
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

                    {!isCustomCountry ? (
                        <select
                            value={country}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            disabled={isReadOnly}
                            dir="rtl"
                            className="w-full h-12 text-base text-right px-3 py-2.5 rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="" disabled>اختر الدولة</option>
                            {PRIORITY_COUNTRIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                            <option value="other" className="font-semibold text-primary">
                                دولة أخرى...
                            </option>
                        </select>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                value={country}
                                onChange={(e) => onUpdate({ country: e.target.value })}
                                placeholder="اكتب اسم الدولة..."
                                className="text-right flex-1"
                                disabled={isReadOnly}
                                dir="rtl"
                                autoFocus
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCustomCountry(false)}
                                title="العودة للقائمة"
                            >
                                ←
                            </Button>
                        </div>
                    )}
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
