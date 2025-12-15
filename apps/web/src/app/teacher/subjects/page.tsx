'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { teacherApi } from '@/lib/api/teacher';
import { marketplaceApi } from '@/lib/api/marketplace';
import { Plus, Trash2, BookOpen, DollarSign } from 'lucide-react';

interface TeacherSubject {
    id: string;
    subjectId: string;
    curriculumId: string;
    pricePerHour: number;
    subject?: { nameAr: string };
    curriculum?: { nameAr: string };
}

interface Curriculum {
    id: string;
    nameAr: string;
}

interface Subject {
    id: string;
    nameAr: string;
}

export default function TeacherSubjectsPage() {
    const [mySubjects, setMySubjects] = useState<TeacherSubject[]>([]);
    const [curricula, setCurricula] = useState<Curriculum[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    // Form state
    const [selectedCurriculum, setSelectedCurriculum] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [price, setPrice] = useState(0);

    useEffect(() => {
        setIsMounted(true);
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profile, currData, subjData] = await Promise.all([
                teacherApi.getProfile(),
                marketplaceApi.getCurricula(),
                marketplaceApi.getSubjects()
            ]);
            setMySubjects(profile.subjects || []);
            setCurricula(currData);
            setSubjects(subjData);
        } catch (err) {
            console.error('Failed to load data', err);
            setError('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubject = async () => {
        if (!selectedSubject || !selectedCurriculum || price <= 0) {
            setError('الرجاء تعبئة جميع الحقول');
            return;
        }

        // Check for duplicate
        const duplicate = mySubjects.find(
            s => s.subjectId === selectedSubject && s.curriculumId === selectedCurriculum
        );
        if (duplicate) {
            setError('هذه المادة مضافة مسبقاً');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await teacherApi.addSubject({
                subjectId: selectedSubject,
                curriculumId: selectedCurriculum,
                pricePerHour: Number(price),
                gradeLevels: ['All']
            });
            await loadData();
            setSelectedSubject('');
            setPrice(0);
        } catch (err) {
            console.error('Failed to add subject', err);
            setError('فشل في إضافة المادة');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSubject = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;

        setLoading(true);
        try {
            await teacherApi.removeSubject(id);
            setMySubjects(mySubjects.filter(s => s.id !== id));
        } catch (err) {
            console.error('Failed to remove subject', err);
            setError('فشل في حذف المادة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 font-tajawal" dir="rtl">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <BookOpen className="w-6 h-6" />
                    المواد والأسعار
                </h1>
                <p className="text-text-subtle mt-1">أضف المواد التي تدرّسها وحدد سعرك لكل ساعة</p>
            </header>

            {/* Add Subject Form */}
            <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                <h2 className="font-bold mb-4">إضافة مادة جديدة</h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <Label>المنهج</Label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={selectedCurriculum}
                            onChange={(e) => setSelectedCurriculum(e.target.value)}
                        >
                            <option value="">اختر المنهج</option>
                            {isMounted && curricula.map(c => (
                                <option key={c.id} value={c.id}>{c.nameAr}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label>المادة</Label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <option value="">اختر المادة</option>
                            {isMounted && subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.nameAr}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label>سعر الساعة (SDG)</Label>
                        <Input
                            type="number"
                            min={0}
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            placeholder="مثال: 5000"
                        />
                    </div>
                    <div className="flex items-end">
                        <Button onClick={handleAddSubject} disabled={loading} className="w-full gap-2">
                            <Plus className="w-4 h-4" />
                            إضافة
                        </Button>
                    </div>
                </div>
            </div>

            {/* Current Subjects */}
            <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="font-bold mb-4">المواد المضافة</h2>

                {loading && mySubjects.length === 0 ? (
                    <p className="text-center text-text-subtle py-8">جاري التحميل...</p>
                ) : mySubjects.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-text-subtle mb-2">لم تقم بإضافة أي مواد بعد</p>
                        <p className="text-sm text-gray-400">أضف المواد التي تدرّسها ليتمكن الطلاب من العثور عليك</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {mySubjects.map(item => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-primary">{item.subject?.nameAr || 'مادة'}</p>
                                        <p className="text-sm text-text-subtle">{item.curriculum?.nameAr || 'منهج'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-left">
                                        <p className="font-bold text-accent flex items-center gap-1">
                                            <DollarSign className="w-4 h-4" />
                                            {item.pricePerHour} SDG
                                        </p>
                                        <p className="text-xs text-text-subtle">للساعة</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveSubject(item.id)}
                                        className="text-red-500 hover:bg-red-50"
                                        disabled={loading}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
