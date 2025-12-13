'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Check, X, BookOpen, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Tab = 'CURRICULA' | 'SUBJECTS';

export default function AdminContentPage() {
    const [activeTab, setActiveTab] = useState<Tab>('CURRICULA');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // Form State
    const [formData, setFormData] = useState({ nameAr: '', nameEn: '' });

    const loadData = async () => {
        setLoading(true);
        try {
            const data = activeTab === 'CURRICULA'
                ? await adminApi.getCurricula(true) // Fetch all, including inactive
                : await adminApi.getSubjects(true);
            setItems(data);
        } catch (error) {
            console.error("Failed to load content", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (activeTab === 'CURRICULA') {
                if (editingItem) {
                    await adminApi.updateCurriculum(editingItem.id, formData);
                } else {
                    await adminApi.createCurriculum(formData);
                }
            } else {
                if (editingItem) {
                    await adminApi.updateSubject(editingItem.id, formData);
                } else {
                    await adminApi.createSubject(formData);
                }
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({ nameAr: '', nameEn: '' });
            loadData();
        } catch (error) {
            alert("فشل الحفظ");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من الحذف؟")) return;
        try {
            if (activeTab === 'CURRICULA') {
                await adminApi.deleteCurriculum(id);
            } else {
                await adminApi.deleteSubject(id);
            }
            loadData();
        } catch (error) {
            alert("فشل الحذف");
        }
    };

    const openModal = (item?: any) => {
        if (item) {
            setEditingItem(item);
            setFormData({ nameAr: item.nameAr, nameEn: item.nameEn });
        } else {
            setEditingItem(null);
            setFormData({ nameAr: '', nameEn: '' });
        }
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">إدارة المحتوى</h1>
                        <p className="text-text-subtle">المناهج والمواد الدراسية</p>
                    </div>
                    <Button onClick={() => openModal()} className="bg-primary text-white">
                        <Plus className="w-5 h-5 ml-2" />
                        إضافة {activeTab === 'CURRICULA' ? 'منهج' : 'مادة'}
                    </Button>
                </header>

                {/* Tabs */}
                <div className="flex bg-surface rounded-lg p-1 w-fit border border-gray-100">
                    <button
                        onClick={() => setActiveTab('CURRICULA')}
                        className={`px-6 py-2 rounded-md transition-all ${activeTab === 'CURRICULA' ? 'bg-primary text-white shadow' : 'text-text-subtle hover:bg-gray-50'}`}
                    >
                        المناهج الدراسية
                    </button>
                    <button
                        onClick={() => setActiveTab('SUBJECTS')}
                        className={`px-6 py-2 rounded-md transition-all ${activeTab === 'SUBJECTS' ? 'bg-primary text-white shadow' : 'text-text-subtle hover:bg-gray-50'}`}
                    >
                        المواد الدراسية
                    </button>
                </div>

                {/* Table */}
                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm">
                    {loading ? (
                        <div className="text-center py-12 text-text-subtle">جاري التحميل...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-text-subtle">لا يوجد بيانات</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-4 text-sm font-medium text-text-subtle">الاسم (عربي)</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">الاسم (إنجليزي)</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">الحالة</th>
                                        <th className="p-4 text-sm font-medium text-text-subtle">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                            <td className="p-4 font-bold text-gray-900">{item.nameAr}</td>
                                            <td className="p-4 text-gray-600">{item.nameEn}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {item.isActive ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => openModal(item)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="w-4 h-4" />
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

                {/* Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? 'تعديل' : 'إضافة'} {activeTab === 'CURRICULA' ? 'منهج' : 'مادة'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">الاسم بالعربية</label>
                                <Input
                                    value={formData.nameAr}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                                    required
                                    placeholder="مثال: المنهج البريطاني"
                                    dir="rtl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">الاسم بالإنجليزية</label>
                                <Input
                                    value={formData.nameEn}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                                    required
                                    placeholder="Ex: British Curriculum"
                                    dir="ltr"
                                />
                            </div>
                            <Button type="submit" className="w-full">حفظ</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
