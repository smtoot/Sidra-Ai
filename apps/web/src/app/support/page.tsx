'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSupportTickets, SupportTicket, TicketStatus } from '@/lib/api/support-ticket';
import { TicketList } from '@/components/support/TicketList';
import { Ticket, Clock, MessageCircle, CheckCircle2, Plus } from 'lucide-react';

interface TicketStats {
  total: number;
  open: number;
  waitingForResponse: number;
  resolved: number;
}

function StatsCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'amber' | 'orange' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    green: 'bg-green-50 text-green-600 border-green-100',
  };

  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconColorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-80">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupportTickets();
      setTickets(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل التذاكر');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo<TicketStats>(() => {
    const openStatuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_SUPPORT'];
    const resolvedStatuses: TicketStatus[] = ['RESOLVED', 'CLOSED'];

    return {
      total: tickets.length,
      open: tickets.filter(t => openStatuses.includes(t.status)).length,
      waitingForResponse: tickets.filter(t => t.status === 'WAITING_FOR_CUSTOMER').length,
      resolved: tickets.filter(t => resolvedStatuses.includes(t.status)).length,
    };
  }, [tickets]);

  const handleCreateTicket = () => {
    router.push('/support/new');
  };

  const handleTicketClick = (ticketId: string) => {
    router.push(`/support/${ticketId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تذاكر الدعم</h1>
          <p className="text-gray-600 mt-1">عرض وإدارة طلبات الدعم الخاصة بك</p>
        </div>
        <button
          onClick={handleCreateTicket}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إنشاء تذكرة
        </button>
      </div>

      {/* Stats Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={Ticket}
            label="إجمالي التذاكر"
            value={stats.total}
            color="blue"
          />
          <StatsCard
            icon={Clock}
            label="قيد المعالجة"
            value={stats.open}
            color="amber"
          />
          <StatsCard
            icon={MessageCircle}
            label="بانتظار ردك"
            value={stats.waitingForResponse}
            color="orange"
          />
          <StatsCard
            icon={CheckCircle2}
            label="تم الحل"
            value={stats.resolved}
            color="green"
          />
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <TicketList tickets={tickets} onTicketClick={handleTicketClick} />
      )}
    </div>
  );
}
