'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '../OnboardingContext';
import {
    ArrowRight,
    Loader2,
    Rocket,
    Edit2,
    User,
    BookOpen,
    FileText,
    Check,
    X,
    GraduationCap,
    IdCard,
    Award,
    AlertCircle,
    Eye,
    Star,
    MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getFileUrl } from '@/lib/api/upload';
import { teacherApi } from '@/lib/api/teacher';

// Helper to get ID type label in Arabic
const getIdTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
        NATIONAL_ID: 'البطاقة الوطنية',
        PASSPORT: 'جواز السفر',
        DRIVER_LICENSE: 'رخصة القيادة',
        RESIDENT_PERMIT: 'تصريح إقامة',
    };
    return type ? labels[type] || type : 'غير محدد';
};

// Helper to get gender label in Arabic
const getGenderLabel = (gender: string | null | undefined) => {
    if (gender === 'MALE') return 'ذكر';
    if (gender === 'FEMALE') return 'أنثى';
    return 'غير محدد';
};

// Completion indicator component
function CompletionBadge({ isComplete }: { isComplete: boolean }) {
    return isComplete ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
            <Check className="w-3 h-3" />
            مكتمل
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
            <AlertCircle className="w-3 h-3" />
            ناقص
        </span>
    );
}

// Section card component
interface SectionCardProps {
    title: string;
    icon: React.ElementType;
    stepNumber: number;
    onEdit: () => void;
    isComplete: boolean;
    children: React.ReactNode;
}

function SectionCard({ title, icon: Icon, stepNumber, onEdit, isComplete, children }: SectionCardProps) {
    return (
        <div className={cn(
            "bg-white rounded-2xl shadow-sm border p-5",
            isComplete ? "border-gray-100" : "border-amber-200"
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isComplete ? "bg-primary/10" : "bg-amber-50"
                    )}>
                        <Icon className={cn("w-5 h-5", isComplete ? "text-primary" : "text-amber-600")} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{title}</h3>
                        <p className="text-xs text-gray-500">الخطوة {stepNumber}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CompletionBadge isComplete={isComplete} />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEdit}
                        className="text-primary gap-1 hover:bg-primary/5"
                    >
                        <Edit2 className="w-4 h-4" />
                        تعديل
                    </Button>
                </div>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
}

// Detail row component
function DetailRow({ label, value, isEmpty }: { label: string; value: string | number; isEmpty?: boolean }) {
    return (
        <div className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-gray-500 text-sm">{label}</span>
            <span className={cn(
                "font-medium text-sm text-left max-w-[60%]",
                isEmpty ? "text-amber-500" : "text-gray-800"
            )}>
                {isEmpty ? 'غير محدد' : value}
            </span>
        </div>
    );
}

