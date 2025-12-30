'use client';

import { useState } from 'react';
import { CreateMessageRequest } from '@/lib/api/support-ticket';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';

interface MessageFormProps {
  onSubmit: (data: CreateMessageRequest) => Promise<void>;
}

export function MessageForm({ onSubmit }: MessageFormProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
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
      setShowAttachments(false);
    } catch (err: any) {
      setError(err.message || 'فشل إرسال الرسالة');
    } finally {
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
    if (attachments.length <= 1) {
      setShowAttachments(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {error && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Attachments Area */}
        {showAttachments && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={attachmentInput}
                onChange={(e) => setAttachmentInput(e.target.value)}
                placeholder="https://example.com/file.png"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAttachment();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                disabled={!attachmentInput.trim() || attachments.length >= 10}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                إضافة
              </button>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((url, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-sm"
                  >
                    <Paperclip className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-700 max-w-[150px] truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">{attachments.length}/10 مرفقات</p>
          </div>
        )}

        {/* Message Input Area */}
        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            maxLength={5000}
            placeholder="اكتب رسالتك هنا..."
            className="w-full px-0 py-0 border-0 focus:ring-0 resize-none text-gray-800 placeholder-gray-400"
            disabled={submitting}
          />
        </div>

        {/* Bottom Bar */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAttachments(!showAttachments)}
              className={`p-2 rounded-lg transition-colors ${
                showAttachments || attachments.length > 0
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="إضافة مرفقات"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            {attachments.length > 0 && (
              <span className="text-xs text-gray-500">{attachments.length} مرفق</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{content.length}/5000</span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإرسال
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  إرسال
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
