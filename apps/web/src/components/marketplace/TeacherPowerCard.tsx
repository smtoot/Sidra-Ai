'use client';

import { useRef, useState } from 'react';
import { SearchResult } from '@/lib/api/search';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Video, User, CheckCircle2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import {
    isRecentlyJoinedTeacher,
    isVerifiedTeacher,
    TEACHER_STATUS_LABELS
} from '@/config/teacher-status';

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

    // Video logic
    const handleMouseEnter = () => {
        if (hasVideo && videoRef.current) {
            // Delay start
            const timer = setTimeout(() => {
                videoRef.current?.play().catch(() => { });
                setIsPlaying(true);
            }, 400); // 400ms delay
            (videoRef.current as any)._timer = timer;
        }
    };

    const handleMouseLeave = () => {
        if (hasVideo && videoRef.current) {
            clearTimeout((videoRef.current as any)._timer);
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    // Formatters
    const formattedPrice = parseInt(pricePerHour).toLocaleString();
    const isRecentlyJoined = isRecentlyJoinedTeacher(teacherProfile.totalReviews);
    const isVerified = isVerifiedTeacher(teacherProfile.applicationStatus);

    return (
        <div
            className="group relative bg-surface rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col sm:flex-row cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => window.location.href = `/teachers/${teacherProfile.slug || teacherProfile.id}`}
        >
            {/* Media Section (Left/Top) - Fixed width on Desktop */}
            <div className="relative w-full sm:w-[220px] aspect-[4/3] sm:aspect-auto bg-gray-50 shrink-0 overflow-hidden border-b sm:border-b-0 sm:border-l border-gray-100">
                {hasVideo ? (
                    <>
                        <video
                            ref={videoRef}
                            src={teacherProfile.introVideoUrl!}
                            className={cn("w-full h-full object-cover transition-opacity duration-300", isPlaying ? "opacity-100" : "opacity-0 absolute inset-0")}
                            muted
                            playsInline
                            loop
                        />
                        <div className={cn("w-full h-full absolute inset-0 bg-gray-50 flex items-center justify-center transition-opacity duration-300", isPlaying ? "opacity-0" : "opacity-100")}>
                            {/* Static Image or Placeholder */}
                            {teacherProfile.profilePhotoUrl && !imgError ? (
                                <Image
                                    src={teacherProfile.profilePhotoUrl}
                                    alt={teacherProfile.displayName || "Teacher"}
                                    fill
                                    className="object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <User className="w-16 h-16 text-gray-300" />
                            )}
                            {/* Play Icon Overlay */}
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <Video className="w-3.5 h-3.5 fill-current" />
                                    <span className="font-medium">فيديو تعريفي</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full relative bg-gray-50 flex items-center justify-center">
                        {teacherProfile.profilePhotoUrl && !imgError ? (
                            <Image
                                src={teacherProfile.profilePhotoUrl}
                                alt={teacherProfile.displayName || "Teacher"}
                                fill
                                className="object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-gray-300">
                                <User className="w-16 h-16" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        {/* Name (Primary) */}
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg sm:text-xl text-gray-900 leading-tight">
                                {teacherProfile.displayName || "معلم منصة سدرة"}
                            </h3>
                            {/* Verified Badge - Only show for approved teachers */}
                            {isVerified && (
                                <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />
                            )}
                        </div>

                        {/* Subject (Secondary) */}
                        <p className="text-primary font-medium text-sm">
                            {subject.nameAr}
                        </p>

                        {/* Experience (Optional) */}
                        {teacherProfile.yearsOfExperience && (
                            <p className="text-xs text-gray-500">
                                {teacherProfile.yearsOfExperience} سنوات خبرة
                            </p>
                        )}
                    </div>

                    {/* Rating (Top Left) */}
                    <div className="shrink-0">
                        {!isRecentlyJoined ? (
                            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="font-bold text-sm text-amber-700 font-english">{teacherProfile.averageRating.toFixed(1)}</span>
                                <span className="text-xs text-amber-600/60">({teacherProfile.totalReviews})</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20">
                                <UserPlus className="w-3.5 h-3.5 text-accent-dark" />
                                <span className="text-xs text-accent-dark font-medium">{TEACHER_STATUS_LABELS.RECENTLY_JOINED}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row justify-between items-end gap-4 h-full">
                    {/* Price & Availability */}
                    <div className="space-y-3 w-full sm:w-auto">
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-gray-900 font-english">{formattedPrice}</span>
                                <span className="text-xs text-gray-500 font-medium">SDG / الساعة</span>
                            </div>
                        </div>

                        {/* Next Availability */}
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100/50 w-full sm:w-auto justify-center sm:justify-start">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                                {nextAvailableSlot ? `متاح ${nextAvailableSlot.display}` : 'المواعيد متاحة في الملف'}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 w-full sm:w-auto pt-2 sm:pt-0">
                        <Button
                            variant="default"
                            className="flex-1 sm:flex-none min-w-[120px] shadow-sm shadow-primary/20"
                            onClick={(e) => {
                                e.stopPropagation();
                                onBook(teacher);
                            }}
                        >
                            حجز حصة
                        </Button>
                        <Button
                            variant="ghost"
                            className="flex-1 sm:flex-none text-gray-600 hover:text-primary hover:bg-primary/5"
                            asChild
                        >
                            <Link href={`/teachers/${teacherProfile.slug || teacherProfile.id}`}>
                                عرض الملف
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
