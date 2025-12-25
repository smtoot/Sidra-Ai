'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Package, Plus, Edit2, Trash2, Check, X, Save } from 'lucide-react';

interface PackageTier {
    id: string;
    sessionCount: number;
    discountPercent: number;
    displayOrder: number;
    isActive: boolean;
}

export default function AdminPackagesPage() {
    const [tiers, setTiers] = useState<PackageTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTier, setEditingTier] = useState<PackageTier | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        sessionCount: 0,
        discountPercent: 0,
        displayOrder: 0
    });

    useEffect(() => {
        loadTiers();
    }, []);

    const loadTiers = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getPackageTiers();
            setTiers(data);
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل باقات الحصص');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createPackageTier(formData);
            toast.success('تمت إضافة الباقة بنجاح');
            setIsCreating(false);
            setFormData({ sessionCount: 0, discountPercent: 0, displayOrder: 0 });
            loadTiers();
        } catch (error) {
            console.error(error);
            toast.error('فشل إضافة الباقة');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTier) return;
        try {
            await adminApi.updatePackageTier(editingTier.id, {
                displayOrder: formData.displayOrder,
                discountPercent: formData.discountPercent
            });
            toast.success('تم تحديث الباقة بنجاح');
            setEditingTier(null);
            loadTiers();
        } catch (error) {
            console.error(error);
            toast.error('فشل تحديث الباقة');
        }
    };

    const toggleStatus = async (tier: PackageTier) => {
        try {
            await adminApi.updatePackageTier(tier.id, { isActive: !tier.isActive });
            toast.success(tier.isActive ? 'تم إيقاف الباقة' : 'تم تفعيل الباقة');
            loadTiers();
        } catch (error) {
            console.error(error);
            toast.error('فشل تغيير حالة الباقة');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
        try {
            await adminApi.deletePackageTier(id);
            toast.success('تم حذف الباقة');
            loadTiers();
        } catch (error) {
            console.error(error);
            toast.error('فشل حذف الباقة');
        }
    };

    if (loading && tiers.length === 0) return <div className="p-8 text-center text-text-subtle">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-8 h-8 text-primary" />
                            <h1 className="text-3xl font-bold text-primary">إدارة باقات الحصص</h1>
                        </div>
                        <p className="text-text-subtle">تعديل وإضافة باقات الخصم للطلاب</p>
                    </div>
                    <Button onClick={() => setIsCreating(true)} className="bg-primary text-white">
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة باقة جديدة
                    </Button>
                </header>

                {/* Create/Edit Form Overlay */}
                {(isCreating || editingTier) && (
                    <div className="bg-surface rounded-xl border border-primary/20 shadow-lg p-6 mb-8 bg-primary/5 animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            {isCreating ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                            {isCreating ? 'إضافة باقة جديدة' : 'تعديل الباقة'}
                        </h3>
                        <form onSubmit={isCreating ? handleCreate : handleUpdate} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">عدد الحصص</label>
                                <Input
                                    type="number"
                                    disabled={!!editingTier}
                                    value={isCreating ? formData.sessionCount : editingTier?.sessionCount}
                                    onChange={(e) => setFormData({ ...formData, sessionCount: Number(e.target.value) })}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">نسبة الخصم (%)</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.discountPercent}
                                    onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">الترتيب</label>
                                <Input
                                    type="number"
                                    value={formData.displayOrder}
                                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                                    className="bg-white"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" className="bg-primary text-white flex-1">
                                    {isCreating ? 'إضافة' : 'حفظ'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setEditingTier(null);
                                    }}
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tiers List */}
                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100 text-right">
                            <tr>
                                <th className="p-4 text-sm font-medium text-text-subtle">الترتيب</th>
                                <th className="p-4 text-sm font-medium text-text-subtle">عدد الحصص</th>
                                <th className="p-4 text-sm font-medium text-text-subtle">نسبة الخصم</th>
                                <th className="p-4 text-sm font-medium text-text-subtle">الحالة</th>
                                <th className="p-4 text-sm font-medium text-text-subtle text-left">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tiers.map((tier) => (
                                <tr key={tier.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 font-mono text-gray-500">#{tier.displayOrder}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-lg">{tier.sessionCount} حصص</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-bold">
                                            %{tier.discountPercent} خصم
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleStatus(tier)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${tier.isActive
                                                ? 'bg-success/10 text-success hover:bg-success/20'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            {tier.isActive ? 'نشطة' : 'متوقفة'}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-start gap-2 rtl:flex-row-reverse">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => {
                                                    setEditingTier(tier);
                                                    setFormData({
                                                        sessionCount: tier.sessionCount,
                                                        discountPercent: tier.discountPercent,
                                                        displayOrder: tier.displayOrder
                                                    });
                                                }}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(tier.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {tiers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-text-subtle">
                                        لا توجد باقات مضافة حالياً
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
