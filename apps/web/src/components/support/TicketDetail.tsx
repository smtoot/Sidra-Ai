'use client';

import { useState } from 'react';
import { SupportTicketDetail } from '@/lib/api/support-ticket';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle,
  Paperclip,
  History
} from 'lucide-react';

interface TicketDetailProps {
  ticket: SupportTicketDetail;
  onClose: () => void;
  onReopen: () => void;
  actionLoading: boolean;
}

export function TicketDetail({ ticket, onClose, onReopen, actionLoading }: TicketDetailProps) {
  const [showHistory, setShowHistory] = useState(false);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ACADEMIC': return 'أكاديمي';
      case 'SESSION': return 'الحصص';
      case 'FINANCIAL': return 'مالي';
      case 'TECHNICAL': return 'تقني';
      case 'BEHAVIORAL': return 'سلوكي';
      case 'GENERAL': return 'عام';
      default: return category;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SUPPORT': return 'دعم';
      case 'COMPLAINT': return 'شكوى';
      case 'DISPUTE': return 'نزاع';
      default: return type;
    }
  };

  const getCreatorName = () => {
    if (ticket.createdBy.firstName || ticket.createdBy.lastName) {
      return `${ticket.createdBy.firstName || ''} ${ticket.createdBy.lastName || ''}`.trim();
    }
    return ticket.createdBy.phoneNumber || 'مستخدم غير معروف';
  };

  const canClose = ticket.status !== 'CLOSED' && ticket.status !== 'CANCELLED';
  const canReopen = ticket.status === 'CLOSED' && ticket.type === 'SUPPORT';

  return (
    <div className="space-y-4">
      {/* Compact Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Top Bar - Status & Actions */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
              {ticket.readableId}
            </span>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            {ticket.slaBreach && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                <AlertCircle className="w-3 h-3" />
                تجاوز الوقت
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {canReopen && (
              <button
                onClick={onReopen}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                إعادة فتح
              </button>
            )}
            {canClose && (
              <button
                onClick={onClose}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                إغلاق التذكرة
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
        </div>

        {/* Quick Info Pills */}
        <div className="px-4 pb-4 flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Tag className="w-4 h-4 text-gray-400" />
            <span>{getCategoryLabel(ticket.category)}</span>
            <span className="text-gray-300">•</span>
            <span>{getTypeLabel(ticket.type)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>{getCreatorName()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{format(new Date(ticket.createdAt), 'd MMM yyyy', { locale: ar })}</span>
          </div>
          {ticket.assignedTo && (
            <div className="flex items-center gap-1.5 text-blue-600">
              <User className="w-4 h-4" />
              <span>معيّنة لـ: {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
            </div>
          )}
        </div>

        {/* SLA Deadline if exists */}
        {ticket.slaDeadline && (
          <div className={`px-4 py-2 text-sm border-t ${ticket.slaBreach ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>الموعد النهائي: {format(new Date(ticket.slaDeadline), 'd MMM yyyy h:mm a', { locale: ar })}</span>
            </div>
          </div>
        )}
      </div>

      {/* Description Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">تفاصيل المشكلة</h2>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>

        {ticket.evidence && ticket.evidence.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-700">المرفقات ({ticket.evidence.length})</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {ticket.evidence.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-blue-600 transition-colors"
                >
                  <Paperclip className="w-3 h-3" />
                  مرفق {index + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resolution Card - Only if resolved */}
      {ticket.resolutionNote && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-green-800">تم حل المشكلة</h2>
          </div>
          <p className="text-green-700 whitespace-pre-wrap">{ticket.resolutionNote}</p>
          {ticket.resolvedAt && (
            <p className="text-sm text-green-600 mt-3 pt-3 border-t border-green-200">
              تم الحل في {format(new Date(ticket.resolvedAt), 'd MMM yyyy h:mm a', { locale: ar })}
              {ticket.resolvedBy && (
                <> بواسطة {ticket.resolvedBy.firstName} {ticket.resolvedBy.lastName}</>
              )}
            </p>
          )}
        </div>
      )}

      {/* Collapsible Status History */}
      {ticket.statusHistory && ticket.statusHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-3 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" />
              <span className="font-medium">سجل الحالة</span>
              <span className="text-sm text-gray-400">({ticket.statusHistory.length} تحديث)</span>
            </div>
            {showHistory ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showHistory && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="mt-3 space-y-3">
                {ticket.statusHistory.map((history, index) => (
                  <div
                    key={history.id}
                    className={`flex items-start gap-3 text-sm ${index !== ticket.statusHistory.length - 1 ? 'pb-3 border-b border-gray-50' : ''}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {history.fromStatus ? (
                          <>
                            <TicketStatusBadge status={history.fromStatus} />
                            <span className="text-gray-400">←</span>
                            <TicketStatusBadge status={history.toStatus} />
                          </>
                        ) : (
                          <>
                            <span className="text-gray-500">تم التعيين إلى</span>
                            <TicketStatusBadge status={history.toStatus} />
                          </>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        {format(new Date(history.createdAt), 'd MMM yyyy h:mm a', { locale: ar })} • {history.changedBy.firstName} {history.changedBy.lastName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
