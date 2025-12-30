'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, ChevronRight, BookOpen, Layers, GraduationCap, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

type Tab = 'CURRICULA' | 'STAGES' | 'GRADES' | 'SUBJECTS';

interface TabConfig {
    key: Tab;
    label: string;
    icon: React.ComponentType<any>;
}

interface FormData {
    nameAr: string;
    nameEn: string;
    code: string;
    sequence: number;
    curriculumId: string;
    stageId: string;
}

const TABS: TabConfig[] = [
    { key: 'CURRICULA', label: 'المناهج', icon: BookOpen },
    { key: 'STAGES', label: 'المراحل التعليمية', icon: Layers },
    { key: 'GRADES', label: 'الصفوف الدراسية', icon: GraduationCap },
    { key: 'SUBJECTS', label: 'المواد', icon: FileText },
];

export default function AdminContentPage() {
    const [activeTab, setActiveTab] = useState<Tab>('CURRICULA');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // Lookups
    const [curricula, setCurricula] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState<FormData>({
        nameAr: '',
        nameEn: '',
        code: '',
        sequence: 1,
        curriculumId: '',
        stageId: '',
    });

    // Load lookups on mount
    useEffect(() => {
        loadLookups();
    }, []);

    const loadLookups = async () => {
        try {
            const [currData, stageData] = await Promise.all([
                adminApi.getCurricula(true),
                adminApi.getStages(undefined, true)
            ]);
            setCurricula(currData);
            setStages(stageData);
        } catch (error) {
            console.error('Failed to load lookups', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            let data: any[] = [];
            switch (activeTab) {
                case 'CURRICULA':
                    data = await adminApi.getCurricula(true);
                    break;
                case 'STAGES':
                    data = await adminApi.getStages(undefined, true);
                    break;
                case 'GRADES':
                    data = await adminApi.getGrades(undefined, true);
                    break;
                case 'SUBJECTS':
                    data = await adminApi.getSubjects(true);
                    break;
            }
            setItems(data);
        } catch (error) {
            console.error("Failed to load content", error);
            toast.error('فشل تحميل البيانات');
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
            switch (activeTab) {
                case 'CURRICULA':
                    if (editingItem) {
                        await adminApi.updateCurriculum(editingItem.id, {
                            nameAr: formData.nameAr,
                            nameEn: formData.nameEn
                        });
                    } else {
                        await adminApi.createCurriculum({
                            nameAr: formData.nameAr,
                            nameEn: formData.nameEn,
                            code: formData.code
                        });
                    }
                    break;
                case 'STAGES':
                    if (editingItem) {
                        await adminApi.updateStage(editingItem.id, formData);
                    } else {
                        await adminApi.createStage({
                            curriculumId: formData.curriculumId,
                            nameAr: formData.nameAr,
                            nameEn: formData.nameEn,
                            sequence: Number(formData.sequence),
                        });
                    }
                    break;
                case 'GRADES':
                    if (editingItem) {
                        await adminApi.updateGrade(editingItem.id, formData);
                    } else {
                        await adminApi.createGrade({
                            stageId: formData.stageId,
                            nameAr: formData.nameAr,
                            nameEn: formData.nameEn,
                            code: formData.code,
                            sequence: Number(formData.sequence),
                        });
                    }
                    break;
                case 'SUBJECTS':
                    if (editingItem) {
                        await adminApi.updateSubject(editingItem.id, {
                            nameAr: formData.nameAr,
                            nameEn: formData.nameEn
                        });
                    } else {
                        await adminApi.createSubject({
                            nameAr: formData.nameAr,
                            nameEn: formData.nameEn
                        });
                    }
                    break;
            }
            toast.success('تم الحفظ بنجاح ✅');
            setIsModalOpen(false);
            setEditingItem(null);
            resetForm();
            loadData();
            loadLookups(); // Refresh lookups
        } catch (error: any) {
            console.error('Save failed', error);
            toast.error(error?.response?.data?.message || 'فشل الحفظ');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من الإيقاف؟")) return;
        try {
            switch (activeTab) {
                case 'CURRICULA':
                    await adminApi.deleteCurriculum(id);
                    break;
                case 'STAGES':
                    await adminApi.deleteStage(id);
                    break;
                case 'GRADES':
                    await adminApi.deleteGrade(id);
                    break;
                case 'SUBJECTS':
                    await adminApi.deleteSubject(id);
                    break;
            }
            toast.success('تم الإيقاف');
            loadData();
        } catch (error) {
            toast.error('فشل الإيقاف');
        }
    };

    const resetForm = () => {
        setFormData({
            nameAr: '',
            nameEn: '',
            code: '',
            sequence: 1,
            curriculumId: curricula[0]?.id || '',
            stageId: stages[0]?.id || '',
        });
    };

    const openModal = (item?: any) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                nameAr: item.nameAr,
                nameEn: item.nameEn,
                code: item.code || '',
                sequence: item.sequence || 1,
                curriculumId: item.curriculumId || '',
                stageId: item.stageId || '',
            });
        } else {
            setEditingItem(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    const getTabLabel = () => {
        switch (activeTab) {
            case 'CURRICULA': return 'منهج';
            case 'STAGES': return 'مرحلة';
            case 'GRADES': return 'صف';
            case 'SUBJECTS': return 'مادة';
        }
    };

    const renderTableHeaders = () => {
        switch (activeTab) {
            case 'CURRICULA':
            case 'SUBJECTS':
                return (
                    <tr>
                        <th className="p-4 text-sm font-medium text-text-subtle">الاسم (عربي)</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الاسم (إنجليزي)</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الحالة</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الإجراء</th>
                    </tr>
                );
            case 'STAGES':
                return (
                    <tr>
                        <th className="p-4 text-sm font-medium text-text-subtle">المنهج</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الاسم (عربي)</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الاسم (إنجليزي)</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الترتيب</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">عدد الصفوف</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الحالة</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الإجراء</th>
                    </tr>
                );
            case 'GRADES':
                return (
                    <tr>
                        <th className="p-4 text-sm font-medium text-text-subtle">المرحلة</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الاسم (عربي)</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الرمز</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الترتيب</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الحالة</th>
                        <th className="p-4 text-sm font-medium text-text-subtle">الإجراء</th>
                    </tr>
                );
        }
    };

    const renderTableRow = (item: any) => {
        switch (activeTab) {
            case 'CURRICULA':
            case 'SUBJECTS':
                return (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-bold text-gray-900">{item.nameAr}</td>
                        <td className="p-4 text-gray-600">{item.nameEn}</td>
                        <td className="p-4">
                            <StatusBadge isActive={item.isActive} />
                        </td>
                        <td className="p-4">
                            <ActionButtons item={item} />
                        </td>
                    </tr>
                );
            case 'STAGES':
                return (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="p-4 text-gray-600">{item.curriculum?.nameAr}</td>
                        <td className="p-4 font-bold text-gray-900">{item.nameAr}</td>
                        <td className="p-4 text-gray-600">{item.nameEn}</td>
                        <td className="p-4 text-gray-600">{item.sequence}</td>
                        <td className="p-4 text-gray-600">{item.grades?.length || 0}</td>
                        <td className="p-4">
                            <StatusBadge isActive={item.isActive} />
                        </td>
                        <td className="p-4">
                            <ActionButtons item={item} />
                        </td>
                    </tr>
                );
            case 'GRADES':
                return (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="p-4 text-gray-600">
                            <span className="text-xs text-gray-400">{item.stage?.curriculum?.nameAr}</span>
                            <ChevronRight className="inline w-3 h-3 mx-1 text-gray-400" />
                            {item.stage?.nameAr}
                        </td>
                        <td className="p-4 font-bold text-gray-900">{item.nameAr}</td>
                        <td className="p-4 text-gray-600 font-mono">{item.code}</td>
                        <td className="p-4 text-gray-600">{item.sequence}</td>
                        <td className="p-4">
                            <StatusBadge isActive={item.isActive} />
                        </td>
                        <td className="p-4">
                            <ActionButtons item={item} />
                        </td>
                    </tr>
                );
        }
    };

    const StatusBadge = ({ isActive }: { isActive: boolean }) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isActive ? 'نشط' : 'غير نشط'}
        </span>
    );

    const ActionButtons = ({ item }: { item: any }) => (
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => openModal(item)}>
                <Edit className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );

    const renderModalForm = () => {
        return (
            <form onSubmit={handleSave} className="space-y-4">
                {/* Parent selector for Stages */}
                {activeTab === 'STAGES' && (
                    <div>
                        <label className="block text-sm font-medium mb-1">المنهج</label>
                        <select
                            value={formData.curriculumId}
                            onChange={(e) => setFormData(prev => ({ ...prev, curriculumId: e.target.value }))}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">-- اختر المنهج --</option>
                            {curricula.filter(c => c.isActive).map(c => (
                                <option key={c.id} value={c.id}>{c.nameAr}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Parent selector for Grades */}
                {activeTab === 'GRADES' && (
                    <div>
                        <label className="block text-sm font-medium mb-1">المرحلة التعليمية</label>
                        <select
                            value={formData.stageId}
                            onChange={(e) => setFormData(prev => ({ ...prev, stageId: e.target.value }))}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">-- اختر المرحلة --</option>
                            {stages.filter(s => s.isActive).map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.curriculum?.nameAr} → {s.nameAr}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">الاسم بالعربية</label>
                    <Input
                        value={formData.nameAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                        required
                        placeholder={activeTab === 'GRADES' ? 'مثال: الصف الأول' : 'مثال: المرحلة الابتدائية'}
                        dir="rtl"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">الاسم بالإنجليزية</label>
                    <Input
                        value={formData.nameEn}
                        onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                        required
                        placeholder={activeTab === 'GRADES' ? 'Ex: Grade 1' : 'Ex: Primary Stage'}
                        dir="ltr"
                    />
                </div>

                {/* Code field for Curricula and Grades */}
                {(activeTab === 'CURRICULA' || activeTab === 'GRADES') && (
                    <div>
                        <label className="block text-sm font-medium mb-1">الرمز {activeTab === 'GRADES' ? '(مثل G1, G2)' : '(مثل NAT, IB)'}</label>
                        <Input
                            value={formData.code}
                            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                            required
                            placeholder={activeTab === 'GRADES' ? "G1" : "NAT"}
                            dir="ltr"
                            className="font-mono"
                        />
                    </div>
                )}

                {/* Sequence for Stages and Grades */}
                {(activeTab === 'STAGES' || activeTab === 'GRADES') && (
                    <div>
                        <label className="block text-sm font-medium mb-1">الترتيب</label>
                        <Input
                            type="number"
                            min="1"
                            value={formData.sequence}
                            onChange={(e) => setFormData(prev => ({ ...prev, sequence: parseInt(e.target.value) || 1 }))}
                            required
                        />
                    </div>
                )}

                <Button type="submit" className="w-full">حفظ</Button>
            </form>
        );
    };

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">إدارة المحتوى</h1>
                        <p className="text-text-subtle">المناهج والمراحل والصفوف والمواد الدراسية</p>
                    </div>
                    <Button onClick={() => openModal()} className="bg-primary text-white">
                        <Plus className="w-5 h-5 ml-2" />
                        إضافة {getTabLabel()}
                    </Button>
                </header>

                {/* Tabs */}
                <div className="flex bg-surface rounded-lg p-1 w-fit border border-gray-100">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${activeTab === tab.key
                                    ? 'bg-primary text-white shadow'
                                    : 'text-text-subtle hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Table */}
                <div className="bg-surface rounded-xl border border-gray-100 shadow-sm">
                    {loading ? (
                        <div className="text-center py-12 text-text-subtle">جاري التحميل...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-text-subtle">
                            <p className="text-lg">لا يوجد بيانات</p>
                            <p className="text-sm text-gray-400 mt-1">اضغط على زر الإضافة للبدء</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 border-b">
                                    {renderTableHeaders()}
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map(item => renderTableRow(item))}
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
                                {editingItem ? 'تعديل' : 'إضافة'} {getTabLabel()}
                            </DialogTitle>
                        </DialogHeader>
                        {renderModalForm()}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
