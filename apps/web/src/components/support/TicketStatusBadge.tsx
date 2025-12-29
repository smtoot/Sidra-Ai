'use client';

import { TicketStatus } from '@/lib/api/support-ticket';

interface TicketStatusBadgeProps {
  status: TicketStatus;
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'WAITING_FOR_CUSTOMER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'WAITING_FOR_SUPPORT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'OPEN':
        return 'مفتوحة';
      case 'IN_PROGRESS':
        return 'قيد المعالجة';
      case 'WAITING_FOR_CUSTOMER':
        return 'بانتظارك';
      case 'WAITING_FOR_SUPPORT':
        return 'بانتظار الدعم';
      case 'RESOLVED':
        return 'محلولة';
      case 'CLOSED':
        return 'مغلقة';
      case 'CANCELLED':
        return 'ملغاة';
      default:
        return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {getStatusLabel()}
    </span>
  );
}
