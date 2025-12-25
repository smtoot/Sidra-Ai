import { SearchResult } from '@/lib/api/search';
import { Button } from '../ui/button';
import { Star, GraduationCap, Briefcase, MapPin } from 'lucide-react';
import Link from 'next/link';

interface TeacherCardProps {
    result: SearchResult;
    onBook?: (teacher: SearchResult) => void;
}

export default function TeacherCard({ result, onBook }: TeacherCardProps) {
    const { teacherProfile, subject, curriculum, pricePerHour } = result;

    return (
        <div className="bg-surface border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6 font-tajawal rtl">
            {/* Avatar Placeholder */}
            <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                    {teacherProfile.displayName ? teacherProfile.displayName.charAt(0) : 'T'}
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow space-y-3">
                <div className="flex justify-between items-start">
                    <div>
                        <Link href={`/teachers/${teacherProfile.slug || teacherProfile.id}`} className="hover:underline">
                            <h3 className="font-bold text-lg text-primary">
                                {teacherProfile.displayName || 'أستاذ مجهول'}
                            </h3>
                        </Link>
                        <p className="text-text-subtle text-sm flex items-center gap-1">
                            {teacherProfile.education || 'مؤهل غير محدد'}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 bg-sand/10 px-2 py-1 rounded text-accent text-sm font-bold">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{teacherProfile.averageRating.toFixed(1)}</span>
                        <span className="text-text-subtle font-normal">({teacherProfile.totalReviews})</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-text-muted">
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                        <Briefcase className="w-3 h-3" />
                        {teacherProfile.yearsOfExperience} سنوات خبرة
                    </span>
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                        <GraduationCap className="w-3 h-3" />
                        {subject.nameAr}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                        <MapPin className="w-3 h-3" />
                        {curriculum.nameAr}
                    </span>

                    {/* Grades Display in Search Card */}
                    {result.gradeLevels && result.gradeLevels.length > 0 && (
                        <div className="flex flex-wrap gap-1 px-1">
                            {result.gradeLevels.length > 3 ? (
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                    {result.gradeLevels.length} صفوف دراسية
                                </span>
                            ) : (
                                result.gradeLevels.map((g, idx) => (
                                    <span key={idx} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                        {g.nameAr}
                                    </span>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <p className="text-text-subtle text-sm line-clamp-2">
                    {teacherProfile.bio || 'لا توجد نبذة تعريفية.'}
                </p>
            </div>

            {/* Actions & Price */}
            <div className="flex flex-col justify-between items-end min-w-[140px] border-r border-gray-100 pr-6 gap-4">
                <div className="text-left w-full">
                    <p className="text-xs text-text-subtle">سعر الحصة</p>
                    <p className="text-xl font-bold text-primary">{pricePerHour} <span className="text-sm font-normal">SDG</span></p>
                </div>
                <div className="w-full space-y-2">
                    <Button
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold shadow-soft"
                        onClick={() => onBook?.(result)}
                    >
                        احجز الآن
                    </Button>
                    <Link href={`/teachers/${teacherProfile.slug || teacherProfile.id}`}>
                        <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5">
                            عرض الملف
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

