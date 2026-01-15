'use client';

import { useState } from 'react';
import { X, CheckCircle, Loader2, Star, FileText, TrendingUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SessionCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    onSuccess: () => void;
}

export function SessionCompletionModal({ isOpen, onClose, bookingId, onSuccess }: SessionCompletionModalProps) {
    const [submitting, setSubmitting] = useState(false);

    // Form data
    const [topicsCovered, setTopicsCovered] = useState('');
    const [studentPerformanceRating, setStudentPerformanceRating] = useState<number | null>(null);
    const [studentPerformanceNotes, setStudentPerformanceNotes] = useState('');
    const [homeworkAssigned, setHomeworkAssigned] = useState<boolean | null>(null);
    const [homeworkDescription, setHomeworkDescription] = useState('');
    const [nextSessionRecommendations, setNextSessionRecommendations] = useState('');

    const handleSubmit = async (quickComplete = false) => {
        setSubmitting(true);
        try {
            const data = quickComplete ? {} : {
                topicsCovered: topicsCovered || undefined,
                studentPerformanceRating: studentPerformanceRating || undefined,
                studentPerformanceNotes: studentPerformanceNotes || undefined,
                homeworkAssigned: homeworkAssigned ?? undefined,
                homeworkDescription: homeworkAssigned ? homeworkDescription || undefined : undefined,
                nextSessionRecommendations: nextSessionRecommendations || undefined,
            };

            const { bookingApi } = await import('@/lib/api/booking');
            await bookingApi.completeSession(bookingId, data);

            toast.success('تم إنهاء الحصة بنجاح! سيتم إخطار الطالب.');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to complete session:', error);
            toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إنهاء الحصة');
        } finally {
            setSubmitting(false);
        }
    };

    const getRatingLabel = (rating: number) => {
        const labels = ['', 'يحتاج تحسين', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'];
        return labels[rating] || '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <CheckCircle className="w-6 h-6" />
                            ملخص الحصة
                        </h2>
                        <p className="text-emerald-100 text-sm mt-1">
                            أضف ملاحظاتك للطالب (اختياري)
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

                {/* Content - Scrollable */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Topics Covered */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                            <BookOpen className="w-5 h-5 text-blue-500" />
                            ماذا درست في هذه الحصة؟
                        </label>
                        <textarea
                            value={topicsCovered}
                            onChange={(e) => setTopicsCovered(e.target.value)}
                            placeholder="مثال: الفصل الثالث - المعادلات التربيعية وطرق حلها"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-white text-gray-800 placeholder:text-gray-400"
                            rows={2}
                        />
                    </div>

                    {/* Student Performance Rating */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                            <Star className="w-5 h-5 text-amber-500" />
                            كيف كان أداء الطالب؟
                        </label>
                        <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                    key={rating}
                                    type="button"
                                    onClick={() => setStudentPerformanceRating(
                                        studentPerformanceRating === rating ? null : rating
                                    )}
                                    className="p-1.5 rounded-lg transition-all hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 transition-colors ${
                                            studentPerformanceRating && rating <= studentPerformanceRating
                                                ? 'text-amber-400 fill-amber-400'
                                                : 'text-gray-300 hover:text-amber-200'
                                        }`}
                                    />
                                </button>
                            ))}
                            {studentPerformanceRating && (
                                <span className="mr-3 text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                    {getRatingLabel(studentPerformanceRating)}
                                </span>
                            )}
                        </div>
                        <textarea
                            value={studentPerformanceNotes}
                            onChange={(e) => setStudentPerformanceNotes(e.target.value)}
                            placeholder="ملاحظات عن أداء الطالب..."
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-white text-gray-800 placeholder:text-gray-400"
                            rows={2}
                        />
                    </div>

                    {/* Homework */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                            <FileText className="w-5 h-5 text-green-500" />
                            هل أعطيت واجب منزلي؟
                        </label>
                        <div className="flex gap-3 mb-3">
                            <button
                                type="button"
                                onClick={() => setHomeworkAssigned(true)}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all border-2 ${
                                    homeworkAssigned === true
                                        ? 'bg-green-50 border-green-500 text-green-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                نعم
                            </button>
                            <button
                                type="button"
                                onClick={() => setHomeworkAssigned(false)}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all border-2 ${
                                    homeworkAssigned === false
                                        ? 'bg-gray-100 border-gray-400 text-gray-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                لا
                            </button>
                        </div>
                        {homeworkAssigned === true && (
                            <textarea
                                value={homeworkDescription}
                                onChange={(e) => setHomeworkDescription(e.target.value)}
                                placeholder="وصف الواجب: مثال - حل التمارين 1-10 من صفحة 45"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none bg-white text-gray-800 placeholder:text-gray-400"
                                rows={2}
                            />
                        )}
                    </div>

                    {/* Next Session Recommendations */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                            توصيات للحصة القادمة
                        </label>
                        <textarea
                            value={nextSessionRecommendations}
                            onChange={(e) => setNextSessionRecommendations(e.target.value)}
                            placeholder="مثال: مراجعة الواجب، ثم البدء في الفصل الرابع"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none bg-white text-gray-800 placeholder:text-gray-400"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="border-t bg-gray-50 px-6 py-4 flex-shrink-0">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit(true)}
                            disabled={submitting}
                            className="flex-1 h-12 text-gray-600 border-gray-300 hover:bg-gray-100"
                        >
                            إنهاء بدون ملاحظات
                        </Button>
                        <Button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5 ml-2" />
                                    حفظ وإنهاء الحصة
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
