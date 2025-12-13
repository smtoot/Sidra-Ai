import { SearchResult } from '@/lib/api/search';
import { Button } from '../ui/button';
import { Star, GraduationCap, Briefcase, MapPin } from 'lucide-react';

interface TeacherCardProps {
    result: SearchResult;
}

export default function TeacherCard({ result }: TeacherCardProps) {
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
                        <h3 className="font-bold text-lg text-primary">
                            {teacherProfile.displayName || 'أستاذ مجهول'}
                        </h3>
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
                </div>

                <p className="text-text-subtle text-sm line-clamp-2">
                    {teacherProfile.bio || 'لا توجد نبذة تعريفية.'}
                </p>
            </div>

            {/* Actions & Price */}
            <div className="flex flex-col justify-between items-end min-w-[140px] border-r border-gray-100 pr-6 gap-4">
                <div className="text-left">
                    <p className="text-xs text-text-subtle">سعر الحصة</p>
                    <p className="text-xl font-bold text-primary">{pricePerHour} <span className="text-sm font-normal">SDG</span></p>
                </div>
                <Button className="w-full">
                    عرض الملف
                </Button>
            </div>
        </div>
    );
}
