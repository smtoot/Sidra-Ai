'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminSupportTickets, SupportTicket } from '@/lib/api/support-ticket';
import { AdminTicketQueue } from '@/components/admin/support/AdminTicketQueue';

export default function AdminSupportTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminSupportTickets();
      setTickets(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل طلبات المساعدة');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = (ticketId: string) => {
    router.push(`/admin/support-tickets/${ticketId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">طلبات المساعدة</h1>
        <p className="text-gray-600 mt-1">إدارة والرد على طلبات مساعدة المستخدمين</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <AdminTicketQueue tickets={tickets} onTicketClick={handleTicketClick} onRefresh={loadTickets} />
      )}
    </div>
  );
}
