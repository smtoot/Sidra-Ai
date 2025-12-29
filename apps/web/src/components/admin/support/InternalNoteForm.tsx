'use client';

import { useState } from 'react';
import { CreateMessageRequest } from '@/lib/api/support-ticket';

interface InternalNoteFormProps {
  onSubmit: (data: CreateMessageRequest) => Promise<void>;
}

export function InternalNoteForm({ onSubmit }: InternalNoteFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('محتوى الملاحظة مطلوب');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({ content: content.trim() });
      setContent('');
    } catch (err: any) {
      setError(err.message || 'فشل في إضافة الملاحظة الداخلية');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="أضف ملاحظة داخلية (مرئية فقط لفريق الدعم)..."
        className="w-full px-3 py-2 text-sm border border-yellow-300 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
      />
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">{content.length}/5000 حرف</p>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {submitting ? 'جاري الإضافة...' : 'إضافة ملاحظة داخلية'}
        </button>
      </div>
    </form>
  );
}
