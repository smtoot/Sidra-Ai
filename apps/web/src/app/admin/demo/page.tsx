'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlayCircle, Users, Calendar, CheckCircle, Clock, User } from 'lucide-react';

export default function AdminDemoPage() {
    const [stats, setStats] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, sessionsData] = await Promise.all([
                adminApi.getDemoStats(),
                adminApi.getDemoSessions()
            ]);
            setStats(statsData);
            setSessions(sessionsData);
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل بيانات الحصص التجريبية');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-subtle">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header>
                    <div className="flex items-center gap-2 mb-2">
                        <PlayCircle className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold text-primary">إدارة الحصص التجريبية</h1>
                    </div>
                    <p className="text-text-subtle">متابعة أداء الحصص التجريبية المجانية</p>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="معلمون يوفرون حصص تجريبية"
                        value={stats?.demoEnabledCount || 0}
                        icon={Users}
                        color="bg-blue-500"
                        subtext="عدد المعلمين المفعلين للميزة"
                    />
                    <StatsCard
                        title="إجمالي الحصص التجريبية"
                        value={sessions.length}
                        icon={Calendar}
                        color="bg-purple-500"
                        subtext="المسجلة في النظام"
                    />
                    <StatsCard
                        title="الحصص المكتملة"
                        value={sessions.filter(s => s.usedAt).length}
                        icon={CheckCircle}
                        color="bg-success"
                        subtext={`${((sessions.filter(s => s.usedAt).length / (sessions.length || 1)) * 100).toFixed(1)}% نسبة الاستخدام`}
                    />
                </div>

                {/* Sessions List */}
                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold">آخر الحصص التجريبية</h2>
                        <Button onClick={loadData} variant="ghost" size="sm">تحديث</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-right">
                                <tr>
                                    <th className="p-4 text-sm font-medium text-text-subtle">الطالب</th>
                                    <th className="p-4 text-sm font-medium text-text-subtle">المعلم</th>
                                    <th className="p-4 text-sm font-medium text-text-subtle">التاريخ</th>
                                    <th className="p-4 text-sm font-medium text-text-subtle">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <div className="font-bold">{session.student.email}</div>
                                                    <div className="text-xs text-gray-500">{session.student.phoneNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-primary">{session.teacher.displayName}</div>
                                        </td>
                                        <td className="p-4 text-sm text-text-subtle">
                                            {new Date(session.createdAt).toLocaleDateString('ar-EG', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="p-4">
                                            {session.usedAt ? (
                                                <span className="flex items-center gap-1 text-success text-sm font-medium">
                                                    <CheckCircle className="w-4 h-4" />
                                                    تمت الاستفادة
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-warning text-sm font-medium">
                                                    <Clock className="w-4 h-4" />
                                                    بانتظار الحضور
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {sessions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-text-subtle">
                                            لا توجد حصص تجريبية مسجلة بعد
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color, subtext }: any) {
    return (
        <div className="bg-surface p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-text-subtle text-sm font-medium mb-1">{title}</h3>
                    <div className="text-3xl font-bold text-gray-900">{value}</div>
                </div>
                <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-${color.replace('bg-', '')}`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
            </div>
            {subtext && <div className="text-xs text-gray-400">{subtext}</div>}
        </div>
    );
}
