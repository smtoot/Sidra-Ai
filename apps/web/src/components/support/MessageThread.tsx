'use client';

import { TicketMessage } from '@/lib/api/support-ticket';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { MessageCircle, Paperclip, Bot, Shield } from 'lucide-react';

interface MessageThreadProps {
  messages: TicketMessage[];
  currentUserId?: string;
}

export function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">لا توجد رسائل بعد</p>
        <p className="text-gray-400 text-sm mt-1">كن أول من يرد على هذا الطلب</p>
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
      case 'ADMIN': return 'فريق الدعم';
      case 'TEACHER': return 'معلم';
      case 'STUDENT': return 'طالب';
      case 'PARENT': return 'ولي أمر';
      default: return role;
    }
  };

  const getAvatarColor = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-blue-600';
      case 'TEACHER': return 'bg-emerald-600';
      case 'STUDENT': return 'bg-purple-600';
      case 'PARENT': return 'bg-amber-600';
      default: return 'bg-gray-600';
    }
  };

  const isStaffMessage = (role?: string) => role === 'ADMIN';

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isStaff = isStaffMessage(message.author.role);
        const isSystem = message.isSystemGenerated;
        const isInternal = message.isInternal;

        // System messages - centered, minimal
        if (isSystem) {
          return (
            <div key={message.id} className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-500">
                <Bot className="w-4 h-4" />
                <span>{message.content}</span>
                <span className="text-gray-400">•</span>
                <span className="text-xs">{format(new Date(message.createdAt), 'h:mm a', { locale: ar })}</span>
              </div>
            </div>
          );
        }

        // Internal notes - yellow background
        if (isInternal) {
          return (
            <div key={message.id} className="flex justify-center">
              <div className="w-full max-w-lg bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-700">ملاحظة داخلية</span>
                </div>
                <p className="text-yellow-800 text-sm">{message.content}</p>
                <p className="text-xs text-yellow-600 mt-2">
                  {getAuthorName(message.author)} • {format(new Date(message.createdAt), 'd MMM h:mm a', { locale: ar })}
                </p>
              </div>
            </div>
          );
        }

        // Regular messages - chat bubble style
        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isStaff ? 'flex-row' : 'flex-row-reverse'}`}
          >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${getAvatarColor(message.author.role)}`}>
              {getAuthorName(message.author).charAt(0).toUpperCase()}
            </div>

            {/* Message Bubble */}
            <div className={`flex-1 max-w-[80%] ${isStaff ? '' : 'flex flex-col items-end'}`}>
              {/* Author Info */}
              <div className={`flex items-center gap-2 mb-1 ${isStaff ? '' : 'flex-row-reverse'}`}>
                <span className="font-medium text-gray-900 text-sm">
                  {getAuthorName(message.author)}
                </span>
                {message.author.role && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isStaff ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {getRoleLabel(message.author.role)}
                  </span>
                )}
              </div>

              {/* Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 ${
                  isStaff
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className={`mt-3 pt-3 border-t ${isStaff ? 'border-blue-500' : 'border-gray-100'}`}>
                    <div className="flex flex-wrap gap-2">
                      {message.attachments.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                            isStaff
                              ? 'bg-blue-500 text-white hover:bg-blue-400'
                              : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
                          } transition-colors`}
                        >
                          <Paperclip className="w-3 h-3" />
                          مرفق {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <p className={`text-xs text-gray-400 mt-1 ${isStaff ? '' : 'text-left'}`}>
                {format(new Date(message.createdAt), 'd MMM yyyy h:mm a', { locale: ar })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
