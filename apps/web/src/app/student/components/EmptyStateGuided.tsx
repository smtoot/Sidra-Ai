import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Search, Calendar, CheckCircle, ArrowLeft, Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Mock Data for Suggestions (since API is unavailable)
const SUGGESTED_TEACHERS = [
    { id: 1, name: 'أ. محمد أحمد', subject: 'الرياضيات', rating: 4.9, image: null },
    { id: 2, name: 'أ. سارة علي', subject: 'اللغة الإنجليزية', rating: 4.8, image: null },
    { id: 3, name: 'أ. خالد عمر', subject: 'الفيزياء', rating: 5.0, image: null },
];

export function EmptyStateGuided() {
    return (
        <div className="space-y-8">
            {/* Guided Onboarding Area */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-8 md:p-12 text-center">
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                                لسه ما عندك حصص جاية
                            </h2>
                            <p className="text-gray-500 text-lg">
                                ابدأ رحلتك التعليمية في 3 خطوات بسيطة
                            </p>
                        </div>

                        {/* 3-Step Guide */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-gray-100 -z-10" />

                            <Step
                                icon={Search}
                                title="اختر المادة"
                                desc="تصفح قائمة المواد والمعلمين المتميزين"
                                number="1"
                            />
                            <Step
                                icon={Calendar}
                                title="حدد الوقت"
                                desc="اختر الموعد المناسب لجدولك"
                                number="2"
                            />
                            <Step
                                icon={CheckCircle}
                                title="احجز حصتك"
                                desc="أكد الحجز وابدأ التعلم فوراً"
                                number="3"
                            />
                        </div>

                        <div className="pt-4">
                            <Link href="/search">
                                <Button size="lg" className="w-full sm:w-auto min-w-[220px] h-12 text-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                                    احجز حصة
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Suggested Teachers */}
            <div>
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-bold text-gray-900 text-lg">معلمون مقترحون لك</h3>
                    <Link href="/search" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
                        عرض الكل
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {SUGGESTED_TEACHERS.slice(0, 3).map((teacher) => (
                        <Card key={teacher.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <Avatar
                                        fallback={teacher.name[0]}
                                        className="w-12 h-12 ring-2 ring-gray-50 group-hover:ring-primary-100 transition-all flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        {/* Name: Primary, max 2 lines */}
                                        <div className="font-bold text-gray-900 text-lg leading-tight mb-1 line-clamp-2" title={teacher.name}>
                                            {teacher.name}
                                        </div>

                                        {/* Subject: Secondary, max 1 line */}
                                        <div className="text-sm text-gray-500 mb-2 truncate" title={teacher.subject}>
                                            {teacher.subject}
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                            {/* Rating: Explicitly visible */}
                                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                <span className="text-xs font-bold text-amber-700 dir-ltr">{teacher.rating}</span>
                                            </div>

                                            {/* CTA: Single action */}
                                            <Link href={`/search?teacher=${teacher.id}`}>
                                                <Button size="sm" variant="ghost" className="h-8 px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                                                    عرض الملف
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Step({ icon: Icon, title, desc, number }: { icon: any, title: string, desc: string, number: string }) {
    return (
        <div className="flex flex-col items-center relative bg-white md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none border md:border-none border-gray-100 shadow-sm md:shadow-none">
            <div className="w-12 h-12 bg-white border-2 border-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm z-10 relative">
                <Icon className="w-6 h-6" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {number}
                </div>
            </div>
            <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        </div>
    );
}
