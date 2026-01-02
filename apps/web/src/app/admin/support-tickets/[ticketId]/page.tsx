'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getAdminSupportTicket,
  updateSupportTicket,
  assignSupportTicket,
  escalateSupportTicket,
  addInternalNote,
  addTicketMessage,
  SupportTicketDetail,
  UpdateSupportTicketRequest,
  AssignTicketRequest,
  CreateMessageRequest,
} from '@/lib/api/support-ticket';
import { TicketDetail } from '@/components/support/TicketDetail';
import { MessageThread } from '@/components/support/MessageThread';
import { MessageForm } from '@/components/support/MessageForm';
import { TicketUpdateForm } from '@/components/admin/support/TicketUpdateForm';
import { TicketAssignmentModal } from '@/components/admin/support/TicketAssignmentModal';
import { InternalNoteForm } from '@/components/admin/support/InternalNoteForm';

export default function AdminTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminSupportTicket(ticketId);
      setTicket(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل طلب المساعدة');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: UpdateSupportTicketRequest) => {
    try {
      setActionLoading(true);
      const updated = await updateSupportTicket(ticketId, data);
      setTicket(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل في تحديث طلب المساعدة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (data: AssignTicketRequest) => {
    try {
      setActionLoading(true);
      const updated = await assignSupportTicket(ticketId, data);
      setTicket(updated);
      setShowAssignModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل في تعيين طلب المساعدة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!confirm('هل أنت متأكد من رغبتك في تصعيد هذا الطلب؟')) return;

    try {
      setActionLoading(true);
      const updated = await escalateSupportTicket(ticketId);
      setTicket(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل في تصعيد طلب المساعدة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddInternalNote = async (data: CreateMessageRequest) => {
    try {
      await addInternalNote(ticketId, data);
      await loadTicket();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'فشل في إضافة الملاحظة الداخلية');
    }
  };

  const handleAddMessage = async (data: CreateMessageRequest) => {
    try {
      await addTicketMessage(ticketId, data);
      await loadTicket();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'فشل في إرسال الرسالة');
    }
  };

  const handleBack = () => {
    router.push('/admin/support-tickets');
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
          {error || 'طلب المساعدة غير موجود'}
        </div>
        <button
          onClick={handleBack}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          العودة لطلبات المساعدة
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button
        onClick={handleBack}
        className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
      >
        <svg className="w-5 h-5 ml-1 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        العودة لطلبات المساعدة
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <TicketDetail
            ticket={ticket}
            onClose={() => handleUpdate({ status: 'CLOSED' as any })}
            onReopen={() => handleUpdate({ status: 'OPEN' as any })}
            actionLoading={actionLoading}
          />

          <div>
            <h2 className="text-xl font-semibold mb-4">الرسائل</h2>
            <MessageThread messages={ticket.messages} />

            {ticket.status !== 'CLOSED' && (
              <div className="mt-6 space-y-4">
                <MessageForm onSubmit={handleAddMessage} />
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">إضافة ملاحظة داخلية</h3>
                  <InternalNoteForm onSubmit={handleAddInternalNote} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <TicketUpdateForm
            ticket={ticket}
            onUpdate={handleUpdate}
            onEscalate={handleEscalate}
            onAssign={() => setShowAssignModal(true)}
            loading={actionLoading}
          />
        </div>
      </div>

      {showAssignModal && (
        <TicketAssignmentModal
          onAssign={handleAssign}
          onClose={() => setShowAssignModal(false)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
