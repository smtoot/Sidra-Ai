'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GraduationCap, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Tag {
    id: string;
    labelAr: string;
    sortOrder: number;
    isActive: boolean;
}

export default function TagsPage() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);

    // Form State
    const [formData, setFormData] = useState({ labelAr: '', sortOrder: 0 });

    const loadTags = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getTeachingTags();
            setTags(data);
        } catch (error) {
            console.error('Failed to load tags:', error);
            toast.error('فشل تحميل الوسوم');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTags();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTag) {
                await adminApi.updateTeachingTag(editingTag.id, formData);
                toast.success('تم تحديث الوسم');
            } else {
                await adminApi.createTeachingTag(formData);
                toast.success('تم إنشاء الوسم');
            }
            setIsDialogOpen(false);
            setFormData({ labelAr: '', sortOrder: 0 });
            setEditingTag(null);
            loadTags();
        } catch (error) {
            console.error('Failed to save tag:', error);
            toast.error('فشل حفظ التغييرات');
        }
    };

    const handleEdit = (tag: Tag) => {
        setEditingTag(tag);
        setFormData({ labelAr: tag.labelAr, sortOrder: tag.sortOrder });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الوسم؟')) return;
        try {
            await adminApi.deleteTeachingTag(id);
            toast.success('تم حذف الوسم');
            loadTags();
        } catch (error) {
            console.error('Failed to delete tag:', error);
            toast.error('فشل حذف الوسم');
        }
    };

    const handleToggleActive = async (tag: Tag) => {
        try {
            await adminApi.updateTeachingTag(tag.id, { isActive: !tag.isActive });
            toast.success('تم تحديث حالة الوسم');
            loadTags(); // Refresh to see update
        } catch (error) {
            console.error('Failed to toggle tag:', error);
            toast.error('فشل تحديث الحالة');
        }
    };

    const openCreateDialog = () => {
        setEditingTag(null);
        setFormData({ labelAr: '', sortOrder: tags.length + 1 });
        setIsDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        إدارة وسوم التدريس
                    </h1>
                    <p className="text-gray-500 mt-1">
                        إدارة الوسوم التي تظهر في ملف المعلم (مثل: شرح مبسط، تفاعلي، إلخ)
                    </p>
                </div>
                <Button onClick={openCreateDialog} className="gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة وسم
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">الوسم (عربي)</TableHead>
                            <TableHead className="text-right">الترتيب</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tags.map((tag) => (
                            <TableRow key={tag.id}>
                                <TableCell className="font-medium">{tag.labelAr}</TableCell>
                                <TableCell>{tag.sortOrder}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={tag.isActive}
                                            onCheckedChange={() => handleToggleActive(tag)}
                                        />
                                        <span className={tag.isActive ? 'text-green-600' : 'text-gray-400'}>
                                            {tag.isActive ? 'نشط' : 'غير نشط'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(tag)}
                                        >
                                            <Pencil className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(tag.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {tags.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                    لا توجد وسوم حالياً
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingTag ? 'تعديل الوسم' : 'إضافة وسم جديد'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>نص الوسم (عربي)</Label>
                            <Input
                                value={formData.labelAr}
                                onChange={(e) => setFormData(prev => ({ ...prev, labelAr: e.target.value }))}
                                placeholder="مثال: شرح مبسط"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>الترتيب</Label>
                            <Input
                                type="number"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit">
                                حفظ
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
