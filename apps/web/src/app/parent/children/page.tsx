'use client';

import { useState, useEffect } from 'react';
import { parentApi } from '@/lib/api/parent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, ChevronLeft, GraduationCap, Clock } from 'lucide-react';
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
            <div className="min-h-screen bg-gray-50/50 font-sans" dir="rtl">
                <div className="max-w-lg mx-auto p-4 pt-6">
                    {/* Clear Page Title */}
                    <div className="mb-6">
                        <p className="text-xs text-gray-400 font-medium mb-0.5 md:hidden">إدارة العائلة</p>
                        <h1 className="text-lg md:text-2xl font-bold text-gray-900">إدارة الأبناء</h1>
                    </div>

                    {/* Empty State Card */}
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-primary-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">لا يوجد أبناء مضافين</h2>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                أضف ابنك لبدء حجز الحصص ومتابعة تقدمه الدراسي
                            </p>

                            <Link href="/parent/children/new" className="block">
                                <Button className="w-full h-11 gap-2 font-bold shadow-md">
                                    <Plus className="w-4 h-4" />
                                    إضافة ابن / ابنة
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // LIST STATE
    return (
        <div className="min-h-screen bg-gray-50/50 font-sans" dir="rtl">
            <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8">

                {/* Clear Page Title - Fixed for Mobile */}
                <div className="mb-4 md:mb-6">
                    <p className="text-xs text-gray-400 font-medium mb-0.5 md:hidden">إدارة العائلة</p>
                    <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-1">إدارة الأبناء</h1>
                    <p className="text-gray-500 text-xs md:text-sm">إدارة حسابات أبنائك ومتابعة تقدمهم</p>
                </div>

                {/* Children Count Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="bg-primary-50 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {children.length} {children.length === 1 ? 'ابن' : 'أبناء'}
                    </span>
                </div>

                {/* Children List - Compact Cards */}
                <div className="space-y-2 md:space-y-3">
                    {children.map((child) => (
                        <Link href={`/parent/children/${child.id}`} key={child.id} className="block">
                            <Card className="border-none shadow-sm hover:shadow-md transition-all group active:scale-[0.99]">
                                <CardContent className="p-3 md:p-4">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar - Slightly Smaller */}
                                        <Avatar
                                            className="w-10 h-10 md:w-12 md:h-12 bg-primary-50 text-primary-700 text-lg md:text-xl font-bold border-2 border-white shadow-sm flex-shrink-0"
                                            fallback={child.name[0]}
                                        />

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
                                                {child.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1 text-[11px] md:text-xs text-gray-600">
                                                    <GraduationCap className="w-3 h-3" />
                                                    <span className="truncate max-w-[100px]">{GRADE_LABELS[child.gradeLevel] || child.gradeLevel || 'غير محدد'}</span>
                                                </div>
                                                <span className="text-gray-300">•</span>
                                                <div className="flex items-center gap-1 text-[11px] md:text-xs text-blue-600 font-medium">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    <span>{child.upcomingClassesCount || 0} حصص</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chevron Affordance - Always Visible */}
                                        <div className="text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0">
                                            <ChevronLeft className="w-5 h-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Desktop Add Button */}
                <div className="hidden md:block mt-6">
                    <Link href="/parent/children/new">
                        <Button variant="outline" className="gap-2 h-11">
                            <Plus className="w-4 h-4" />
                            إضافة ابن / ابنة
                        </Button>
                    </Link>
                </div>

            </div>

            {/* Mobile Add Button - Fixed at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-sm border-t border-gray-100 md:hidden safe-area-bottom z-50">
                <Link href="/parent/children/new" className="block">
                    <Button className="w-full h-11 rounded-xl gap-2 font-bold shadow-lg">
                        <Plus className="w-4 h-4" />
                        إضافة ابن / ابنة
                    </Button>
                </Link>
            </div>
        </div>
    );
}

