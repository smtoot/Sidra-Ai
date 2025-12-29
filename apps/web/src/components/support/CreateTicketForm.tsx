'use client';

import { useState, useEffect } from 'react';
import { CreateSupportTicketRequest, TicketCategory, TicketPriority } from '@/lib/api/support-ticket';
import { bookingApi, Booking, BookingStatus } from '@/lib/api/booking';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CreateTicketFormProps {
  onSubmit: (data: CreateSupportTicketRequest) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

// Statuses relevant for support tickets
const RELEVANT_BOOKING_STATUSES: BookingStatus[] = [
  'SCHEDULED',
  'PENDING_CONFIRMATION',
  'COMPLETED',
  'DISPUTED',
  'PENDING_TEACHER_APPROVAL',
  'WAITING_FOR_PAYMENT',
  'CANCELLED_BY_PARENT',
  'CANCELLED_BY_TEACHER',
  'REJECTED_BY_TEACHER',
];

const getStatusLabel = (status: BookingStatus): string => {
  const labels: Record<BookingStatus, string> = {
    'PENDING_TEACHER_APPROVAL': 'بانتظار موافقة المعلم',
    'WAITING_FOR_PAYMENT': 'بانتظار الدفع',
    'PAYMENT_REVIEW': 'مراجعة الدفع',
    'SCHEDULED': 'مجدولة',
    'PENDING_CONFIRMATION': 'بانتظار التأكيد',
    'COMPLETED': 'مكتملة',
    'DISPUTED': 'نزاع',
    'REFUNDED': 'مستردة',
    'PARTIALLY_REFUNDED': 'مستردة جزئياً',
    'REJECTED_BY_TEACHER': 'مرفوضة من المعلم',
    'CANCELLED_BY_PARENT': 'ملغاة من ولي الأمر',
    'CANCELLED_BY_TEACHER': 'ملغاة من المعلم',
    'CANCELLED_BY_ADMIN': 'ملغاة من الإدارة',
    'EXPIRED': 'منتهية الصلاحية',
  };
  return labels[status] || status;
};

export function CreateTicketForm({ onSubmit, onCancel, submitting }: CreateTicketFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateSupportTicketRequest>({
    category: 'GENERAL' as TicketCategory,
    subject: '',
    description: '',
    evidence: [],
    priority: 'NORMAL' as TicketPriority,
  });

  const [evidenceInput, setEvidenceInput] = useState('');

  // Booking selector state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Fetch user's bookings based on role
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.role) return;

      setLoadingBookings(true);
      try {
        let data: Booking[] = [];

        if (user.role === 'STUDENT') {
          data = await bookingApi.getStudentBookings();
        } else if (user.role === 'PARENT') {
          data = await bookingApi.getParentBookings();
        } else if (user.role === 'TEACHER') {
          data = await bookingApi.getAllTeacherBookings();
        }

        // Filter to relevant statuses and sort by date (most recent first)
        const filteredBookings = data
          .filter(b => RELEVANT_BOOKING_STATUSES.includes(b.status))
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        setBookings(filteredBookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [user?.role]);

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      linkedBookingId: selectedBookingId || undefined,
    });
  };

  const handleAddEvidence = () => {
    if (evidenceInput.trim()) {
      setFormData({
        ...formData,
        evidence: [...(formData.evidence || []), evidenceInput.trim()],
      });
      setEvidenceInput('');
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setFormData({
      ...formData,
      evidence: formData.evidence?.filter((_, i) => i !== index) || [],
    });
  };

  const formatBookingOption = (booking: Booking): string => {
    const subjectName = booking.subject?.nameAr || 'مادة غير محددة';
    const dateStr = format(new Date(booking.startTime), 'd MMM yyyy', { locale: ar });
    const statusLabel = getStatusLabel(booking.status);
    const idLabel = booking.readableId || booking.id.substring(0, 8);
    return `${idLabel} - ${subjectName} - ${dateStr} (${statusLabel})`;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <div className="space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            التصنيف <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ACADEMIC">أكاديمي - المنهج، طرق التدريس</option>
            <option value="SESSION">الحصص - الجدولة، الحضور</option>
            <option value="FINANCIAL">مالي - المدفوعات، الاستردادات</option>
            <option value="TECHNICAL">تقني - مشاكل المنصة، تسجيل الدخول</option>
            <option value="BEHAVIORAL">سلوكي - السلوك، الاحترافية</option>
            <option value="GENERAL">عام - استفسارات أخرى</option>
          </select>
        </div>

        {/* Related Booking */}
        {bookings.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحصة/الجلسة المتعلقة (اختياري)
            </label>
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              disabled={loadingBookings}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- لا توجد حصة متعلقة --</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {formatBookingOption(booking)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              اختر الحصة المتعلقة بمشكلتك لمساعدة فريق الدعم في فهم المشكلة بشكل أفضل
            </p>

            {/* Selected Booking Preview */}
            {selectedBooking && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">تفاصيل الحصة المختارة:</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>{selectedBooking.subject?.nameAr || 'مادة غير محددة'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {format(new Date(selectedBooking.startTime), 'EEEE d MMMM yyyy - h:mm a', { locale: ar })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>الحالة: {getStatusLabel(selectedBooking.status)}</span>
                  </div>
                  {selectedBooking.readableId && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="font-mono">{selectedBooking.readableId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading bookings indicator */}
        {loadingBookings && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>جاري تحميل الحصص...</span>
          </div>
        )}

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الأولوية
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="LOW">منخفضة - استفسار عام</option>
            <option value="NORMAL">عادية - دعم قياسي</option>
            <option value="HIGH">عالية - مشكلة عاجلة</option>
            <option value="CRITICAL">حرجة - انقطاع الخدمة</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الموضوع <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={200}
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="ملخص مختصر لمشكلتك"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">{formData.subject.length}/200 حرف</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الوصف <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            maxLength={5000}
            rows={6}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="يرجى تقديم معلومات تفصيلية عن مشكلتك..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">{formData.description.length}/5000 حرف</p>
        </div>

        {/* Evidence URLs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المرفقات (لقطات شاشة، روابط)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={evidenceInput}
              onChange={(e) => setEvidenceInput(e.target.value)}
              placeholder="https://example.com/screenshot.png"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddEvidence}
              disabled={!evidenceInput.trim() || (formData.evidence?.length || 0) >= 10}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إضافة
            </button>
          </div>
          {formData.evidence && formData.evidence.length > 0 && (
            <div className="mt-2 space-y-2">
              {formData.evidence.map((url, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm text-gray-700 truncate">{url}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvidence(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {formData.evidence?.length || 0}/10 مرفقات
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? 'جاري الإنشاء...' : 'إنشاء التذكرة'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </form>
  );
}
