'use client';

import { useRouter } from 'next/navigation';
import { CreateTicketForm } from '@/components/support/CreateTicketForm';
import { CreateSupportTicketRequest } from '@/lib/api/support-ticket';
import { createSupportTicket } from '@/lib/api/support-ticket';
import { useState } from 'react';

export default function NewTicketPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: CreateSupportTicketRequest) => {
    try {
      setSubmitting(true);
      setError(null);
      const ticket = await createSupportTicket(data);
      router.push(`/support/${ticket.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في إنشاء التذكرة');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/support');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          العودة للتذاكر
        </button>
        <h1 className="text-3xl font-bold text-gray-900">إنشاء تذكرة دعم</h1>
        <p className="text-gray-600 mt-1">صِف مشكلتك وسنساعدك في حلها</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <CreateTicketForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={submitting}
      />
    </div>
  );
}
