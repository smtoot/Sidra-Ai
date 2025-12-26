import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeacherPublicProfile } from '@/lib/api/marketplace';
import { CreateBookingModal } from '@/components/booking/CreateBookingModal';
import { Button } from '@/components/ui/button';
import { getFileUrl } from '@/lib/api/upload';
import { cn } from '@/lib/utils';
import {
    ArrowRight, Star, GraduationCap, Clock, CheckCircle,
    Calendar, MessageSquare, ChevronDown, Sparkles,
    ShieldCheck, Play, Users, Sun, Sunset, Moon, Gift, Share
} from 'lucide-react';
import { ShareModal } from '../ShareModal';
import { FavoriteButton } from '../FavoriteButton';
import { toast } from 'sonner';

// --- Helper Functions & Constants ---
const DAY_LABELS: Record<string, string> = {
    SUNDAY: 'الأحد',
    MONDAY: 'الإثنين',
    TUESDAY: 'الثلاثاء',
    WEDNESDAY: 'الأربعاء',
    THURSDAY: 'الخميس',
    FRIDAY: 'الجمعة',
    SATURDAY: 'السبت'
};

function getTimePeriod(startTime: string): 'morning' | 'afternoon' | 'evening' {
    const hour = parseInt(startTime.split(':')[0], 10);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
}

interface GradeInfo {
    id: string;
    nameAr: string;
    stageNameAr?: string;
}

function formatGradesDisplay(grades: GradeInfo[]) {
    if (!grades || grades.length === 0) {
        return <span className="text-xs text-text-subtle">جميع الصفوف</span>;
    }

    const gradesByStage: Record<string, GradeInfo[]> = {};
    grades.forEach(grade => {
        const stageName = grade.stageNameAr || 'أخرى';
        if (!gradesByStage[stageName]) {
            gradesByStage[stageName] = [];
        }
        gradesByStage[stageName].push(grade);
    });

    const displayItems: React.ReactElement[] = [];
    Object.entries(gradesByStage).forEach(([stageName, stageGrades]) => {
        if (stageGrades.length >= 3 && stageName !== 'أخرى') {
            displayItems.push(
                <span key={stageName} className="text-xs text-white bg-primary px-2 py-0.5 rounded-full font-medium">
                    {stageName}
                </span>
            );
        } else {
            stageGrades.forEach(grade => {
                displayItems.push(
                    <span key={grade.id} className="text-xs text-text-subtle bg-white px-1.5 py-0.5 rounded border border-gray-200">
                        {grade.nameAr}
                    </span>
                );
            });
        }
    });

    return <>{displayItems}</>;
}

// --- Types ---
type SessionOption = {
    id: string;
    type: 'DEMO' | 'SINGLE' | 'PACKAGE';
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    savings?: string;
    badge?: string;
    tierId?: string;
};

interface TeacherProfileViewProps {
    teacher: TeacherPublicProfile;
    mode: 'public' | 'preview' | 'admin';
    onBook?: () => void; // Optional callback override
}

