'use client';

import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ratingApi } from '@/lib/api/rating';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    teacherName: string;
    onSuccess?: () => void;
}

export function RatingModal({ isOpen, onClose, bookingId, teacherName, onSuccess }: RatingModalProps) {
    const [score, setScore] = useState<number>(0);
    const [hoveredScore, setHoveredScore] = useState<number>(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (score === 0) {
            setError('الرجاء اختيار عدد النجوم');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await ratingApi.rateBooking(bookingId, {
                score,
                comment: comment.trim() || undefined
            });
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Rating error:', err);
            setError(err?.response?.data?.message || 'فشل في إرسال التقييم');
        } finally {
            setLoading(false);
        }
    };

    const displayScore = hoveredScore || score;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" dir="rtl">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-primary">تقييم الحصة</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-white/50 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <p className="text-center text-gray-600">
                        كيف كانت جلستك مع <span className="font-bold text-primary">{teacherName}</span>؟
                    </p>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setScore(star)}
                                onMouseEnter={() => setHoveredScore(star)}
                                onMouseLeave={() => setHoveredScore(0)}
                                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    className={`w-10 h-10 transition-colors ${star <= displayScore
                                            ? 'fill-accent text-accent'
                                            : 'text-gray-300'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-sm text-gray-500">
                        {displayScore === 1 && 'ضعيف جداً'}
                        {displayScore === 2 && 'ضعيف'}
                        {displayScore === 3 && 'متوسط'}
                        {displayScore === 4 && 'جيد'}
                        {displayScore === 5 && 'ممتاز'}
                    </p>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            تعليق (اختياري)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="شاركنا رأيك في الحصة..."
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            rows={3}
                            maxLength={2000}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-left">
                            {comment.length}/2000
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                            disabled={loading}
                        >
                            إلغاء
                        </Button>
                        <Button
                            className="flex-1 bg-primary hover:bg-primary-hover"
                            onClick={handleSubmit}
                            disabled={loading || score === 0}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    جاري الإرسال...
                                </>
                            ) : (
                                'إرسال التقييم'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
