import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TeacherPublicProfile, marketplaceApi } from '@/lib/api/marketplace';
import { MultiStepBookingModal } from '@/components/booking/MultiStepBookingModal';
import { Button } from '@/components/ui/button';
import { getFileUrl } from '@/lib/api/upload';
import { cn } from '@/lib/utils';
import {
    ArrowRight, Star, GraduationCap, Clock, CheckCircle,
    Calendar, MessageSquare, ChevronDown, Sparkles,
    ShieldCheck, Play, Users, Sun, Sunset, Moon, Gift, Share,
    Award, BookOpen, Building2, Video, BookMarked, Layers, DollarSign, Palmtree,
    UserPlus
} from 'lucide-react';
import { ShareModal } from '../ShareModal';
import { FavoriteButton } from '../FavoriteButton';
import { toast } from 'sonner';
import {
    isRecentlyJoinedTeacher,
    isVerifiedTeacher,
    TEACHER_STATUS_LABELS
} from '@/config/teacher-status';

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
    slug?: string;
    onBook?: () => void; // Optional callback override
}

// --- Empty State Component ---
const EmptyState = ({ message, isPreview }: { message: string, isPreview: boolean }) => {
    if (!isPreview) return null;
    return (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <p className="text-text-subtle font-medium">{message}</p>
        </div>
    );
};