export function TeacherProfileView({ teacher, mode, onBook }: TeacherProfileViewProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
        teacher.subjects.length > 0 ? teacher.subjects[0].subject.id : null
    );
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState<string>('single');

    // Ratings dummy state management (since we don't have separate ratings logic here yet)
    // The main page handles ratings logic separately? 
    // For now, we only display ratings if present in `teacher` (which we might map or pass)
    // But TeacherPublicProfile interface maps only stats, not the ratings list.
    // The public page fetches ratings separately.
    // For this refactor, we will focus on the main profile structure. 
    // The ratings section will show empty state or passed ratings if we extend the type.

    const isPreview = mode === 'preview';
    const isPublic = mode === 'public';

    const handleBookClick = () => {
        if (isPreview) {
            toast.info('الحجز غير متاح في وضع المعاينة');
            return;
        }
        setIsModalOpen(true);
    };

    // --- Empty States for Preview ---
    const EmptyState = ({ message }: { message: string }) => {
        if (!isPreview) return null;
        return (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <p className="text-text-subtle font-medium">{message}</p>
            </div>
        );
    };

    return (
        <div className="bg-background font-tajawal min-h-screen" dir="rtl">
            {/* Preview Banner */}
            {isPreview && (
                <div className="sticky top-0 z-50 bg-amber-500 text-white px-4 py-3 text-center shadow-lg">
                    <p className="font-bold text-sm md:text-base">
                        هذه معاينة لكيفية ظهور ملفك للطلاب. قد تتغير بعض البيانات (مثل الباقات) بعد الاعتماد.
                    </p>
                </div>
            )}

            {/* Header - Centered Hero */}
            <div className="bg-gradient-to-br from-cream-light to-secondary/30 py-12">
                <div className="container mx-auto px-4">
                    {/* Back Link (Only Public) */}
                    {isPublic && (
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
                        >
                            <ArrowRight className="w-4 h-4" />
                            رجوع
                        </button>
                    )}

                    {/* Centered Teacher Info */}
                    <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="w-32 h-32 md:w-40 md:h-40 relative mb-4">
                            {teacher.profilePhotoUrl ? (
                                <img
                                    src={getFileUrl(teacher.profilePhotoUrl)}
                                    alt={teacher.displayName || 'صورة المعلم'}
                                    className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-5xl border-4 border-white shadow-lg">
                                    {teacher.displayName ? teacher.displayName.charAt(0) : 'م'}
                                </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white" title="متاح" />
                        </div>

                        {/* Name & Title */}
                        <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                            {teacher.displayName || (isPreview ? 'الاسم الظاهر' : 'معلم سدرة')}
                            {teacher.applicationStatus === 'APPROVED' && (
                                <ShieldCheck className="w-6 h-6 text-blue-500" fill="currentColor" stroke="white" />
                            )}
                        </h1>
                        <p className="text-text-subtle text-lg lg:text-xl font-medium mb-4">
                            {teacher.education || (isPreview ? 'المؤهل العلمي' : 'مؤهل غير محدد')}
                        </p>

                        {/* Trust Signals & Badges */}
                        <div className="flex flex-wrap justify-center gap-3 text-sm">
                            {/* Rating / New Teacher Badge */}
                            {teacher.totalReviews >= 5 ? (
                                <div className="flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                                    <Star className="w-4 h-4 text-accent fill-current" />
                                    <span className="font-bold">{teacher.averageRating.toFixed(1)}</span>
                                    <span className="text-text-subtle">({teacher.totalReviews} تقييم)</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 bg-accent/10 text-accent-dark px-3 py-1.5 rounded-full shadow-sm border border-accent/20">
                                    <Sparkles className="w-4 h-4 fill-current" />
                                    <span className="font-bold">معلم جديد</span>
                                </div>
                            )}

                            {/* Students Count */}
                            <div className="flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                                <Users className="w-4 h-4 text-primary" />
                                <span>{Math.max(teacher.totalSessions, 0)}+ طالب</span>
                            </div>

                            {/* Verified Badge */}
                            {teacher.applicationStatus === 'APPROVED' && (
                                <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full shadow-sm border border-green-100">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>معلم موثق</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-6">
                            {!isPreview && (
                                <FavoriteButton
                                    teacherId={teacher.id}
                                    initialIsFavorited={teacher.isFavorited}
                                    className="bg-white/90 hover:bg-white shadow-sm border border-gray-100 w-10 h-10 ring-1 ring-gray-200"
                                />
                            )}
                            <Button
                                variant="outline"
                                className="bg-white/90 hover:bg-white shadow-sm border border-gray-100 gap-2 rounded-full ring-1 ring-gray-200"
                                onClick={() => setIsShareModalOpen(true)}
                            >
                                <Share className="w-4 h-4" />
                                <span>مشاركة</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - Two Column Layout */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row-reverse gap-8 items-start">
                    {/* Left Sidebar - Sticky Booking Card */}
                    <div className="lg:w-[360px] shrink-0 lg:sticky lg:top-6 self-start">
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">اختر باقتك التعليمية</h3>

                                {/* Subject Selector */}
                                {teacher.subjects.length > 1 && (
                                    <div className="mb-6">
                                        <label className="block text-xs text-text-subtle mb-2">اختر المادة والمنهج:</label>
                                        <select
                                            value={selectedSubjectId || ''}
                                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-1 focus:ring-primary outline-none"
                                        >
                                            {teacher.subjects.map(s => (
                                                <option key={s.subject.id} value={s.subject.id}>
                                                    {s.subject.nameAr} - {s.curriculum.nameAr}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Options */}
                                <div className="space-y-4">
                                    {teacher.subjects.length > 0 ? (() => {
                                        const selectedSubject = teacher.subjects.find(s => s.subject.id === (selectedSubjectId || teacher.subjects[0]?.subject.id));
                                        const basePrice = selectedSubject ? Number(selectedSubject.pricePerHour) : 0;
                                        const options: SessionOption[] = [];

                                        // Demo
                                        if (teacher.globalSettings.demosEnabled && teacher.teacherSettings.demoEnabled) {
                                            options.push({
                                                id: 'demo', type: 'DEMO', title: 'جلسة تجريبية',
                                                description: 'مدة 15 دقيقة للتعارف وتحديد المستوى',
                                                price: 0, badge: 'مجاناً'
                                            });
                                        }

                                        // Single
                                        options.push({
                                            id: 'single', type: 'SINGLE', title: 'جلسة واحدة',
                                            description: 'حصة كاملة لمدة 60 دقيقة',
                                            price: basePrice
                                        });

                                        // Packages
                                        if (teacher.globalSettings.packagesEnabled) {
                                            teacher.packageTiers.forEach((tier, index) => {
                                                const totalPrice = basePrice * tier.sessionCount;
                                                const discountedPrice = Math.round(totalPrice * (1 - tier.discountPercent / 100));
                                                options.push({
                                                    id: `package-${tier.id}`, type: 'PACKAGE',
                                                    title: `باقة ${tier.sessionCount} جلسات`,
                                                    description: `توفير ${tier.discountPercent}% . متابعة شاملة`,
                                                    price: discountedPrice, originalPrice: totalPrice,
                                                    savings: `وفر ${(totalPrice - discountedPrice).toFixed(0)} SDG`,
                                                    badge: index === 0 ? 'الأكثر طلباً' : undefined,
                                                    tierId: tier.id
                                                });
                                            });
                                        }

                                        return options.map((option) => (
                                            <div
                                                key={option.id}
                                                onClick={() => !isPreview && setSelectedOptionId(option.id)}
                                                className={cn(
                                                    "relative p-4 rounded-xl border-2 transition-all flex flex-col gap-1",
                                                    !isPreview && "cursor-pointer",
                                                    selectedOptionId === option.id
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-gray-100 hover:border-primary/30"
                                                )}
                                            >
                                                {option.badge && (
                                                    <div className="absolute -top-3 right-4 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                                                        {option.badge}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                                            selectedOptionId === option.id ? "border-primary" : "border-gray-300"
                                                        )}>
                                                            {selectedOptionId === option.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-900">{option.title}</span>
                                                                {option.type === 'DEMO' && (
                                                                    <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold">مجاناً</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        {option.type === 'DEMO' ? (
                                                            <Gift className="w-6 h-6 text-amber-500" />
                                                        ) : (
                                                            <div className="flex flex-col items-end">
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-xl font-bold text-primary">{option.price}</span>
                                                                    <span className="text-xs text-primary font-medium">SDG</span>
                                                                </div>
                                                                {option.originalPrice && (
                                                                    <span className="text-[10px] text-gray-400 line-through">
                                                                        {option.originalPrice} SDG
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="pr-8">
                                                    <p className="text-[11px] text-text-subtle leading-tight">{option.description}</p>
                                                </div>
                                            </div>
                                        ));
                                    })() : (
                                        isPreview ? <EmptyState message="ستظهر باقاتك هنا بعد إنشائها واعتمادها." /> : <p className="text-text-subtle text-center">لا توجد باقات متاحة حالياً</p>
                                    )}
                                </div>

                                <div className="mt-8">
                                    <Button
                                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-6 text-lg shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
                                        onClick={handleBookClick}
                                        disabled={isPreview || teacher.subjects.length === 0}
                                    >
                                        احجز الآن
                                    </Button>
                                    <p className="text-center text-[10px] text-gray-400 mt-4 flex items-center justify-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        ضمان استرداد المبلغ بالكامل في حال عدم الرضا
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Teacher Details */}
                    <div className="flex-grow space-y-8">
                        {/* Bio */}
                        {teacher.bio ? (
                            <section className="bg-surface p-6 rounded-xl border border-gray-100">
                                <h2 className="text-xl font-bold text-primary mb-4">نبذة عني</h2>
                                <p className="text-text-main leading-relaxed whitespace-pre-line">{teacher.bio}</p>
                            </section>
                        ) : isPreview && (
                            <section className="bg-surface p-6 rounded-xl border border-gray-100">
                                <h2 className="text-xl font-bold text-primary mb-4">نبذة عني</h2>
                                <EmptyState message="هنا ستظهر نبذة عنك بعد أن تقوم بكتابتها." />
                            </section>
                        )}

                        {/* Teaching Approach */}
                        {teacher.teachingApproach && (teacher.teachingApproach.text || teacher.teachingApproach.tags.length > 0) ? (
                            <section className="bg-gradient-to-br from-primary/5 to-secondary/5 p-6 rounded-xl border border-primary/10">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5" />
                                    أسلوبي في التدريس
                                </h2>
                                <div className="space-y-4">
                                    {teacher.teachingApproach.text && (
                                        <p className="text-text-main leading-relaxed whitespace-pre-line">
                                            {teacher.teachingApproach.text}
                                        </p>
                                    )}

                                    {teacher.teachingApproach.tags.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-text-subtle mb-2">مناسب للطلاب الذين:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {teacher.teachingApproach.tags.map(tag => (
                                                    <span key={tag.id} className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-200 text-text-main">
                                                        {tag.labelAr}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        ) : isPreview && (
                            <section className="bg-gradient-to-br from-primary/5 to-secondary/5 p-6 rounded-xl border border-primary/10">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5" />
                                    أسلوبي في التدريس
                                </h2>
                                <EmptyState message="في هذه المنطقة سيظهر أسلوبك في التدريس بعد اختياره." />
                            </section>
                        )}

                        {/* Subjects */}
                        <section className="bg-surface p-6 rounded-xl border border-gray-100">
                            <h2 className="text-xl font-bold text-primary mb-4">المواد والأسعار</h2>
                            <div className="space-y-3">
                                {teacher.subjects.map(s => (
                                    <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-lg gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-text-main">{s.subject.nameAr}</p>
                                                <span className="text-xs px-2 py-0.5 bg-white border rounded text-gray-500">{s.curriculum.nameAr}</span>
                                            </div>
                                            {s.grades && s.grades.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {formatGradesDisplay(s.grades)}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-text-subtle">جميع الصفوف</p>
                                            )}
                                        </div>
                                        <div className="text-left shrink-0">
                                            <p className="text-lg font-bold text-primary">{s.pricePerHour} SDG</p>
                                            <p className="text-xs text-text-subtle">/ الحصة</p>
                                        </div>
                                    </div>
                                ))}
                                {teacher.subjects.length === 0 && isPreview && (
                                    <EmptyState message="ستظهر المواد الدراسية هنا بعد إضافتها." />
                                )}
                                {teacher.subjects.length === 0 && !isPreview && (
                                    <p className="text-text-subtle text-center py-4">لم يتم إضافة مواد بعد</p>
                                )}
                            </div>
                        </section>

                        {/* Schedule */}
                        <section className="bg-surface p-6 rounded-xl border border-gray-100">
                            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                أوقات التدريس المفضلة
                            </h2>
                            {teacher.availability.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 px-2 text-right font-medium text-text-subtle w-20"></th>
                                                    <th className="py-3 px-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Sun className="w-5 h-5 text-amber-500" />
                                                            <span className="font-bold text-text-main">صباحاً</span>
                                                            <span className="text-xs text-text-subtle">قبل 12 م</span>
                                                        </div>
                                                    </th>
                                                    <th className="py-3 px-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Sunset className="w-5 h-5 text-orange-500" />
                                                            <span className="font-bold text-text-main">ظهراً</span>
                                                            <span className="text-xs text-text-subtle">12 - 5 م</span>
                                                        </div>
                                                    </th>
                                                    <th className="py-3 px-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Moon className="w-5 h-5 text-indigo-500" />
                                                            <span className="font-bold text-text-main">مساءً</span>
                                                            <span className="text-xs text-text-subtle">بعد 5 م</span>
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((dayKey) => {
                                                    const daySlots = teacher.availability.filter(s => s.dayOfWeek === dayKey);
                                                    const hasMorning = daySlots.some(s => getTimePeriod(s.startTime) === 'morning');
                                                    const hasAfternoon = daySlots.some(s => getTimePeriod(s.startTime) === 'afternoon');
                                                    const hasEvening = daySlots.some(s => getTimePeriod(s.startTime) === 'evening');
                                                    const hasAny = daySlots.length > 0;

                                                    return (
                                                        <tr key={dayKey} className={`border-b border-gray-50 ${!hasAny ? 'opacity-40' : ''}`}>
                                                            <td className="py-3 px-2 font-medium text-text-main">{DAY_LABELS[dayKey]}</td>
                                                            <td className="py-3 px-4 text-center">{hasMorning ? <CheckCircle className="w-5 h-5 text-amber-600 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                                                            <td className="py-3 px-4 text-center">{hasAfternoon ? <CheckCircle className="w-5 h-5 text-orange-600 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                                                            <td className="py-3 px-4 text-center">{hasEvening ? <CheckCircle className="w-5 h-5 text-indigo-600 mx-auto" /> : <span className="text-gray-300">—</span>}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-center text-xs text-text-subtle mt-4 bg-gray-50 py-2 rounded-lg">
                                        📅 الأوقات الدقيقة تظهر عند اختيار موعد الحجز
                                    </p>
                                </>
                            ) : (
                                isPreview ? <EmptyState message="ستظهر أوقاتك المتاحة هنا بعد تحديدها." /> : <p className="text-text-subtle text-center py-4">لم يتم تحديد أوقات بعد</p>
                            )}
                        </section>

                        {/* Ratings */}
                        {!isPublic && isPreview && (
                            <section className="bg-surface p-6 rounded-xl border border-gray-100">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    تقييمات الطلاب
                                </h2>
                                <EmptyState message="ستظهر تقييمات الطلاب هنا بعد إكمال الحصص الأولى." />
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            <CreateBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teacherId={teacher.id}
                teacherName={teacher.displayName || 'معلم سدرة'}
                teacherSubjects={teacher.subjects.map(s => ({
                    id: s.subject.id,
                    name: s.subject.nameAr,
                    price: Number(s.pricePerHour)
                }))}
                userRole="PARENT"
                initialSubjectId={selectedSubjectId || undefined}
                initialOptionId={selectedOptionId}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                teacherName={teacher.displayName || 'معلم سدرة'}
                teacherSlug={teacher.id} // Ideally use slug if available, but id works
                bio={teacher.bio || undefined}
            />
        </div>
    );
}
