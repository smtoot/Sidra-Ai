'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSupportTickets, SupportTicket, TicketStatus } from '@/lib/api/support-ticket';
import { TicketList } from '@/components/support/TicketList';
import { Ticket, Clock, MessageCircle, CheckCircle2, Plus, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className={`rounded-xl border p-3 md:p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 md:gap-3">
        <div className={`p-1.5 md:p-2 rounded-lg ${iconColorClasses[color]}`}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div>
          <p className="text-xl md:text-2xl font-bold">{value}</p>
          <p className="text-xs md:text-sm opacity-80">{label}</p>
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
      setError(err.response?.data?.message || 'فشل في تحميل طلبات المساعدة');
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
    <div className="min-h-screen bg-gray-50/50 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8 space-y-4 md:space-y-6">

        {/* Clear Page Title */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <LifeBuoy className="w-5 h-5 text-primary-600 md:hidden" />
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">طلبات المساعدة</h1>
          </div>
          <p className="text-gray-500 text-xs md:text-sm">عرض وإدارة طلبات الدعم الخاصة بك</p>
        </div>

        {/* Desktop Button */}
        <div className="hidden md:block">
          <Button
            onClick={handleCreateTicket}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            طلب مساعدة جديد
          </Button>
        </div>

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <StatsCard
              icon={Ticket}
              label="إجمالي الطلبات"
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <TicketList tickets={tickets} onTicketClick={handleTicketClick} />
        )}
      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-sm border-t border-gray-100 md:hidden safe-area-bottom z-50">
        <Button
          onClick={handleCreateTicket}
          className="w-full h-11 rounded-xl gap-2 font-bold shadow-lg"
        >
          <Plus className="w-4 h-4" />
          طلب مساعدة جديد
        </Button>
      </div>
    </div>
  );
}

