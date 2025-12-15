
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { parentApi } from '@/lib/api/parent';
import { Child } from '@/lib/api/auth';

interface ChildFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editChild?: Child | null;
}

export function ChildFormModal({ isOpen, onClose, onSuccess, editChild }: ChildFormModalProps) {
    const [name, setName] = useState('');
    const [gradeLevel, setGradeLevel] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editChild) {
                setName(editChild.name);
                setGradeLevel(editChild.gradeLevel);
            } else {
                setName('');
                setGradeLevel('');
            }
            setError('');
        }
    }, [isOpen, editChild]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !gradeLevel) return;

        setIsLoading(true);
        setError('');

        try {
            if (editChild) {
                await parentApi.updateChild(editChild.id, { name, gradeLevel });
            } else {
                await parentApi.addChild({ name, gradeLevel });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to save child:', err);
            setError(err.response?.data?.message || 'فشل الحفظ. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {editChild ? 'تعديل بيانات الابن' : 'إضافة ابن جديد'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            الاسم
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="اسم الطالب"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            المرحلة الدراسية
                        </label>
                        <select
                            value={gradeLevel}
                            onChange={(e) => setGradeLevel(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-white"
                            required
                        >
                            <option value="">اختر المرحلة...</option>
                            <option value="PRIMARY">الابتدائي</option>
                            <option value="MIDDLE">المتوسط</option>
                            <option value="HIGH">الثانوي</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                'حفظ'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
