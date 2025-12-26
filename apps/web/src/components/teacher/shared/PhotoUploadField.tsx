'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/api/upload';
import { AuthenticatedImage } from '@/components/ui/AuthenticatedImage';

interface PhotoUploadFieldProps {
    /** Current photo URL (file key for server-stored images) */
    value?: string | null;
    /** Callback when photo changes */
    onChange: (url: string | null) => void;
    /** Disable interactions */
    disabled?: boolean;
    /** Show photo tips panel */
    showTips?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Upload folder */
    folder?: 'profile-photos' | 'teacher-docs';
}

const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
};

/**
 * Shared photo upload component used by Onboarding and Profile Hub.
 * Handles file validation, server upload, and preview display.
 */
export function PhotoUploadField({
    value,
    onChange,
    disabled = false,
    showTips = false,
    size = 'md',
    folder = 'profile-photos',
}: PhotoUploadFieldProps) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('الرجاء اختيار صورة صالحة');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
            return;
        }

        setUploading(true);
        try {
            const result = await uploadFile(file, folder);
            onChange(result);
            toast.success('تم رفع الصورة بنجاح');
        } catch (error: any) {
            console.error('Failed to upload photo:', error);
            const message = error?.message || error?.response?.data?.message || 'فشل رفع الصورة';
            toast.error(message);
        } finally {
            setUploading(false);
            // Reset input for re-upload
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-3">
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={disabled}
            />

            <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Photo Preview/Upload */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div
                        onClick={() => !disabled && inputRef.current?.click()}
                        className={cn(
                            sizeClasses[size],
                            "rounded-2xl border-2 border-dashed transition-all overflow-hidden",
                            "flex items-center justify-center",
                            value
                                ? "border-primary bg-primary/5"
                                : "border-gray-300 hover:border-primary hover:bg-primary/5",
                            disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        )}
                    >
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : value ? (
                            <AuthenticatedImage
                                fileKey={value}
                                alt="Profile"
                                className="w-full h-full"
                                imageClassName="rounded-2xl"
                                enableFullView={false}
                            />
                        ) : (
                            <div className="text-center p-4">
                                <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                <span className="text-sm text-gray-500">إضافة صورة</span>
                            </div>
                        )}
                    </div>
                    {value && !disabled && (
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                            className="mt-2 w-full"
                        >
                            تغيير الصورة
                        </Button>
                    )}
                </div>

                {/* Photo Tips */}
                {showTips && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex-1">
                        <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                            💡 نصائح للصورة
                        </h3>
                        <ul className="text-sm text-amber-700 space-y-1.5">
                            <li>• وجه واضح ومبتسم</li>
                            <li>• إضاءة جيدة</li>
                            <li>• خلفية بسيطة</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
