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
import { ArrowRight, MessageCircle, Loader2 } from 'lucide-react';

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">جاري تحميل التذكرة...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-4">{error || 'التذكرة غير موجودة'}</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للتذاكر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowRight className="w-5 h-5" />
        <span>العودة للتذاكر</span>
      </button>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Ticket Details */}
        <TicketDetail
          ticket={ticket}
          onClose={handleClose}
          onReopen={handleReopen}
          actionLoading={actionLoading}
        />

        {/* Conversation Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Section Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">المحادثة</h2>
            {ticket.messages.length > 0 && (
              <span className="text-sm text-gray-400">({ticket.messages.length} رسالة)</span>
            )}
          </div>

          {/* Messages */}
          <div className="p-4 bg-gray-50/50 min-h-[200px] max-h-[500px] overflow-y-auto">
            <MessageThread messages={ticket.messages} />
          </div>

          {/* Message Form */}
          {ticket.status !== 'CLOSED' && ticket.status !== 'CANCELLED' ? (
            <div className="border-t border-gray-200">
              <MessageForm onSubmit={handleAddMessage} />
            </div>
          ) : (
            <div className="px-4 py-6 bg-gray-50 border-t border-gray-200 text-center">
              <p className="text-gray-500 text-sm">
                هذه التذكرة مغلقة. لا يمكن إضافة رسائل جديدة.
              </p>
              {ticket.type === 'SUPPORT' && (
                <button
                  onClick={handleReopen}
                  disabled={actionLoading}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  إعادة فتح التذكرة
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
