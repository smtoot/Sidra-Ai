'use client';

import { SupportTicketDetail } from '@/lib/api/support-ticket';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TicketDetailProps {
  ticket: SupportTicketDetail;
  onClose: () => void;
  onReopen: () => void;
  actionLoading: boolean;
}

export function TicketDetail({ ticket, onClose, onReopen, actionLoading }: TicketDetailProps) {
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ACADEMIC':
        return 'أكاديمي';
      case 'SESSION':
        return 'الحصص';
      case 'FINANCIAL':
        return 'مالي';
      case 'TECHNICAL':
        return 'تقني';
      case 'BEHAVIORAL':
        return 'سلوكي';
      case 'GENERAL':
        return 'عام';
      default:
        return category;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SUPPORT':
        return 'دعم';
      case 'COMPLAINT':
        return 'شكوى';
      case 'DISPUTE':
        return 'نزاع';
      default:
        return type;
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
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-gray-500">{ticket.readableId}</span>
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              {ticket.slaBreach && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                  تجاوز الوقت
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject}</h1>
          </div>
          <div className="flex gap-2">
            {canReopen && (
              <button
                onClick={onReopen}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                إعادة فتح
              </button>
            )}
            {canClose && (
              <button
                onClick={onClose}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                إغلاق التذكرة
              </button>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">التصنيف</span>
            <p className="font-medium text-gray-900">{getCategoryLabel(ticket.category)}</p>
          </div>
          <div>
            <span className="text-gray-500">النوع</span>
            <p className="font-medium text-gray-900">{getTypeLabel(ticket.type)}</p>
          </div>
          <div>
            <span className="text-gray-500">أُنشئت بواسطة</span>
            <p className="font-medium text-gray-900">{getCreatorName()}</p>
          </div>
          <div>
            <span className="text-gray-500">تاريخ الإنشاء</span>
            <p className="font-medium text-gray-900">
              {format(new Date(ticket.createdAt), 'd MMM yyyy h:mm a', { locale: ar })}
            </p>
          </div>
        </div>

        {ticket.assignedTo && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">معيّنة لـ: </span>
            <span className="text-sm font-medium text-gray-900">
              {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
            </span>
          </div>
        )}

        {ticket.slaDeadline && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">الموعد النهائي: </span>
            <span className={`text-sm font-medium ${ticket.slaBreach ? 'text-red-600' : 'text-gray-900'}`}>
              {format(new Date(ticket.slaDeadline), 'd MMM yyyy h:mm a', { locale: ar })}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">الوصف</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>

        {ticket.evidence && ticket.evidence.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">المرفقات</h3>
            <div className="space-y-2">
              {ticket.evidence.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  {url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resolution */}
      {ticket.resolutionNote && (
        <div className="p-6 bg-green-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">الحل</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.resolutionNote}</p>
          {ticket.resolvedAt && (
            <p className="text-sm text-gray-500 mt-2">
              تم الحل في {format(new Date(ticket.resolvedAt), 'd MMM yyyy h:mm a', { locale: ar })}
              {ticket.resolvedBy && (
                <> بواسطة {ticket.resolvedBy.firstName} {ticket.resolvedBy.lastName}</>
              )}
            </p>
          )}
        </div>
      )}

      {/* Status History */}
      {ticket.statusHistory && ticket.statusHistory.length > 0 && (
        <div className="p-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">سجل الحالة</h2>
          <div className="space-y-2">
            {ticket.statusHistory.map((history) => (
              <div key={history.id} className="flex items-start gap-3 text-sm flex-wrap">
                <span className="text-gray-500">
                  {format(new Date(history.createdAt), 'd MMM, h:mm a', { locale: ar })}
                </span>
                <span className="text-gray-700">
                  {history.fromStatus ? (
                    <>
                      تم التغيير من <TicketStatusBadge status={history.fromStatus} /> إلى{' '}
                      <TicketStatusBadge status={history.toStatus} />
                    </>
                  ) : (
                    <>
                      تم التعيين إلى <TicketStatusBadge status={history.toStatus} />
                    </>
                  )}
                </span>
                <span className="text-gray-500">
                  بواسطة {history.changedBy.firstName} {history.changedBy.lastName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