export function TeacherProfileView({ teacher, mode, onBook, slug }: TeacherProfileViewProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
        teacher.subjects.length > 0 ? teacher.subjects[0].subject.id : null
    );
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState<string>('single');
    const [ratings, setRatings] = useState<any[]>([]);
    const [ratingsLoading, setRatingsLoading] = useState(false);
    const [showAllRatings, setShowAllRatings] = useState(false);
    const [hasNavigationHistory, setHasNavigationHistory] = useState(false);

    const isPreview = mode === 'preview';
    const isPublic = mode === 'public';

    // Check if user has navigation history (didn't land directly on this page)
    useEffect(() => {
        // Check if there's a previous page in the history stack
        // window.history.length > 1 means there's history, but we need to be smarter
        // If user came from external site, document.referrer will be empty or from different domain
        const referrer = document.referrer;
        const currentDomain = window.location.origin;
        const hasHistory = !!(referrer && referrer.startsWith(currentDomain));
        setHasNavigationHistory(hasHistory);
    }, []);

    // Fetch ratings for public view
    useEffect(() => {
        if (isPublic && teacher.totalReviews > 0) {
            setRatingsLoading(true);
            marketplaceApi.getTeacherRatings(teacher.id, 1, 10)
                .then(response => {
                    setRatings(response.ratings);
                })
                .catch(error => {
                    console.error('Failed to load ratings:', error);
                })
                .finally(() => {
                    setRatingsLoading(false);
                });
        }
    }, [teacher.id, teacher.totalReviews, isPublic]);

    const handleBookClick = () => {
        if (isPreview) {
            toast.info('الحجز غير متاح في وضع المعاينة');
            return;
        }
        setIsModalOpen(true);
    };

    // --- Empty States for Preview ---
    // Moved outside to fix lint error

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

            {/* Hero Section - Warm gradient background for entire hero */}
            <div className="bg-gradient-to-b from-cream-light via-secondary/10 to-background">
                <div className="container mx-auto px-4">
                    {/* Back Link */}
                    {isPublic && hasNavigationHistory && (
                        <div className="pt-4 pb-2">
                            <button
                                onClick={() => router.back()}
                                className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                            >
                                <ArrowRight className="w-4 h-4" />
                                رجوع للبحث
                            </button>
                        </div>
                    )}

                    {/* Main Profile Content */}
                    <div className="py-8 md:py-10">
                        <div className="flex flex-col md:flex-row-reverse items-center md:items-start gap-8 max-w-4xl mx-auto">

                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-32 h-32 md:w-40 md:h-40 relative">
                                    {teacher.profilePhotoUrl ? (
                                        <img
                                            src={getFileUrl(teacher.profilePhotoUrl)}
                                            alt={teacher.displayName || 'صورة المعلم'}
                                            className="w-full h-full rounded-2xl object-cover shadow-xl ring-4 ring-white"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-5xl md:text-6xl shadow-xl ring-4 ring-white">
                                            {teacher.displayName ? teacher.displayName.charAt(0) : 'م'}
                                        </div>
                                    )}
                                    {/* Online Indicator */}
                                    {!teacher.isOnVacation && (
                                        <div className="absolute -bottom-2 -left-2 bg-green-500 w-6 h-6 md:w-7 md:h-7 rounded-full ring-4 ring-white shadow-lg flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info Content */}
                            <div className="flex-grow text-center md:text-right space-y-4">
                                {/* Row 1: Name + Verified Badge */}
                                <div className="flex flex-col md:flex-row items-center md:items-center gap-3">
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                        {teacher.displayName || (isPreview ? 'الاسم الظاهر' : 'معلم سدرة')}
                                    </h1>
                                    {teacher.applicationStatus === 'APPROVED' && (
                                        <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                            <ShieldCheck className="w-4 h-4" />
                                            موثق
                                        </span>
                                    )}
                                </div>

                                {/* Row 2: Qualification */}
                                {(teacher.qualifications && teacher.qualifications.length > 0) ? (
                                    <p className="text-gray-600 text-lg">
                                        <span className="font-medium">{teacher.qualifications[0].degreeName}</span>
                                        {teacher.qualifications[0].institution && (
                                            <span className="text-gray-400"> • {teacher.qualifications[0].institution}</span>
                                        )}
                                    </p>
                                ) : teacher.education ? (
                                    <p className="text-gray-600 text-lg font-medium">{teacher.education}</p>
                                ) : null}

                                {/* Row 3: Subject Tags */}
                                {teacher.subjects.length > 0 && (
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                        {teacher.subjects.slice(0, 4).map(s => (
                                            <span
                                                key={s.id}
                                                className="inline-flex items-center gap-1.5 bg-white/80 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm"
                                            >
                                                <BookOpen className="w-3.5 h-3.5 text-primary" />
                                                {s.subject.nameAr}
                                            </span>
                                        ))}
                                        {teacher.subjects.length > 4 && (
                                            <span className="inline-flex items-center bg-white/60 text-gray-500 px-3 py-1.5 rounded-full text-sm font-medium">
                                                +{teacher.subjects.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Row 4: Stats - Clean inline layout */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-gray-600">
                                    {/* Rating or New Badge */}
                                    {!isRecentlyJoinedTeacher(teacher.totalReviews) ? (
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-5 h-5 text-accent fill-current" />
                                            <span className="font-bold text-gray-900 text-base">{teacher.averageRating.toFixed(1)}</span>
                                            <span className="text-gray-400">({teacher.totalReviews} تقييم)</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-accent-dark">
                                            <Sparkles className="w-5 h-5" />
                                            <span className="font-bold">{TEACHER_STATUS_LABELS.RECENTLY_JOINED}</span>
                                        </div>
                                    )}

                                    {teacher.totalSessions > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4" />
                                            <span>{teacher.totalSessions}+ طالب</span>
                                        </div>
                                    )}

                                    {teacher.yearsOfExperience && teacher.yearsOfExperience > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            <span>{teacher.yearsOfExperience}+ سنة خبرة</span>
                                        </div>
                                    )}
                                </div>

                                {/* Row 5: Action Buttons + Status */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                                    {/* Availability Status */}
                                    {teacher.isOnVacation ? (
                                        <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-bold text-sm">
                                            <Palmtree className="w-4 h-4" />
                                            في إجازة
                                            {teacher.vacationEndDate && (
                                                <span className="font-normal opacity-80">
                                                    • يعود {new Date(teacher.vacationEndDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-sm">
                                            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                                            متاح للحجز
                                        </span>
                                    )}

                                    {/* Price */}
                                    {teacher.subjects.length > 0 && (
                                        <span className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-full font-bold text-sm shadow-sm">
                                            <DollarSign className="w-4 h-4 text-primary" />
                                            يبدأ من {Math.min(...teacher.subjects.map(s => Number(s.pricePerHour)))} SDG
                                        </span>
                                    )}

                                    {/* Action Buttons */}
                                    {!isPreview && (
                                        <FavoriteButton
                                            teacherId={teacher.id}
                                            initialIsFavorited={teacher.isFavorited}
                                            className="bg-white hover:bg-gray-50 shadow-sm w-10 h-10 rounded-full"
                                        />
                                    )}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="bg-white hover:bg-gray-50 shadow-sm w-10 h-10 rounded-full"
                                        onClick={() => setIsShareModalOpen(true)}
                                    >
                                        <Share className="w-4 h-4 text-gray-600" />
                                    </Button>
                                </div>
                            </div>
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
                                                id: 'demo', type: 'DEMO', title: 'حصة تجريبية',
                                                description: 'مدة 15 دقيقة للتعارف وتحديد المستوى',
                                                price: 0, badge: 'مجاناً'
                                            });
                                        }

                                        // Single
                                        options.push({
                                            id: 'single', type: 'SINGLE', title: 'حصة واحدة',
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
                                                    title: `باقة ${tier.sessionCount} حصص`,
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
                                        isPreview ? <EmptyState message="ستظهر باقاتك هنا بعد إنشائها واعتمادها." isPreview={isPreview} /> : <p className="text-text-subtle text-center">لا توجد باقات متاحة حالياً</p>
                                    )}
                                </div>

                                <div className="mt-8">
                                    {teacher.isOnVacation ? (
                                        <>
                                            <Button
                                                className="w-full bg-amber-500 text-white font-bold py-6 text-lg cursor-not-allowed opacity-80"
                                                disabled={true}
                                            >
                                                <Palmtree className="w-5 h-5 ml-2" />
                                                المعلم في إجازة
                                            </Button>
                                            {teacher.vacationEndDate && (
                                                <p className="text-center text-sm text-amber-700 mt-3 bg-amber-50 py-2 px-3 rounded-lg flex items-center justify-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    يعود في {new Date(teacher.vacationEndDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-6 text-lg shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
                                                onClick={handleBookClick}
                                                disabled={isPreview || teacher.subjects.length === 0}
                                            >
                                                احجز الآن
                                            </Button>
                                            <p className="text-center text-[10px] text-gray-400 mt-4 mb-2 flex items-center justify-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                ضمان استرداد المبلغ بالكامل في حال عدم الرضا
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Teacher Details */}
                    <div className="flex-grow space-y-8">
                        {/* Intro Video */}
                        {teacher.introVideoUrl ? (
                            <section className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <Video className="w-5 h-5" />
                                    فيديو تعريفي
                                </h2>
                                <div className="relative rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                                    <video
                                        src={getFileUrl(teacher.introVideoUrl)}
                                        controls
                                        className="absolute top-0 left-0 w-full h-full object-cover"
                                        poster={teacher.profilePhotoUrl ? getFileUrl(teacher.profilePhotoUrl) : undefined}
                                    >
                                        متصفحك لا يدعم تشغيل الفيديو
                                    </video>
                                </div>
                                <p className="text-xs text-text-subtle mt-3 text-center">
                                    شاهد المعلم يتحدث عن نفسه وأسلوبه في التدريس
                                </p>
                            </section>
                        ) : isPreview && (
                            <section className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <Video className="w-5 h-5" />
                                    فيديو تعريفي
                                </h2>
                                <EmptyState message="أضف فيديو تعريفي لتعريف الطلاب بنفسك وأسلوبك في التدريس." isPreview={isPreview} />
                            </section>
                        )}

                        {/* Bio */}
                        {teacher.bio ? (
                            <section className="bg-surface p-6 rounded-xl border border-gray-100">
                                <h2 className="text-xl font-bold text-primary mb-4">نبذة عني</h2>
                                <p className="text-text-main leading-relaxed whitespace-pre-line">{teacher.bio}</p>
                            </section>
                        ) : isPreview && (
                            <section className="bg-surface p-6 rounded-xl border border-gray-100">
                                <h2 className="text-xl font-bold text-primary mb-4">نبذة عني</h2>
                                <EmptyState message="هنا ستظهر نبذة عنك بعد أن تقوم بكتابتها." isPreview={isPreview} />
                            </section>
                        )}

                        {/* Academic Qualifications */}
                        {teacher.qualifications && teacher.qualifications.length > 0 ? (
                            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                                <h2 className="text-xl font-bold text-primary mb-5 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5" />
                                    المؤهلات الأكاديمية
                                </h2>
                                <div className="space-y-4">
                                    {teacher.qualifications.map((qual, index) => (
                                        <div key={qual.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Award className="w-5 h-5 text-accent flex-shrink-0" />
                                                        <h3 className="font-bold text-gray-900 text-lg">{qual.degreeName}</h3>
                                                        {qual.verified && (
                                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                                <ShieldCheck className="w-3 h-3" />
                                                                موثق
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5 pr-7">
                                                        <div className="flex items-center gap-2 text-text-subtle">
                                                            <Building2 className="w-4 h-4 flex-shrink-0" />
                                                            <span className="font-medium">{qual.institution}</span>
                                                        </div>
                                                        {qual.fieldOfStudy && (
                                                            <div className="flex items-center gap-2 text-text-subtle">
                                                                <BookOpen className="w-4 h-4 flex-shrink-0" />
                                                                <span>{qual.fieldOfStudy}</span>
                                                            </div>
                                                        )}
                                                        {qual.graduationYear && (
                                                            <div className="flex items-center gap-2 text-text-subtle text-sm">
                                                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                                                <span>
                                                                    {qual.status === 'GRADUATED' ? `تخرج عام ${qual.graduationYear}` :
                                                                        qual.status === 'IN_PROGRESS' ? `متوقع ${qual.graduationYear}` :
                                                                            `${qual.graduationYear}`}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {teacher.yearsOfExperience && teacher.yearsOfExperience > 0 && (
                                    <div className="mt-5 pt-5 border-t border-blue-100">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Clock className="w-5 h-5" />
                                            <span className="font-bold">{teacher.yearsOfExperience}+ سنوات من الخبرة في التدريس</span>
                                        </div>
                                    </div>
                                )}
                            </section>
                        ) : isPreview && (
                            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5" />
                                    المؤهلات الأكاديمية
                                </h2>
                                <EmptyState message="ستظهر مؤهلاتك الأكاديمية هنا بعد إضافتها." isPreview={isPreview} />
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
                                <EmptyState message="في هذه المنطقة سيظهر أسلوبك في التدريس بعد اختياره." isPreview={isPreview} />
                            </section>
                        )}

                        {/* Subjects */}
                        {teacher.subjects.length > 0 ? (
                            <section className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100">
                                <h2 className="text-xl font-bold text-primary mb-5 flex items-center gap-2">
                                    <BookMarked className="w-5 h-5" />
                                    المواد والأسعار
                                </h2>
                                <div className="grid gap-4">
                                    {teacher.subjects.map(s => (
                                        <div
                                            key={s.id}
                                            className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
                                        >
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                {/* Subject Info */}
                                                <div className="flex-grow space-y-3">
                                                    {/* Subject Name & Curriculum */}
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                            <BookOpen className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div className="flex-grow">
                                                            <h3 className="font-bold text-gray-900 text-lg mb-1">{s.subject.nameAr}</h3>
                                                            <div className="flex items-center gap-2 text-sm text-text-subtle">
                                                                <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                                                                <span className="font-medium">{s.curriculum.nameAr}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Grades */}
                                                    {s.grades && s.grades.length > 0 ? (
                                                        <div className="pr-[52px]">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {formatGradesDisplay(s.grades)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="pr-[52px]">
                                                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                                                                <CheckCircle className="w-3 h-3" />
                                                                جميع الصفوف
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Price */}
                                                <div className="sm:text-left shrink-0 pr-[52px] sm:pr-0">
                                                    <div className="inline-flex flex-col items-end bg-gradient-to-br from-primary/10 to-accent/10 px-4 py-3 rounded-lg border border-primary/20">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <DollarSign className="w-4 h-4 text-primary" />
                                                            <span className="text-2xl font-bold text-primary">{s.pricePerHour}</span>
                                                            <span className="text-sm font-medium text-primary">SDG</span>
                                                        </div>
                                                        <span className="text-xs text-text-subtle">للحصة الواحدة (60 دقيقة)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Value Proposition Footer */}
                                <div className="mt-5 pt-5 border-t border-emerald-100">
                                    <div className="flex items-start gap-2 text-sm text-text-subtle">
                                        <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                        <p className="leading-relaxed">
                                            جميع الأسعار شاملة المنصة والمتابعة. الباقات متوفرة بخصومات خاصة.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        ) : isPreview ? (
                            <section className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <BookMarked className="w-5 h-5" />
                                    المواد والأسعار
                                </h2>
                                <EmptyState message="ستظهر المواد الدراسية هنا بعد إضافتها." isPreview={isPreview} />
                            </section>
                        ) : null}

                        {/* Schedule */}
                        {teacher.availability.length > 0 ? (
                            <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 rounded-xl border border-orange-100">
                                <h2 className="text-xl font-bold text-primary mb-5 flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    جدول الأوقات المتاحة
                                </h2>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                                                    <th className="py-4 px-3 text-right font-bold text-gray-700 w-24 border-b border-gray-200">
                                                        <Calendar className="w-4 h-4 inline ml-1" />
                                                        اليوم
                                                    </th>
                                                    <th className="py-4 px-4 text-center border-b border-r border-gray-200">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                                                                <Sun className="w-5 h-5 text-white" />
                                                            </div>
                                                            <span className="font-bold text-gray-900">صباحاً</span>
                                                            <span className="text-xs text-text-subtle font-medium">6 ص - 12 م</span>
                                                        </div>
                                                    </th>
                                                    <th className="py-4 px-4 text-center border-b border-r border-gray-200">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
                                                                <Sunset className="w-5 h-5 text-white" />
                                                            </div>
                                                            <span className="font-bold text-gray-900">بعد الظهر</span>
                                                            <span className="text-xs text-text-subtle font-medium">12 م - 5 م</span>
                                                        </div>
                                                    </th>
                                                    <th className="py-4 px-4 text-center border-b border-gray-200">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center shadow-sm">
                                                                <Moon className="w-5 h-5 text-white" />
                                                            </div>
                                                            <span className="font-bold text-gray-900">مساءً</span>
                                                            <span className="text-xs text-text-subtle font-medium">5 م - 11 م</span>
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((dayKey, index) => {
                                                    const daySlots = teacher.availability.filter(s => s.dayOfWeek === dayKey);
                                                    const hasMorning = daySlots.some(s => getTimePeriod(s.startTime) === 'morning');
                                                    const hasAfternoon = daySlots.some(s => getTimePeriod(s.startTime) === 'afternoon');
                                                    const hasEvening = daySlots.some(s => getTimePeriod(s.startTime) === 'evening');
                                                    const hasAny = daySlots.length > 0;

                                                    return (
                                                        <tr
                                                            key={dayKey}
                                                            className={cn(
                                                                "transition-all hover:bg-gray-50",
                                                                index !== 6 && "border-b border-gray-100",
                                                                !hasAny && "opacity-40"
                                                            )}
                                                        >
                                                            <td className="py-4 px-3 font-bold text-gray-900 bg-gray-50/50">
                                                                {DAY_LABELS[dayKey]}
                                                            </td>
                                                            <td className="py-4 px-4 text-center border-r border-gray-100">
                                                                {hasMorning ? (
                                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300 shadow-sm">
                                                                        <CheckCircle className="w-5 h-5 text-amber-700" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                                                                        <span className="text-gray-400 text-lg">—</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-4 text-center border-r border-gray-100">
                                                                {hasAfternoon ? (
                                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 border border-orange-300 shadow-sm">
                                                                        <CheckCircle className="w-5 h-5 text-orange-700" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                                                                        <span className="text-gray-400 text-lg">—</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                {hasEvening ? (
                                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 border border-indigo-300 shadow-sm">
                                                                        <CheckCircle className="w-5 h-5 text-indigo-700" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                                                                        <span className="text-gray-400 text-lg">—</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="mt-5 pt-5 border-t border-orange-100 space-y-3">
                                    <div className="flex items-start gap-2 text-sm text-text-subtle">
                                        <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                        <p className="leading-relaxed">
                                            الجدول يوضح الأوقات العامة المتاحة. الأوقات المحددة والمواعيد الدقيقة تظهر عند اختيار موعد الحجز.
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs bg-white/60 py-2 px-4 rounded-lg border border-orange-200/50">
                                        <Clock className="w-3.5 h-3.5 text-primary" />
                                        <span className="font-medium text-gray-700">جميع الأوقات بتوقيت السودان (CAT)</span>
                                    </div>
                                </div>
                            </section>
                        ) : isPreview ? (
                            <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 rounded-xl border border-orange-100">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    جدول الأوقات المتاحة
                                </h2>
                                <EmptyState message="ستظهر أوقاتك المتاحة هنا بعد تحديدها." isPreview={isPreview} />
                            </section>
                        ) : null}

                        {/* Ratings */}
                        {isPublic && teacher.totalReviews > 0 ? (
                            <section className="bg-surface p-6 rounded-xl border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5" />
                                        تقييمات الطلاب ({teacher.totalReviews})
                                    </h2>
                                    <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full">
                                        <Star className="w-5 h-5 text-accent fill-current" />
                                        <span className="text-2xl font-bold text-accent">{teacher.averageRating.toFixed(1)}</span>
                                    </div>
                                </div>

                                {ratingsLoading ? (
                                    <div className="text-center py-8 text-text-subtle">جاري تحميل التقييمات...</div>
                                ) : ratings.length > 0 ? (
                                    <>
                                        <div className="space-y-4">
                                            {(showAllRatings ? ratings : ratings.slice(0, 3)).map((rating: any) => (
                                                <div key={rating.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                                {rating.raterType === 'PARENT' ? 'و' : 'ط'}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {rating.raterType === 'PARENT' ? 'ولي أمر' : 'طالب'}
                                                                </p>
                                                                <p className="text-xs text-text-subtle">
                                                                    {new Date(rating.createdAt).toLocaleDateString('ar-EG', {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <Star
                                                                    key={star}
                                                                    className={cn(
                                                                        "w-4 h-4",
                                                                        star <= rating.score
                                                                            ? "text-accent fill-current"
                                                                            : "text-gray-300"
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {rating.comment && (
                                                        <p className="text-text-main text-sm leading-relaxed pr-12">
                                                            {rating.comment}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {ratings.length > 3 && !showAllRatings && (
                                            <button
                                                onClick={() => setShowAllRatings(true)}
                                                className="w-full mt-4 py-2 text-primary hover:text-primary-hover font-medium text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                عرض جميع التقييمات ({ratings.length})
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-center text-text-subtle py-8">لا توجد تعليقات بعد</p>
                                )}
                            </section>
                        ) : isPreview && (
                            <section className="bg-surface p-6 rounded-xl border border-gray-100">
                                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    تقييمات الطلاب
                                </h2>
                                <EmptyState message="ستظهر تقييمات الطلاب هنا بعد إكمال الحصص الأولى." isPreview={isPreview} />
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            <MultiStepBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teacherId={teacher.id}
                teacherName={teacher.displayName || 'معلم سدرة'}
                teacherSubjects={teacher.subjects.map(s => ({
                    id: s.subject.id,
                    name: s.subject.nameAr,
                    price: Number(s.pricePerHour)
                }))}
                initialSubjectId={selectedSubjectId || undefined}
                initialOptionId={selectedOptionId}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                teacherName={teacher.displayName || 'معلم سدرة'}
                teacherSlug={slug || teacher.id}
                bio={teacher.bio || undefined}
            />
        </div>
    );
}
