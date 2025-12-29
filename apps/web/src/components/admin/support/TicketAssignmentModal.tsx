'use client';

import { useState, useEffect } from 'react';
import { AssignTicketRequest } from '@/lib/api/support-ticket';
import { adminApi } from '@/lib/api/admin';

interface TicketAssignmentModalProps {
  onAssign: (data: AssignTicketRequest) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

interface AdminUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
}

export function TicketAssignmentModal({ onAssign, onClose, loading }: TicketAssignmentModalProps) {
  const [assignedToId, setAssignedToId] = useState('');
  const [agents, setAgents] = useState<AdminUser[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoadingAgents(true);
      // Get admin users with support roles
      const users = await adminApi.getUsers();
      const supportAgents = users.filter((u: AdminUser) =>
        ['SUPPORT', 'ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(u.role)
      );
      setAgents(supportAgents);
    } catch (err) {
      console.error('Failed to load support agents:', err);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedToId) return;
    await onAssign({ assignedToId });
  };

  const getUserName = (user: AdminUser) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'مدير';
      case 'SUPER_ADMIN':
        return 'مدير عام';
      case 'SUPPORT':
        return 'دعم';
      case 'MODERATOR':
        return 'مشرف';
      default:
        return role;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">تعيين التذكرة</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {loadingAgents ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">جاري تحميل الوكلاء...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">لا يوجد وكلاء دعم متاحين</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تعيين إلى وكيل
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">اختر وكيلاً...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {getUserName(agent)} ({getRoleLabel(agent.role)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading || !assignedToId || loadingAgents}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'جاري التعيين...' : 'تعيين'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
