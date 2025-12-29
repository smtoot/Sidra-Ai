'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupportTickets, SupportTicket } from '@/lib/api/support-ticket';
import { TicketList } from '@/components/support/TicketList';

export default function SupportPage() {
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
      const data = await getSupportTickets();
      setTickets(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل التذاكر');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = () => {
    router.push('/support/new');
  };

  const handleTicketClick = (ticketId: string) => {
    router.push(`/support/${ticketId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تذاكر الدعم</h1>
          <p className="text-gray-600 mt-1">عرض وإدارة طلبات الدعم الخاصة بك</p>
        </div>
        <button
          onClick={handleCreateTicket}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          إنشاء تذكرة
        </button>
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
        <TicketList tickets={tickets} onTicketClick={handleTicketClick} />
      )}
    </div>
  );
}
