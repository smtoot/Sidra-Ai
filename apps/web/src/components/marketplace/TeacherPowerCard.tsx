'use client';

import { useRef, useState } from 'react';
import { SearchResult } from '@/lib/api/search';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Video, User, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface TeacherPowerCardProps {
    teacher: SearchResult;
    onBook: (teacher: SearchResult) => void;
}

export function TeacherPowerCard({ teacher, onBook }: TeacherPowerCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [imgError, setImgError] = useState(false);

    const { teacherProfile, pricePerHour, subject, nextAvailableSlot } = teacher;
    const hasVideo = !!teacherProfile.introVideoUrl;

    const handleMouseEnter = () => {
        if (hasVideo && videoRef.current) {
            videoRef.current.play().catch(() => { }); // Ignore play errors
            setIsPlaying(true);
        }
    };

    const handleMouseLeave = () => {
        if (hasVideo && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    // Fallback logic
    const showVideo = hasVideo;
    // If no video, we show profile photo or a placeholder in the "cover" area

    return (
        <div
            className="group relative bg-surface rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col sm:flex-row"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Media Section (Left/Top) */}
            <div className="relative w-full sm:w-[280px] aspect-video sm:aspect-auto bg-gray-100 shrink-0 overflow-hidden">
                {showVideo ? (
                    <video
                        ref={videoRef}
                        src={teacherProfile.introVideoUrl!}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        muted
                        loop
                        playsInline
                        poster={teacherProfile.profilePhotoUrl || undefined}
                    />
                ) : (
                    <div className="w-full h-full relative bg-secondary/10 flex items-center justify-center">
                        {teacherProfile.profilePhotoUrl && !imgError ? (
                            <Image
                                src={teacherProfile.profilePhotoUrl}
                                alt={teacherProfile.displayName || "Teacher"}
                                fill
                                className="object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <User className="w-20 h-20 text-gray-300" />
                        )}
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute top-2 right-2 flex gap-1">
                    {hasVideo && (
                        <div className={cn("bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-opacity", isPlaying ? "opacity-0" : "opacity-100")}>
                            <Video className="w-3 h-3" />
                            <span>فيديو</span>
                        </div>
                    )}
                </div>

                {!hasVideo && teacherProfile.profilePhotoUrl && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                        {/* Optional text or effect for static image */}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-5 flex flex-col justify-between">
                <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-text-primary">
                                    {teacherProfile.displayName || "معلم منصة سدرة"}
                                </h3>
                                <CheckCircle2 className="w-4 h-4 text-primary fill-primary/10" />
                            </div>
                            <p className="text-text-subtle text-sm">
                                {subject.nameAr} • {teacherProfile.yearsOfExperience ? `${teacherProfile.yearsOfExperience} سنوات خبرة` : "معلم جديد"}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="font-english">{teacherProfile.averageRating.toFixed(1)}</span>
                                <span className="text-gray-300 text-xs font-normal">({teacherProfile.totalReviews})</span>
                            </div>
                        </div>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {teacherProfile.bio || "لا يوجد نبذة تعريفية."}
                    </p>

                    {/* Tags / Badges */}
                    <div className="flex flex-wrap gap-2 text-xs">
                        {teacherProfile.education && (
                            <Badge variant="secondary" className="font-normal bg-blue-50 text-blue-700 hover:bg-blue-100">
                                {teacherProfile.education}
                            </Badge>
                        )}
                        {/* Gender Badge if needed, or just icon */}
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">سعر الساعة</span>
                        <div className="font-bold text-primary font-english text-lg">
                            {parseInt(pricePerHour).toLocaleString()} <span className="text-xs font-normal text-gray-500">SDG</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                        {nextAvailableSlot && (
                            <div className="hidden md:flex flex-col items-end text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                <span className="font-semibold flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> متاح {nextAvailableSlot.display}
                                </span>
                            </div>
                        )}

                        <Button onClick={() => onBook(teacher)} className="bg-primary hover:bg-primary/90 min-w-[100px]">
                            حجز حصة
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/teacher/${teacherProfile.slug || teacherProfile.id}`}>
                                الملف الشخصي
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
