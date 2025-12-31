'use client';

import { useState, useEffect } from 'react';
import { parentApi } from '@/lib/api/parent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, ChevronRight, GraduationCap, School, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';

export default function ChildrenManagementPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [children, setChildren] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const GRADE_LABELS: Record<string, string> = {
        KINDERGARTEN: "رياض أطفال",
        GRADE_1: "الصف الأول",
        GRADE_2: "الصف الثاني",
        GRADE_3: "الصف الثالث",
        GRADE_4: "الصف الرابع",
        GRADE_5: "الصف الخامس",
        GRADE_6: "الصف السادس",
        GRADE_7: "الصف السابع",
        GRADE_8: "الصف الثامن",
        GRADE_9: "الصف التاسع",
        GRADE_10: "الصف العاشر",
        GRADE_11: "الصف الحادي عشر",
        GRADE_12: "الصف الثاني عشر",
        // Fallbacks for raw strings
        "Grade 1": "الصف الأول",
        "Grade 2": "الصف الثاني",
        "Grade 3": "الصف الثالث",
        "Grade 4": "الصف الرابع",
        "Grade 5": "الصف الخامس",
        "Grade 6": "الصف السادس",
        "Grade 7": "الصف السابع",
        "Grade 8": "الصف الثامن",
        "Grade 9": "الصف التاسع",
        "Grade 10": "الصف العاشر",
        "Grade 11": "الصف الحادي عشر",
        "Grade 12": "الصف الثاني عشر",
    };

    useEffect(() => {
        const loadChildren = async () => {
            try {
                const data = await parentApi.getChildren();
                setChildren(data);
            } catch (error) {
                console.error("Failed to load children", error);
            } finally {
                setLoading(false);
            }
        };
        loadChildren();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-4 md:p-8" dir="rtl">
                <div className="max-w-4xl mx-auto text-center pt-20">
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">جاري تحميل بيانات الأبناء...</p>
                </div>
            </div>
        );
    }

    // EMPTY STATE (Full Page)
    if (children.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 flex items-center justify-center font-sans" dir="rtl">
                <div className="max-w-lg w-full text-center">
                    <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-12 h-12 text-primary-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">لا يوجد أبناء مضافين</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                        أضف ابنك أو ابنتك لتتمكن من حجز الحصص ومتابعة أدائهم
                    </p>

                    <div className="space-y-4">
                        <Link href="/parent/children/new" className="block w-full">
                            <Button size="lg" className="w-full gap-2 text-base h-12 shadow-md hover:shadow-lg transition-all">
                                <Plus className="w-5 h-5" />
                                إضافة ابن / ابنة
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // LIST STATE
    return (
        <div className="min-h-screen bg-gray-50/50 font-sans" dir="rtl">
            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">إدارة الأبناء</h1>
                        <p className="text-gray-600 text-sm">إدارة حسابات أبنائك ومتابعة تقدمهم الدراسي</p>
                    </div>
                    <Link href="/parent/children/new">
                        <Button className="gap-2 shadow-sm">
                            <Plus className="w-4 h-4" />
                            إضافة ابن / ابنة
                        </Button>
                    </Link>
                </div>

                {/* Children List */}
                <div className="grid gap-4">
                    {children.map((child) => (
                        <Link href={`/parent/children/${child.id}`} key={child.id}>
                            <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                <CardContent className="p-5 flex items-center gap-5">
                                    <Avatar
                                        className="w-16 h-16 bg-primary-50 text-primary-700 text-2xl font-bold border-2 border-white shadow-sm"
                                        fallback={child.name[0]}
                                    />

                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors mb-2">
                                            {child.name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                                                <GraduationCap className="w-4 h-4" />
                                                <span>{GRADE_LABELS[child.gradeLevel] || child.gradeLevel || 'غير محدد'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>حصص قادمة: {child.upcomingClassesCount || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-gray-300 group-hover:text-primary-600 group-hover:-translate-x-1 transition-all">
                                        <span className="text-sm font-medium flex items-center gap-1">
                                            عرض الملف
                                            <ChevronRight className="w-5 h-5 rotate-180" />
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

            </div>
        </div>
    );
}
