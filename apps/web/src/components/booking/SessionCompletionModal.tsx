'use client';

import { useState } from 'react';
import { X, CheckCircle, Loader2, Upload, Star, FileText, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/api/upload';

interface SessionCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    onSuccess: () => void;
}

export function SessionCompletionModal({ isOpen, onClose, bookingId, onSuccess }: SessionCompletionModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form data
    const [sessionProofUrl, setSessionProofUrl] = useState<string>('');
    const [topicsCovered, setTopicsCovered] = useState('');
    const [studentPerformanceRating, setStudentPerformanceRating] = useState<number | null>(null);
    const [studentPerformanceNotes, setStudentPerformanceNotes] = useState('');
    const [homeworkAssigned, setHomeworkAssigned] = useState(false);
    const [homeworkDescription, setHomeworkDescription] = useState('');
    const [nextSessionRecommendations, setNextSessionRecommendations] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('الرجاء تحميل صورة فقط');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('حجم الملف كبير جداً (الحد الأقصى 5MB)');
            return;
        }

        try {
            setUploading(true);
            const fileKey = await uploadFile(file, 'dispute-evidence');
            setSessionProofUrl(fileKey);
            toast.success('تم رفع الصورة بنجاح ✅');
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error(error?.response?.data?.message || 'فشل رفع الصورة');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const data = {
                sessionProofUrl: sessionProofUrl || undefined,
                topicsCovered: topicsCovered || undefined,
                studentPerformanceRating: studentPerformanceRating || undefined,
                studentPerformanceNotes: studentPerformanceNotes || undefined,
                homeworkAssigned: homeworkAssigned || undefined,
                homeworkDescription: homeworkDescription || undefined,
                nextSessionRecommendations: nextSessionRecommendations || undefined,
                additionalNotes: additionalNotes || undefined,
            };

            const { bookingApi } = await import('@/lib/api/booking');
            await bookingApi.completeSession(bookingId, data);

            toast.success('تم إنهاء الحصة! سيتم تحويل الدفع خلال 48 ساعة بعد تأكيد الطالب ✅');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to complete session:', error);
            toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إنهاء الحصة');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <CheckCircle className="w-6 h-6" />
                            {step === 1 ? 'إثبات إتمام الحصة (اختياري)' : 'ملخص الحصة'}
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            {step === 1 ? 'الخطوة 1 من 2' : 'الخطوة 2 من 2 - قم بملء أي من الحقول'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {step === 1 ? (
                        <>
                            {/* Step 1: Upload Proof */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-medium text-blue-900 mb-1">
                                            🔒 هذه الصورة سرية
                                        </p>
                                        <p className="text-sm text-blue-700">
                                            سيتم استخدام هذه الصورة فقط في حالة وجود نزاع. لن يتم مشاركتها مع أي طرف آخر.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700 mb-2 block">
                                        📸 ارفع لقطة شاشة من الحصة (اختياري)
                                    </span>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            disabled={uploading || !!sessionProofUrl}
                                            className="hidden"
                                            id="proof-upload"
                                        />
                                        <label htmlFor="proof-upload" className="cursor-pointer">
                                            {uploading ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                                    <p className="text-sm text-gray-600">جاري الرفع...</p>
                                                </div>
                                            ) : sessionProofUrl ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                                    <p className="text-sm text-green-600 font-medium">تم رفع الصورة بنجاح ✅</p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setSessionProofUrl('');
                                                        }}
                                                        className="text-xs text-red-500 hover:text-red-700 underline"
                                                    >
                                                        حذف الصورة
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Upload className="w-10 h-10 text-gray-400" />
                                                    <p className="text-sm text-gray-600">
                                                        اضغط لاختيار صورة أو اسحبها هنا
                                                    </p>
                                                    <p className="text-xs text-gray-400">PNG, JPG, JPEG (حتى 5MB)</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1"
                                    disabled={submitting}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={() => setStep(2)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    disabled={uploading}
                                >
                                    {sessionProofUrl ? 'التالي' : 'تخطي'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Step 2: Session Summary */}
                            <div className="space-y-5">
                                {/* Topics Covered */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <BookOpen className="w-4 h-4 text-blue-500" />
                                        المواضيع التي تم تدريسها (اختياري)
                                    </label>
                                    <textarea
                                        value={topicsCovered}
                                        onChange={(e) => setTopicsCovered(e.target.value)}
                                        placeholder="مثال: المعادلات التربيعية - طرق الحل"
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                        rows={2}
                                    />
                                </div>

                                {/* Student Performance */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <Star className="w-4 h-4 text-yellow-500" />
                                        تقييم أداء الطالب (اختياري)
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                onClick={() => setStudentPerformanceRating(rating)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    studentPerformanceRating === rating
                                                        ? 'bg-yellow-100 text-yellow-600'
                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                }`}
                                            >
                                                <Star className={`w-6 h-6 ${studentPerformanceRating && rating <= studentPerformanceRating ? 'fill-current' : ''}`} />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={studentPerformanceNotes}
                                        onChange={(e) => setStudentPerformanceNotes(e.target.value)}
                                        placeholder="مثال: الطالب استوعب المفاهيم بسرعة ويحتاج لمزيد من التمارين"
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                        rows={2}
                                    />
                                </div>

                                {/* Homework */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <FileText className="w-4 h-4 text-green-500" />
                                        الواجب المنزلي
                                    </label>
                                    <div className="flex items-center gap-3 mb-2">
                                        <button
                                            onClick={() => setHomeworkAssigned(!homeworkAssigned)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                homeworkAssigned
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {homeworkAssigned ? 'نعم، تم إعطاء واجب' : 'لا يوجد واجب'}
                                        </button>
                                    </div>
                                    {homeworkAssigned && (
                                        <textarea
                                            value={homeworkDescription}
                                            onChange={(e) => setHomeworkDescription(e.target.value)}
                                            placeholder="مثال: حل التمارين 1-15 من صفحة 42"
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                            rows={2}
                                        />
                                    )}
                                </div>

                                {/* Next Session Recommendations */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <TrendingUp className="w-4 h-4 text-purple-500" />
                                        توصيات للحصة القادمة (اختياري)
                                    </label>
                                    <textarea
                                        value={nextSessionRecommendations}
                                        onChange={(e) => setNextSessionRecommendations(e.target.value)}
                                        placeholder="مثال: مراجعة الواجب ثم الانتقال للوغاريتمات"
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                        rows={2}
                                    />
                                </div>

                                {/* Additional Notes */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        ملاحظات إضافية (اختياري)
                                    </label>
                                    <textarea
                                        value={additionalNotes}
                                        onChange={(e) => setAdditionalNotes(e.target.value)}
                                        placeholder="أي ملاحظات أخرى تود مشاركتها..."
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="flex-1"
                                    disabled={submitting}
                                >
                                    السابق
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                            جاري الإنهاء...
                                        </>
                                    ) : (
                                        'تأكيد إنهاء الحصة'
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
