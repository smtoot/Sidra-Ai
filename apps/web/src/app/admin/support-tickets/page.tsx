'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminSupportTickets, SupportTicket, TicketStatus, TicketPriority } from '@/lib/api/support-ticket';
import { AdminTicketQueue } from '@/components/admin/support/AdminTicketQueue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-radix';
import { useAuth } from '@/context/AuthContext';

export default function AdminSupportTicketsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsPermissionError(false);
      const data = await getAdminSupportTickets();
      setTickets(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsPermissionError(true);
        setError('ليس لديك الصلاحية للوصول إلى هذه الصفحة. يرجى مراجعة المسؤول.');
      } else {
        setError(err.response?.data?.message || 'فشل في تحميل طلبات المساعدة');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = (ticketId: string) => {
    router.push(`/admin/support-tickets/${ticketId}`);
  };

  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Filter by Status
    if (statusFilter !== 'ALL') {
      result = result.filter(t => t.status === statusFilter);
    }

    return result;
  }, [tickets, statusFilter]);

  const myAssignments = useMemo(() =>
    filteredTickets.filter(t => t.assignedTo?.id === user?.id),
    [filteredTickets, user?.id]);

  const unassignedTickets = useMemo(() =>
    filteredTickets.filter(t => !t.assignedTo),
    [filteredTickets]);

  if (isPermissionError) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-8v6m0 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">تم رفض الوصول</h1>
        <p className="text-gray-600 max-w-md">
          ليس لديك الصلاحيات الكافية لعرض تذاكر الدعم الفني. يرجى التواصل مع المسؤول الرئيسي لتحديث صلاحياتك.
        </p>
        <button
          onClick={() => router.push('/admin')}
          className="mt-6 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          العودة للوحة التحكم
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">طلبات المساعدة</h1>
          <p className="text-gray-600 mt-1">إدارة والرد على طلبات مساعدة المستخدمين</p>
        </div>

        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">جميع الحالات</SelectItem>
              <SelectItem value="OPEN">مفتوحة</SelectItem>
              <SelectItem value="IN_PROGRESS">قيد المعالجة</SelectItem>
              <SelectItem value="WAITING_FOR_CUSTOMER">بانتظار العميل</SelectItem>
              <SelectItem value="RESOLVED">تم الحل</SelectItem>
              <SelectItem value="CLOSED">مغلقة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && !isPermissionError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <Tabs defaultValue="unassigned" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="unassigned" className="text-lg">
              غير مسندة
              {unassignedTickets.length > 0 && (
                <span className="mr-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{unassignedTickets.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-assignments" className="text-lg">
              مهامي
              {myAssignments.length > 0 && (
                <span className="mr-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">{myAssignments.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="text-lg">الكل ({filteredTickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="unassigned">
            {unassignedTickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                لا توجد تذاكر غير مسندة حالياً
              </div>
            ) : (
              <AdminTicketQueue tickets={unassignedTickets} onTicketClick={handleTicketClick} onRefresh={loadTickets} />
            )}
          </TabsContent>

          <TabsContent value="my-assignments">
            {myAssignments.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                لا توجد تذاكر مسندة إليك
              </div>
            ) : (
              <AdminTicketQueue tickets={myAssignments} onTicketClick={handleTicketClick} onRefresh={loadTickets} />
            )}
          </TabsContent>

          <TabsContent value="all">
            <AdminTicketQueue tickets={filteredTickets} onTicketClick={handleTicketClick} onRefresh={loadTickets} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
