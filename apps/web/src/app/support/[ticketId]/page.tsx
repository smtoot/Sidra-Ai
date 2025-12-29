'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getSupportTicket,
  closeSupportTicket,
  reopenSupportTicket,
  addTicketMessage,
  SupportTicketDetail,
  CreateMessageRequest,
} from '@/lib/api/support-ticket';
import { TicketDetail } from '@/components/support/TicketDetail';
import { MessageThread } from '@/components/support/MessageThread';
import { MessageForm } from '@/components/support/MessageForm';

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupportTicket(ticketId);
      setTicket(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل التذكرة');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('هل أنت متأكد من إغلاق هذه التذكرة؟')) return;

    try {
      setActionLoading(true);
      const updated = await closeSupportTicket(ticketId);
      setTicket(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل في إغلاق التذكرة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    try {
      setActionLoading(true);
      const updated = await reopenSupportTicket(ticketId);
      setTicket(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل في إعادة فتح التذكرة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMessage = async (data: CreateMessageRequest) => {
    try {
      await addTicketMessage(ticketId, data);
      // Reload ticket to get updated messages
      await loadTicket();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'فشل في إرسال الرسالة');
    }
  };

  const handleBack = () => {
    router.push('/support');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error || 'التذكرة غير موجودة'}
        </div>
        <button
          onClick={handleBack}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          العودة للتذاكر
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <button
        onClick={handleBack}
        className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
      >
        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        العودة للتذاكر
      </button>

      <TicketDetail
        ticket={ticket}
        onClose={handleClose}
        onReopen={handleReopen}
        actionLoading={actionLoading}
      />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">الرسائل</h2>
        <MessageThread messages={ticket.messages} />

        {ticket.status !== 'CLOSED' && (
          <div className="mt-6">
            <MessageForm onSubmit={handleAddMessage} />
          </div>
        )}
      </div>
    </div>
  );
}
