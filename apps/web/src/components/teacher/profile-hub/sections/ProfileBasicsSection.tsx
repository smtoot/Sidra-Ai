'use client';

import { useState, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera, Video, User, Loader2, X, AlertCircle, CheckCircle, Play, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/api/upload';
import { AuthenticatedImage } from '@/components/ui/AuthenticatedImage';
import { parseVideoUrl } from '@/lib/utils/video-thumbnail';

// Video URL validation patterns
const VIDEO_URL_PATTERNS = {
    youtube: [
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
        /^(https?:\/\/)?youtu\.be\/[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
    ],
    vimeo: [
        /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/,
        /^(https?:\/\/)?player\.vimeo\.com\/video\/\d+/,
    ],
};

/**
 * Validates a video URL and returns the platform if valid
 */
function validateVideoUrl(url: string): { valid: boolean; platform?: 'youtube' | 'vimeo'; error?: string } {
    if (!url || !url.trim()) {
        return { valid: true }; // Empty is valid (optional field)
    }

    const trimmedUrl = url.trim();

    // Check YouTube patterns
    for (const pattern of VIDEO_URL_PATTERNS.youtube) {
        if (pattern.test(trimmedUrl)) {
            return { valid: true, platform: 'youtube' };
        }
    }

    // Check Vimeo patterns
    for (const pattern of VIDEO_URL_PATTERNS.vimeo) {
        if (pattern.test(trimmedUrl)) {
            return { valid: true, platform: 'vimeo' };
        }
    }

    // Not a valid video URL
    return {
        valid: false,
        error: 'الرابط غير صحيح. يرجى إدخال رابط من YouTube أو Vimeo'
    };
}

interface ProfileBasicsSectionProps {
    displayName: string;
    bio: string;
    profilePhotoUrl?: string;
    introVideoUrl?: string;
    isReadOnly?: boolean;
    onUpdate: (data: {
        displayName?: string;
        bio?: string;
        profilePhotoUrl?: string;
        introVideoUrl?: string;
    }) => void;
}

export function ProfileBasicsSection({
    displayName,
    bio,
    profilePhotoUrl,
    introVideoUrl,
    isReadOnly = false,
    onUpdate,
}: ProfileBasicsSectionProps) {
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const wordCount = bio?.trim().split(/\s+/).filter(Boolean).length || 0;

    // Validate video URL in real-time
    const videoValidation = useMemo(() => validateVideoUrl(introVideoUrl || ''), [introVideoUrl]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPhoto(true);
        try {
            // uploadFile now handles validation and compression automatically
            const result = await uploadFile(file, 'profile-photos');
            onUpdate({ profilePhotoUrl: result });
            toast.success('تم رفع الصورة بنجاح');
        } catch (error: any) {
            console.error('Failed to upload photo:', error);
            // Show the error message (could be validation error or server error)
            const message = error?.message || error?.response?.data?.message || 'فشل رفع الصورة';
            toast.error(message);
        } finally {
            setUploadingPhoto(false);
        }
    };


    return (
        <div className="space-y-6">
            {/* Photo & Video Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Photo */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">الصورة الشخصية</Label>
                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={isReadOnly}
                    />
                    <div
                        onClick={() => !isReadOnly && photoInputRef.current?.click()}
                        className={cn(
                            "w-32 h-32 rounded-2xl border-2 border-dashed transition-all overflow-hidden mx-auto",
                            "flex items-center justify-center",
                            profilePhotoUrl
                                ? "border-primary bg-primary/5"
                                : "border-gray-300 hover:border-primary hover:bg-primary/5",
                            isReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        )}
                    >
                        {uploadingPhoto ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : profilePhotoUrl ? (
                            <AuthenticatedImage
                                fileKey={profilePhotoUrl}
                                alt="Profile"
                                className="w-full h-full"
                                imageClassName="rounded-2xl"
                                enableFullView={false}
                            />
                        ) : (
                            <div className="text-center p-4">
                                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                <span className="text-xs text-gray-500">رفع صورة</span>
                            </div>
                        )}
                    </div>
                    {profilePhotoUrl && !isReadOnly && (
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => photoInputRef.current?.click()}
                            className="w-full"
                        >
                            تغيير الصورة
                        </Button>
                    )}
                </div>

                {/* Intro Video URL */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">فيديو تعريفي (اختياري)</Label>
                    <p className="text-xs text-gray-500">
                        أدخل رابط فيديو تعريفي من YouTube أو Vimeo
                    </p>
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                type="url"
                                value={introVideoUrl || ''}
                                onChange={(e) => onUpdate({ introVideoUrl: e.target.value || undefined })}
                                placeholder="https://www.youtube.com/watch?v=..."
                                disabled={isReadOnly}
                                dir="ltr"
                                className={cn(
                                    "text-left pr-10",
                                    introVideoUrl && !videoValidation.valid && "border-red-500 focus:ring-red-500",
                                    introVideoUrl && videoValidation.valid && videoValidation.platform && "border-green-500 focus:ring-green-500"
                                )}
                            />
                            {/* Validation Icon */}
                            {introVideoUrl && (
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    {videoValidation.valid && videoValidation.platform ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : !videoValidation.valid ? (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {/* Validation Error Message */}
                        {introVideoUrl && !videoValidation.valid && videoValidation.error && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {videoValidation.error}
                            </p>
                        )}

                        {/* Success State - Valid URL with Thumbnail */}
                        {introVideoUrl && videoValidation.valid && videoValidation.platform && (() => {
                            const videoInfo = parseVideoUrl(introVideoUrl);
                            return (
                                <div className="rounded-xl border border-green-200 overflow-hidden bg-green-50">
                                    {/* Video Thumbnail */}
                                    {videoInfo && (
                                        <div className="relative aspect-video bg-gray-900">
                                            <img
                                                src={videoInfo.thumbnailUrl}
                                                alt="Video thumbnail"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to placeholder on error
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect fill="%23374151" width="320" height="180"/><text x="160" y="95" text-anchor="middle" fill="%239ca3af" font-size="14">Video Preview</text></svg>';
                                                }}
                                            />
                                            {/* Play Button Overlay */}
                                            <a
                                                href={introVideoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                                            >
                                                <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                                                    <Play className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" />
                                                </div>
                                            </a>
                                            {/* Platform Badge */}
                                            <div className="absolute top-2 right-2">
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-xs font-medium text-white",
                                                    videoInfo.platform === 'youtube' ? 'bg-red-600' : 'bg-blue-600'
                                                )}>
                                                    {videoInfo.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {/* Info Bar */}
                                    <div className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-green-700">
                                                {videoValidation.platform === 'youtube' ? 'فيديو YouTube' : 'فيديو Vimeo'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <a
                                                href={introVideoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-green-600 hover:text-green-700 p-1"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            {!isReadOnly && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onUpdate({ introVideoUrl: undefined })}
                                                    className="text-red-500 hover:text-red-600 h-8 px-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Supported Formats Hint */}
                        {!introVideoUrl && (
                            <p className="text-xs text-gray-400">
                                الصيغ المدعومة: youtube.com/watch, youtu.be, youtube.com/shorts, vimeo.com
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
                <Label className="text-base font-medium">الاسم المعروض</Label>
                <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        value={displayName}
                        onChange={(e) => onUpdate({ displayName: e.target.value })}
                        placeholder="مثال: أ. محمد أحمد"
                        className="pr-10 h-12 text-base"
                        disabled={isReadOnly}
                    />
                </div>
                <p className="text-xs text-gray-500">هذا الاسم سيظهر للطلاب وأولياء الأمور</p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
                <Label className="text-base font-medium">النبذة التعريفية</Label>
                <Textarea
                    value={bio}
                    onChange={(e) => onUpdate({ bio: e.target.value })}
                    placeholder="تحدث عن خبراتك، أسلوبك في التدريس، ولماذا أنت مميز..."
                    rows={5}
                    className="text-base"
                    disabled={isReadOnly}
                />
                <div className="flex justify-between text-xs">
                    <p className="text-gray-500">اكتب نبذة جذابة تعرف بك (10 كلمات على الأقل)</p>
                    <span className={cn(
                        "font-medium",
                        wordCount >= 10 ? "text-green-600" : "text-yellow-600"
                    )}>
                        {wordCount} / 10 كلمة
                    </span>
                </div>
            </div>
        </div>
    );
}
