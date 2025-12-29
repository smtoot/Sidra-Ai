'use client';

import { BookOpen, Star, FileText, TrendingUp, CheckCircle, Image as ImageIcon, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { getFileUrl } from '@/lib/api/upload';

interface SessionDetailsCardProps {
    booking: {
        sessionProofUrl?: string | null;
        topicsCovered?: string | null;
        studentPerformanceRating?: number | null;
        studentPerformanceNotes?: string | null;
        homeworkAssigned?: boolean | null;
        homeworkDescription?: string | null;
        nextSessionRecommendations?: string | null;
        additionalNotes?: string | null;
        teacherSummary?: string | null;
    };
    showProof?: boolean; // Only admins should see proof
    userRole?: 'parent' | 'student' | 'admin';
}

export function SessionDetailsCard({ booking, showProof = false, userRole = 'parent' }: SessionDetailsCardProps) {
    const [showProofImage, setShowProofImage] = useState(false);

    // Check if there's any completion data
    const hasCompletionData = booking.topicsCovered ||
                             booking.studentPerformanceRating ||
                             booking.studentPerformanceNotes ||
                             booking.homeworkAssigned ||
                             booking.nextSessionRecommendations ||
                             booking.additionalNotes ||
                             booking.teacherSummary ||
                             (showProof && booking.sessionProofUrl);

    if (!hasCompletionData) {
        return null; // Don't show card if no data
    }

    return (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
            <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-transparent">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    تفاصيل الحصة
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
                {/* Session Proof (Admin Only) */}
                {showProof && booking.sessionProofUrl && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    إثبات الحصة (سري)
                                </h4>
                                <p className="text-sm text-amber-700 mb-3">
                                    هذه الصورة سرية ومتاحة للإدارة فقط لأغراض التحقق وحل النزاعات
                                </p>
                                {!showProofImage ? (
                                    <button
                                        onClick={() => setShowProofImage(true)}
                                        className="text-sm font-medium text-amber-700 hover:text-amber-900 underline"
                                    >
                                        عرض الصورة
                                    </button>
                                ) : (
                                    <div className="mt-2">
                                        <img
                                            src={getFileUrl(booking.sessionProofUrl!)}
                                            alt="Session proof"
                                            className="rounded-lg border-2 border-amber-300 max-w-full h-auto"
                                        />
                                        <button
                                            onClick={() => setShowProofImage(false)}
                                            className="text-sm font-medium text-amber-700 hover:text-amber-900 underline mt-2"
                                        >
                                            إخفاء الصورة
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Topics Covered */}
                {booking.topicsCovered && (
                    <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            المواضيع التي تم تدريسها
                        </h4>
                        <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                            {booking.topicsCovered}
                        </p>
                    </div>
                )}

                {/* Student Performance */}
                {(booking.studentPerformanceRating || booking.studentPerformanceNotes) && (
                    <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            تقييم الأداء
                        </h4>
                        <div className="bg-yellow-50 p-3 rounded-lg space-y-2">
                            {booking.studentPerformanceRating && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">التقييم:</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-5 h-5 ${
                                                    star <= booking.studentPerformanceRating!
                                                        ? 'text-yellow-500 fill-yellow-500'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-yellow-700">
                                        ({booking.studentPerformanceRating}/5)
                                    </span>
                                </div>
                            )}
                            {booking.studentPerformanceNotes && (
                                <p className="text-gray-700">{booking.studentPerformanceNotes}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Homework */}
                {booking.homeworkAssigned !== null && (
                    <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-500" />
                            الواجب المنزلي
                        </h4>
                        {booking.homeworkAssigned ? (
                            <div className="bg-green-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-green-700">تم إعطاء واجب</span>
                                </div>
                                {booking.homeworkDescription && (
                                    <p className="text-gray-700">{booking.homeworkDescription}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                لم يتم إعطاء واجب في هذه الحصة
                            </p>
                        )}
                    </div>
                )}

                {/* Next Session Recommendations */}
                {booking.nextSessionRecommendations && (
                    <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                            توصيات للحصة القادمة
                        </h4>
                        <p className="text-gray-700 bg-purple-50 p-3 rounded-lg">
                            {booking.nextSessionRecommendations}
                        </p>
                    </div>
                )}

                {/* Additional Notes */}
                {booking.additionalNotes && (
                    <div className="space-y-2">
                        <h4 className="font-bold text-gray-900">ملاحظات إضافية</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {booking.additionalNotes}
                        </p>
                    </div>
                )}

                {/* Legacy Teacher Summary (if no structured data) */}
                {booking.teacherSummary &&
                 !booking.topicsCovered &&
                 !booking.studentPerformanceNotes &&
                 !booking.nextSessionRecommendations && (
                    <div className="space-y-2">
                        <h4 className="font-bold text-gray-900">ملخص المعلم</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {booking.teacherSummary}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