export function ReviewStep() {
    const { data, setCurrentStep, submitForReview, saving } = useOnboarding();
    const [agreed, setAgreed] = useState(false);

    // Calculate completion status for each section
    const profileComplete = Boolean(data.displayName && data.profilePhotoUrl);
    const experienceComplete = Boolean(data.bio && data.bio.length >= 50);
    const subjectsComplete = data.subjects.length > 0;
    const idComplete = Boolean(data.idType && data.idNumber);

    // Count certificates
    const certificates = data.documents?.filter(
        (d: any) => d.type === 'CERTIFICATE' || d.type === 'DEGREE'
    ) || [];

    const handleSubmit = async () => {
        if (!agreed) {
            toast.error('الرجاء الموافقة على شروط الاستخدام');
            return;
        }

        try {
            // CRITICAL: Accept terms before submitting for review
            const termsVersion = '1.0'; // Current terms version
            await teacherApi.acceptTerms(termsVersion);

            // Submit for review
            await submitForReview();
            toast.success('تم إرسال طلبك بنجاح!');
        } catch (error: any) {
            console.error('Failed to submit application:', error);

            // CRITICAL: Show detailed error message to user
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('فشل إرسال الطلب. الرجاء التحقق من إكمال جميع الحقول المطلوبة.');
            }
        }
    };

    return (
        <div className="space-y-6 font-tajawal">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">الخطوة 5: مراجعة وإرسال</h1>
                <p className="text-text-subtle">راجع جميع بياناتك قبل الإرسال للمراجعة</p>
            </div>

            {/* Progress Summary */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">اكتمال الملف:</span>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className={cn("w-3 h-3 rounded-full", profileComplete ? "bg-green-500" : "bg-gray-300")} />
                            <div className={cn("w-3 h-3 rounded-full", experienceComplete ? "bg-green-500" : "bg-gray-300")} />
                            <div className={cn("w-3 h-3 rounded-full", subjectsComplete ? "bg-green-500" : "bg-gray-300")} />
                            <div className={cn("w-3 h-3 rounded-full", idComplete ? "bg-green-500" : "bg-gray-300")} />
                        </div>
                        <span className="text-sm font-bold text-primary">
                            {[profileComplete, experienceComplete, subjectsComplete, idComplete].filter(Boolean).length}/4
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Section 1: Profile Basics */}
                <SectionCard
                    title="الملف الشخصي"
                    icon={User}
                    stepNumber={1}
                    onEdit={() => setCurrentStep(1)}
                    isComplete={profileComplete}
                >
                    <div className="flex items-start gap-4">
                        {data.profilePhotoUrl ? (
                            <img
                                src={getFileUrl(data.profilePhotoUrl)}
                                alt="Profile"
                                className="w-20 h-20 rounded-xl object-cover border-2 border-gray-100"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-amber-50 border-2 border-amber-200 border-dashed flex items-center justify-center">
                                <User className="w-8 h-8 text-amber-400" />
                            </div>
                        )}
                        <div className="flex-1 space-y-1">
                            <DetailRow label="الاسم الظاهر" value={data.displayName} isEmpty={!data.displayName} />
                            <DetailRow label="الاسم الكامل" value={data.fullName} isEmpty={!data.fullName} />
                            <DetailRow label="الجنس" value={getGenderLabel(data.gender)} isEmpty={!data.gender} />
                        </div>
                    </div>
                </SectionCard>

                {/* Section 2: Experience & Qualifications */}
                <SectionCard
                    title="الخبرة والمؤهلات"
                    icon={GraduationCap}
                    stepNumber={2}
                    onEdit={() => setCurrentStep(2)}
                    isComplete={experienceComplete}
                >
                    <DetailRow label="سنوات الخبرة" value={`${data.yearsOfExperience} سنة`} />
                    <DetailRow label="المؤهل العلمي" value={data.education} isEmpty={!data.education} />
                    <div className="pt-2">
                        <p className="text-gray-500 text-sm mb-1">النبذة التعريفية:</p>
                        {data.bio ? (
                            <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3 leading-relaxed">
                                {data.bio.slice(0, 200)}{data.bio.length > 200 ? '...' : ''}
                            </p>
                        ) : (
                            <p className="text-amber-500 text-sm">لم تُضف نبذة تعريفية</p>
                        )}
                    </div>
                    {/* Certificates */}
                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                الشهادات والمؤهلات
                            </span>
                            <span className="text-sm font-medium">
                                {certificates.length > 0 ? (
                                    <span className="text-green-600">{certificates.length} شهادة</span>
                                ) : (
                                    <span className="text-gray-400">لا توجد (اختياري)</span>
                                )}
                            </span>
                        </div>
                    </div>
                </SectionCard>

                {/* Section 3: Subjects */}
                <SectionCard
                    title="المواد والتسعيرة"
                    icon={BookOpen}
                    stepNumber={3}
                    onEdit={() => setCurrentStep(3)}
                    isComplete={subjectsComplete}
                >
                    {data.subjects.length > 0 ? (
                        <div className="space-y-2">
                            {data.subjects.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                                >
                                    <div>
                                        <span className="font-medium text-gray-800">
                                            {item.subject?.nameAr || 'مادة'}
                                        </span>
                                        <span className="text-gray-400 mx-2">•</span>
                                        <span className="text-gray-500 text-sm">
                                            {item.curriculum?.nameAr || 'المنهج'}
                                        </span>
                                    </div>
                                    <span className="text-primary font-bold">{item.pricePerHour} SDG/ساعة</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 bg-amber-50 rounded-lg">
                            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                            <p className="text-amber-600 font-medium">لم تضف أي مواد بعد</p>
                            <p className="text-amber-500 text-sm">يجب إضافة مادة واحدة على الأقل</p>
                        </div>
                    )}
                </SectionCard>

                {/* Section 4: ID Verification */}
                <SectionCard
                    title="تأكيد الهوية"
                    icon={IdCard}
                    stepNumber={4}
                    onEdit={() => setCurrentStep(4)}
                    isComplete={idComplete}
                >
                    <DetailRow label="نوع الهوية" value={getIdTypeLabel(data.idType)} isEmpty={!data.idType} />
                    <DetailRow label="رقم الهوية" value={data.idNumber} isEmpty={!data.idNumber} />
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-500 text-sm">صورة الهوية</span>
                        {data.idImageUrl ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                                <Check className="w-4 h-4" />
                                تم الرفع
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-amber-500 text-sm">
                                <X className="w-4 h-4" />
                                لم تُرفع (اختياري)
                            </span>
                        )}
                    </div>
                </SectionCard>
            </div>

            {/* Student-Facing Profile Preview */}
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-800">هكذا سيراك الطلاب</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">معاينة</span>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <div className="flex gap-4">
                        {/* Profile Photo */}
                        <div className="flex-shrink-0">
                            {data.profilePhotoUrl ? (
                                <img
                                    src={getFileUrl(data.profilePhotoUrl)}
                                    alt={data.displayName}
                                    className="w-24 h-24 rounded-2xl object-cover border-2 border-primary/20"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-dashed border-primary/30 flex items-center justify-center">
                                    <User className="w-10 h-10 text-primary/40" />
                                </div>
                            )}
                        </div>

                        {/* Teacher Info */}
                        <div className="flex-1 space-y-3">
                            <div>
                                <h4 className="text-xl font-bold text-gray-900 mb-1">
                                    {data.displayName || 'اسمك الظاهر'}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <GraduationCap className="w-4 h-4" />
                                        {data.education || 'المؤهل العلمي'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Award className="w-4 h-4" />
                                        {data.yearsOfExperience} {data.yearsOfExperience === 1 ? 'سنة' : 'سنوات'} خبرة
                                    </span>
                                </div>
                            </div>

                            {/* Bio Preview */}
                            {data.bio ? (
                                <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                                    {data.bio}
                                </p>
                            ) : (
                                <p className="text-gray-400 text-sm italic">
                                    ستظهر نبذتك التعريفية هنا...
                                </p>
                            )}

                            {/* Subjects Preview */}
                            {data.subjects.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {data.subjects.slice(0, 3).map((item: any, index: number) => (
                                        <span
                                            key={item.id || index}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium"
                                        >
                                            <BookOpen className="w-3.5 h-3.5" />
                                            {item.subject?.nameAr || 'مادة'}
                                            <span className="text-xs">•</span>
                                            <span className="font-bold">{item.pricePerHour} SDG/ساعة</span>
                                        </span>
                                    ))}
                                    {data.subjects.length > 3 && (
                                        <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">
                                            +{data.subjects.length - 3} مادة أخرى
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Rating Placeholder */}
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className="w-4 h-4 fill-gray-300 text-gray-300" />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-500">معلم جديد - لا توجد تقييمات بعد</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-3 text-center">
                    <p className="text-xs text-blue-700">
                        💡 <strong>نصيحة:</strong> الملفات المكتملة مع صور واضحة ونبذة جذابة تحصل على حجوزات أكثر بـ 3 أضعاف!
                    </p>
                </div>
            </div>

            {/* Terms Checkbox */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">
                        أوافق على{' '}
                        <a href="/terms" className="text-primary underline hover:no-underline">
                            شروط الاستخدام
                        </a>{' '}
                        و{' '}
                        <a href="/privacy" className="text-primary underline hover:no-underline">
                            سياسة الخصوصية
                        </a>
                        ، وأقر بأن جميع المعلومات المقدمة صحيحة.
                    </span>
                </label>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    className="gap-2"
                >
                    <ArrowRight className="w-4 h-4" />
                    السابق
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={saving || !agreed}
                    size="lg"
                    className="gap-2 px-8 shadow-lg shadow-primary/20"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري الإرسال...
                        </>
                    ) : (
                        <>
                            <Rocket className="w-5 h-5" />
                            إرسال للمراجعة
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
