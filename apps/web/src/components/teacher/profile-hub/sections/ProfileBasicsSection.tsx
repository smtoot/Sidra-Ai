'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, X, AlertCircle, CheckCircle, Play, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhotoUploadField, BioField } from '@/components/teacher/shared';
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

function validateVideoUrl(url: string): { valid: boolean; platform?: 'youtube' | 'vimeo'; error?: string } {
    if (!url || !url.trim()) {
        return { valid: true };
    }
    const trimmedUrl = url.trim();
    for (const pattern of VIDEO_URL_PATTERNS.youtube) {
        if (pattern.test(trimmedUrl)) {
            return { valid: true, platform: 'youtube' };
        }
    }
    for (const pattern of VIDEO_URL_PATTERNS.vimeo) {
        if (pattern.test(trimmedUrl)) {
            return { valid: true, platform: 'vimeo' };
        }
    }
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

/**
 * Profile basics section for Profile Hub.
 * Uses shared PhotoUploadField and BioField components for consistency with Onboarding.
 * Includes intro video (Hub-only feature).
 */
export function ProfileBasicsSection({
    displayName,
    bio,
    profilePhotoUrl,
    introVideoUrl,
    isReadOnly = false,
    onUpdate,
}: ProfileBasicsSectionProps) {
    const videoValidation = useMemo(() => validateVideoUrl(introVideoUrl || ''), [introVideoUrl]);

    return (
        <div className="space-y-6 w-full overflow-hidden">
            {/* Photo & Video Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Photo - Using shared component */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">الصورة الشخصية</Label>
                    <PhotoUploadField
                        value={profilePhotoUrl}
                        onChange={(url) => onUpdate({ profilePhotoUrl: url || undefined })}
                        disabled={isReadOnly}
                        size="md"
                    />
                </div>

                {/* Intro Video URL (Hub-only) */}
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

                        {introVideoUrl && !videoValidation.valid && videoValidation.error && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {videoValidation.error}
                            </p>
                        )}

                        {/* Video Preview */}
                        {introVideoUrl && videoValidation.valid && videoValidation.platform && (() => {
                            const videoInfo = parseVideoUrl(introVideoUrl);
                            return (
                                <div className="rounded-xl border border-green-200 overflow-hidden bg-green-50">
                                    {videoInfo && (
                                        <div className="relative aspect-video bg-gray-900">
                                            <img
                                                src={videoInfo.thumbnailUrl}
                                                alt="Video thumbnail"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect fill="%23374151" width="320" height="180"/><text x="160" y="95" text-anchor="middle" fill="%239ca3af" font-size="14">Video Preview</text></svg>';
                                                }}
                                            />
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

            {/* Bio - Using shared component */}
            <BioField
                value={bio}
                onChange={(value) => onUpdate({ bio: value })}
                disabled={isReadOnly}
                minLength={80}
                useWordCount={false}
            />
        </div>
    );
}
