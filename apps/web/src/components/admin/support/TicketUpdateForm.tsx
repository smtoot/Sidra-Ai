'use client';

import { useState } from 'react';
import { SupportTicketDetail, UpdateSupportTicketRequest, TicketStatus, TicketPriority, EscalationLevel } from '@/lib/api/support-ticket';

interface TicketUpdateFormProps {
  ticket: SupportTicketDetail;
  onUpdate: (data: UpdateSupportTicketRequest) => Promise<void>;
  onEscalate: () => Promise<void>;
  onAssign: () => void;
  loading: boolean;
}

export function TicketUpdateForm({ ticket, onUpdate, onEscalate, onAssign, loading }: TicketUpdateFormProps) {
  const [formData, setFormData] = useState<UpdateSupportTicketRequest>({
    status: ticket.status,
    priority: ticket.priority,
    escalationLevel: ticket.escalationLevel,
    resolutionNote: ticket.resolutionNote || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(formData);
  };

  const hasChanges = () => {
    return (
      formData.status !== ticket.status ||
      formData.priority !== ticket.priority ||
      formData.escalationLevel !== ticket.escalationLevel ||
      formData.resolutionNote !== (ticket.resolutionNote || '')
    );
  };

  const canEscalate = ticket.escalationLevel !== 'L3';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">إدارة الطلب</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الحالة
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as TicketStatus })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="OPEN">مفتوحة</option>
            <option value="IN_PROGRESS">قيد المعالجة</option>
            <option value="WAITING_FOR_CUSTOMER">بانتظار العميل</option>
            <option value="WAITING_FOR_SUPPORT">بانتظار الدعم</option>
            <option value="RESOLVED">محلولة</option>
            <option value="CLOSED">مغلقة</option>
            <option value="CANCELLED">ملغاة</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الأولوية
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="LOW">منخفضة</option>
            <option value="NORMAL">عادية</option>
            <option value="HIGH">عالية</option>
            <option value="CRITICAL">حرجة</option>
          </select>
        </div>

        {/* Escalation Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            مستوى التصعيد
          </label>
          <select
            value={formData.escalationLevel}
            onChange={(e) => setFormData({ ...formData, escalationLevel: e.target.value as EscalationLevel })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="L1">L1 - أساسي</option>
            <option value="L2">L2 - متقدم</option>
            <option value="L3">L3 - إداري</option>
          </select>
        </div>

        {/* Resolution Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ملاحظة الحل
          </label>
          <textarea
            value={formData.resolutionNote}
            onChange={(e) => setFormData({ ...formData, resolutionNote: e.target.value })}
            rows={4}
            maxLength={5000}
            placeholder="أضف تفاصيل الحل..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">{formData.resolutionNote?.length || 0}/5000</p>
        </div>

        {/* Update Button */}
        <button
          type="submit"
          disabled={loading || !hasChanges()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'جاري التحديث...' : 'تحديث الطلب'}
        </button>
      </form>

      {/* Action Buttons */}
      <div className="mt-4 space-y-2 pt-4 border-t border-gray-200">
        <button
          onClick={onAssign}
          disabled={loading}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          تعيين لموظف
        </button>
        {canEscalate && (
          <button
            onClick={onEscalate}
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 transition-colors"
          >
            تصعيد الطلب
          </button>
        )}
      </div>
    </div>
  );
}
