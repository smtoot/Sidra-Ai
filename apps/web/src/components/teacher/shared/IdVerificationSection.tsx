'use client';

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IdCard, Loader2, Camera, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/api/upload';
import { AuthenticatedImage } from '@/components/ui/AuthenticatedImage';

const ID_TYPES = [
    { value: 'NATIONAL_ID', label: 'البطاقة الوطنية', icon: '🆔' },
    { value: 'PASSPORT', label: 'جواز السفر', icon: '🛂' },
    { value: 'DRIVER_LICENSE', label: 'رخصة القيادة', icon: '🚗' },
    { value: 'RESIDENT_PERMIT', label: 'تصريح إقامة', icon: '📋' },
];

interface IdVerificationSectionProps {
    /** Current ID type */
    idType?: string | null;
    /** Current ID number */
    idNumber?: string;
    /** Current ID image URL */
    idImageUrl?: string | null;
    /** Callback when values change */
    onChange: (data: { idType?: string; idNumber?: string; idImageUrl?: string }) => void;
    /** Disable interactions */
    disabled?: boolean;
}

/**
 * ID Verification section component.
 * Collects ID type, ID number, and ID image upload.
 * Used in both Onboarding (Documents step) and Profile Hub.
 */
export function IdVerificationSection({
    idType,
    idNumber = '',
    idImageUrl,
    onChange,
    disabled = false,
}: IdVerificationSectionProps) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            toast.error('الرجاء اختيار صورة أو ملف PDF');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('حجم الملف يجب أن لا يتجاوز 5 ميجابايت');
            return;
        }

        setUploading(true);
        try {
            const result = await uploadFile(file, 'teacher-docs');
            onChange({ idImageUrl: result });
            toast.success('تم رفع صورة الهوية بنجاح');
        } catch (error: any) {
            console.error('Failed to upload ID:', error);
            const message = error?.message || 'فشل رفع الهوية';
            toast.error(message);
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const selectedType = ID_TYPES.find(t => t.value === idType);

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IdCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">تأكيد الهوية</h3>
                    <p className="text-sm text-text-subtle">مطلوب للتحقق من هويتك</p>
                </div>
            </div>

            {/* ID Type Selection */}
            <div className="space-y-3">
                <Label className="text-base font-medium">نوع الهوية <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-3">
                    {ID_TYPES.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => !disabled && onChange({ idType: type.value })}
                            disabled={disabled}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right",
                                idType === type.value
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 hover:border-gray-300",
                                disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                            )}
                        >
                            <span className="text-2xl">{type.icon}</span>
                            <span className={cn(
                                "font-medium",
                                idType === type.value ? "text-primary" : "text-gray-700"
                            )}>
                                {type.label}
                            </span>
                            {idType === type.value && (
                                <Check className="w-5 h-5 text-primary mr-auto" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ID Number */}
            <div className="space-y-2">
                <Label className="text-base font-medium">
                    رقم الهوية <span className="text-red-500">*</span>
                </Label>
                <Input
                    value={idNumber}
                    onChange={(e) => onChange({ idNumber: e.target.value })}
                    placeholder={selectedType ? `أدخل رقم ${selectedType.label}` : 'أدخل رقم الهوية'}
                    className="h-12 text-base"
                    disabled={disabled}
                    dir="ltr"
                />
            </div>

            {/* ID Image Upload */}
            <div className="space-y-3">
                <Label className="text-base font-medium">
                    صورة الهوية <span className="text-red-500">*</span>
                </Label>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleUpload}
                    className="hidden"
                    disabled={disabled}
                />

                {idImageUrl ? (
                    <div className="relative rounded-xl border-2 border-green-300 bg-green-50 overflow-hidden">
                        <AuthenticatedImage
                            fileKey={idImageUrl}
                            alt="ID Image"
                            className="w-full h-40"
                            enableFullView={true}
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full flex items-center gap-1">
                                <Check className="w-4 h-4" />
                                تم الرفع
                            </span>
                        </div>
                        {!disabled && (
                            <div className="absolute bottom-2 left-2 flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => inputRef.current?.click()}
                                    className="bg-white/90"
                                >
                                    تغيير
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onChange({ idImageUrl: undefined })}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => !disabled && inputRef.current?.click()}
                        disabled={disabled || uploading}
                        className={cn(
                            "w-full h-40 rounded-xl border-2 border-dashed transition-all",
                            "flex flex-col items-center justify-center gap-3",
                            "border-gray-300 hover:border-primary hover:bg-primary/5",
                            disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        )}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <span className="text-sm text-text-subtle">جاري الرفع...</span>
                            </>
                        ) : (
                            <>
                                <Camera className="w-10 h-10 text-gray-400" />
                                <span className="text-sm text-text-subtle">انقر لرفع صورة الهوية</span>
                                <span className="text-xs text-gray-400">JPEG, PNG, PDF - حد أقصى 5 ميجابايت</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
