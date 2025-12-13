'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Ban, CheckCircle, User, Shield } from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = async (query?: string) => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(query);
            setUsers(data);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData(searchQuery);
    };

    const handleToggleBan = async (id: string, currentStatus: boolean) => {
        // currentStatus = isActive
        const action = currentStatus ? "حظر" : "إلغاء حظر";
        if (!confirm(`هل أنت متأكد من ${action} هذا المستخدم؟`)) return;

        setProcessingId(id);
        try {
            await adminApi.toggleBan(id);
            // Optimistic update or reload
            setUsers(prev => prev.map(u =>
                u.id === id ? { ...u, isActive: !u.isActive } : u
            ));
        } catch (error) {
            alert("فشل تنفيذ الإجراء");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">إدارة المستخدمين</h1>
                        <p className="text-text-subtle">البحث وإدارة حسابات المستخدمين</p>
                    </div>
                </header>

                {/* Search */}
                <div className="bg-surface p-4 rounded-xl border border-gray-100 shadow-sm">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                                className="pr-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit">بحث</Button>
                    </form>
                </div>

                {/* Users Table */}
                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm">
                    {loading ? (
                        <div className="text-center py-12 text-text-subtle">جاري التحميل...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-text-subtle">لا يوجد مستخدمين مطابقين</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-4 text-sm font-medium text-text-subtle">المستخدم</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">الدور</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">الحالة</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">تاريخ الانضمام</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">
                                                            {user.teacherProfile?.displayName || user.email.split('@')[0]}
                                                        </div>
                                                        <div className="text-sm text-text-subtle">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
                                                    }`}>
                                                    {user.role === 'ADMIN' ? 'مدير' :
                                                        user.role === 'TEACHER' ? 'معلم' : 'ولي أمر'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1 text-sm ${user.isActive ? 'text-success' : 'text-error'
                                                    }`}>
                                                    {user.isActive ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                    {user.isActive ? 'نشط' : 'محظور'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-text-subtle">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                {user.role !== 'ADMIN' && (
                                                    <Button
                                                        size="sm"
                                                        variant={user.isActive ? "destructive" : "default"}
                                                        onClick={() => handleToggleBan(user.id, user.isActive)}
                                                        disabled={!!processingId}
                                                    >
                                                        {user.isActive ? (
                                                            <>
                                                                <Ban className="w-4 h-4 mr-2" />
                                                                حظر
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Shield className="w-4 h-4 mr-2" />
                                                                تفعيل
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
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
