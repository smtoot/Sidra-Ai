'use client';

import { TicketMessage } from '@/lib/api/support-ticket';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface MessageThreadProps {
  messages: TicketMessage[];
}

export function MessageThread({ messages }: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">لا توجد رسائل بعد. كن أول من يرد!</p>
      </div>
    );
  }

  const getAuthorName = (author: TicketMessage['author']) => {
    if (author.firstName || author.lastName) {
      return `${author.firstName || ''} ${author.lastName || ''}`.trim();
    }
    return author.phoneNumber || 'مستخدم غير معروف';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'مدير';
      case 'TEACHER':
        return 'معلم';
      case 'STUDENT':
        return 'طالب';
      case 'PARENT':
        return 'ولي أمر';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-lg p-4 ${
            message.isInternal
              ? 'bg-yellow-50 border border-yellow-200'
              : message.isSystemGenerated
              ? 'bg-gray-50 border border-gray-200'
              : 'bg-white border border-gray-200'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {getAuthorName(message.author).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {getAuthorName(message.author)}
                  {message.author.role && (
                    <span className="mr-2 text-xs text-gray-500">({getRoleLabel(message.author.role)})</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(message.createdAt), 'd MMM yyyy h:mm a', { locale: ar })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {message.isInternal && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                  ملاحظة داخلية
                </span>
              )}
              {message.isSystemGenerated && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                  نظام
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mr-10">
            <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-1">
                {message.attachments.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    مرفق {index + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
