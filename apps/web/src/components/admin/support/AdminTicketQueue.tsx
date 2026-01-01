'use client';

import { useState } from 'react';
import { SupportTicket, TicketStatus, TicketPriority } from '@/lib/api/support-ticket';
import { TicketCard } from '@/components/support/TicketCard';

interface AdminTicketQueueProps {
  tickets: SupportTicket[];
  onTicketClick: (ticketId: string) => void;
  onRefresh: () => void;
}

export function AdminTicketQueue({ tickets, onTicketClick, onRefresh }: AdminTicketQueueProps) {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && ticket.priority !== priorityFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        ticket.readableId.toLowerCase().includes(term) ||
        ticket.subject.toLowerCase().includes(term) ||
        `${ticket.createdBy.firstName} ${ticket.createdBy.lastName}`.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    waitingForCustomer: tickets.filter((t) => t.status === 'WAITING_FOR_CUSTOMER').length,
    slaBreach: tickets.filter((t) => t.slaBreach).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">إجمالي الطلبات</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">مفتوحة</p>
          <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">قيد المعالجة</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">بالانتظار</p>
          <p className="text-2xl font-bold text-purple-600">{stats.waitingForCustomer}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">تجاوز الوقت</p>
          <p className="text-2xl font-bold text-red-600">{stats.slaBreach}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="رقم الطلب، الموضوع، المستخدم..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="OPEN">مفتوحة</option>
              <option value="IN_PROGRESS">قيد المعالجة</option>
              <option value="WAITING_FOR_CUSTOMER">بانتظار العميل</option>
              <option value="WAITING_FOR_SUPPORT">بانتظار الدعم</option>
              <option value="RESOLVED">محلولة</option>
              <option value="CLOSED">مغلقة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">جميع الأولويات</option>
              <option value="CRITICAL">حرجة</option>
              <option value="HIGH">عالية</option>
              <option value="NORMAL">عادية</option>
              <option value="LOW">منخفضة</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            عرض {filteredTickets.length} من {tickets.length} طلب
          </p>
          <button
            onClick={onRefresh}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            تحديث
          </button>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">لا توجد طلبات تطابق البحث.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={onTicketClick} />
          ))}
        </div>
      )}
    </div>
  );
}
