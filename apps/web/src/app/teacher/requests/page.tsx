'use client';

import { useState, useEffect } from 'react';
import { bookingApi, Booking } from '@/lib/api/booking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Clock, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeacherRequestsPage() {
    const [requests, setRequests] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await bookingApi.getTeacherRequests();
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (id: string) => {
        if (!confirm("هل أنت متأكد من قبول هذا الطلب؟")) return;

        setProcessingId(id);
        try {
            await bookingApi.approveRequest(id);
            await loadRequests();
        } catch (error) {
            console.error("Failed to approve", error);
            alert("فشل القبول");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!rejectReason) {
            alert("يرجى كتابة سبب الرفض");
            return;
        }
        if (!confirm("هل أنت متأكد من رفض هذا الطلب؟")) return;

        setProcessingId(id);
        try {
            await bookingApi.rejectRequest(id, rejectReason);
            await loadRequests();
            setRejectReason('');
        } catch (error) {
            console.error("Failed to reject", error);
            alert("فشل الرفض");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-primary">طلبات الحجز</h1>
                    <p className="text-text-subtle">طلبات الحصص المعلقة ({requests.length})</p>
                </header>

                {loading ? (
                    <div className="text-center py-12 text-text-subtle">جاري التحميل...</div>
                ) : requests.length === 0 ? (
                    <div className="bg-surface rounded-xl p-12 text-center border border-gray-100">
                        <Clock className="w-16 h-16 mx-auto text-text-subtle mb-4" />
                        <h3 className="text-xl font-bold text-primary mb-2">لا توجد طلبات معلقة</h3>
                        <p className="text-text-subtle">سيظهر هنا طلبات الحجز الجديدة</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((booking) => (
                            <div key={booking.id} className="bg-surface rounded-xl border border-gray-100 shadow-sm p-6">
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-primary">
                                                    {booking.student?.name}
                                                </h3>
                                                <p className="text-sm text-text-subtle">
                                                    ولي الأمر: {booking.parentProfile?.user?.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-primary" />
                                                <span>{new Date(booking.startTime).toLocaleDateString('ar-EG', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-primary" />
                                                <span>
                                                    {new Date(booking.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    {' - '}
                                                    {new Date(booking.endTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xl text-primary">{booking.price} SDG</span>
                                            <span className="text-xs text-text-subtle bg-gray-100 px-2 py-1 rounded">
                                                {new Date(booking.createdAt).toLocaleDateString('ar-EG')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 min-w-[200px]">
                                        <Button
                                            size="sm"
                                            className="w-full bg-success hover:bg-success/90 text-white"
                                            onClick={() => handleApprove(booking.id)}
                                            disabled={processingId === booking.id}
                                        >
                                            <Check className="w-4 h-4 ml-2" />
                                            قبول الطلب
                                        </Button>

                                        <Input
                                            placeholder="سبب الرفض..."
                                            className="h-9 text-sm"
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                        />

                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => handleReject(booking.id)}
                                            disabled={processingId === booking.id}
                                        >
                                            <X className="w-4 h-4 ml-2" />
                                            رفض الطلب
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
