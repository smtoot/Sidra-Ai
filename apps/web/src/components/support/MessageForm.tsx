'use client';

import { useState } from 'react';
import { CreateMessageRequest } from '@/lib/api/support-ticket';

interface MessageFormProps {
  onSubmit: (data: CreateMessageRequest) => Promise<void>;
}

export function MessageForm({ onSubmit }: MessageFormProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('محتوى الرسالة مطلوب');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        content: content.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      // Clear form on success
      setContent('');
      setAttachments([]);
      setAttachmentInput('');
    } catch (err: any) {
      setError(err.message || 'فشل إرسال الرسالة');
    } finally{
      setSubmitting(false);
    }
  };

  const handleAddAttachment = () => {
    if (attachmentInput.trim() && attachments.length < 10) {
      setAttachments([...attachments, attachmentInput.trim()]);
      setAttachmentInput('');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Message Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رسالتك
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={5000}
            placeholder="اكتب رسالتك هنا..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">{content.length}/5000 حرف</p>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المرفقات (اختياري)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={attachmentInput}
              onChange={(e) => setAttachmentInput(e.target.value)}
              placeholder="https://example.com/file.png"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddAttachment}
              disabled={!attachmentInput.trim() || attachments.length >= 10}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إضافة
            </button>
          </div>
          {attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {attachments.map((url, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm text-gray-700 truncate">{url}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">{attachments.length}/10 مرفقات</p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
          </button>
        </div>
      </div>
    </form>
  );
}
