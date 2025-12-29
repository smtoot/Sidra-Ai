'use client';

import { SupportTicket } from '@/lib/api/support-ticket';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TicketCardProps {
  ticket: SupportTicket;
  onClick: (ticketId: string) => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
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

  const getCreatorName = () => {
    if (ticket.createdBy.firstName || ticket.createdBy.lastName) {
      return `${ticket.createdBy.firstName || ''} ${ticket.createdBy.lastName || ''}`.trim();
    }
    return ticket.createdBy.phoneNumber || 'مستخدم غير معروف';
  };

  return (
    <div
      onClick={() => onClick(ticket.id)}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-mono text-gray-500">{ticket.readableId}</span>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            {ticket.slaBreach && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                تجاوز الوقت
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {getCategoryLabel(ticket.category)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {getCreatorName()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          أُنشئت {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ar })}
        </span>
        <span>
          آخر نشاط {formatDistanceToNow(new Date(ticket.lastActivityAt), { addSuffix: true, locale: ar })}
        </span>
      </div>

      {ticket.assignedTo && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-600">
            معيّنة لـ: {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
          </span>
        </div>
      )}
    </div>
  );
}
