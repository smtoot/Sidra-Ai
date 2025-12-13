'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Check, X, FileText, User } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTeachersPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getPendingTeachers();
            setTeachers(data);
        } catch (error) {
            console.error("Failed to load teachers", error);
            // toast.error('فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleVerify = async (id: string) => {
        if (!confirm("هل أنت متأكد من تفعيل حساب هذا المعلم؟")) return;
        setProcessingId(id);
        try {
            await adminApi.verifyTeacher(id);
            setTeachers(prev => prev.filter(t => t.id !== id));
            alert("تم تفعيل الحساب بنجاح");
        } catch (error) {
            alert("فشل التفعيل");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("هل أنت متأكد من رفض وحذف هذا الحساب؟")) return;
        setProcessingId(id);
        try {
            await adminApi.rejectTeacher(id);
            setTeachers(prev => prev.filter(t => t.id !== id));
            alert("تم رفض الحساب وحذفه");
        } catch (error) {
            alert("فشل الرفض");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-primary">طلبات انضمام المعلمين</h1>
                    <p className="text-text-subtle">مراجعة وتفعيل حسابات المعلمين الجدد</p>
                </header>

                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm">
                    {loading ? (
                        <div className="text-center py-12 text-text-subtle">جاري التحميل...</div>
                    ) : teachers.length === 0 ? (
                        <div className="text-center py-12 text-text-subtle">لا توجد طلبات انضمام جديدة</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-4 text-sm font-medium text-text-subtle">المعلم</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">المؤهلات</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">التاريخ</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {teachers.map((teacher) => (
                                        <tr key={teacher.id} className="hover:bg-gray-50/50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-primary">
                                                            {teacher.teacherProfile?.displayName || 'بدون اسم'}
                                                        </div>
                                                        <div className="text-sm text-text-subtle">{teacher.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm">
                                                        <span className="font-bold">المواد: </span>
                                                        {teacher.teacherProfile?.subjects?.map((s: any) => s.subject?.nameAr).join(', ') || 'لا يوجد'}
                                                    </p>
                                                    <p className="text-sm text-text-subtle">
                                                        {teacher.teacherProfile?.yearsOfExperience || 0} سنوات خبرة
                                                    </p>
                                                    {teacher.teacherProfile?.documents?.length > 0 && (
                                                        <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                                                            <FileText className="w-3 h-3" />
                                                            {teacher.teacherProfile.documents.length} مرفقات
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-text-subtle">
                                                {new Date(teacher.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-success text-white hover:bg-success/90"
                                                        onClick={() => handleVerify(teacher.id)}
                                                        disabled={!!processingId}
                                                    >
                                                        <Check className="w-4 h-4 ml-2" />
                                                        تفعيل
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleReject(teacher.id)}
                                                        disabled={!!processingId}
                                                    >
                                                        <X className="w-4 h-4 ml-2" />
                                                        رفض
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
