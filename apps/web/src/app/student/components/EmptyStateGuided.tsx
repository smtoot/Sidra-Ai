import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Search, Calendar, CheckCircle, ArrowLeft, Star, Clock } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateGuidedProps {
    suggestedTeachers: any[];
}

export function EmptyStateGuided({ suggestedTeachers = [] }: EmptyStateGuidedProps) {
    const filteredTeachers = suggestedTeachers.filter(teacher => teacher);
    const hasSingleTeacher = filteredTeachers.length === 1;

    return (
        <div className="space-y-4 md:space-y-8">
            {/* Guided Onboarding Area - Hero Section */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-4 md:p-12 text-center">
                    <div className="max-w-2xl mx-auto space-y-3 md:space-y-8">
                        <div>
                            <h2 className="text-lg md:text-3xl font-bold text-gray-900 mb-1 md:mb-3">
                                لسه ما عندك حصص جاية
                            </h2>
                            <p className="text-gray-500 text-xs md:text-lg">
                                ابدأ رحلتك التعليمية في 3 خطوات بسيطة
                            </p>
                        </div>

                        {/* 3-Step Guide - Compact on mobile */}
                        <div className="grid grid-cols-3 gap-1 md:gap-6 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-gray-100 -z-10" />

                            <Step
                                icon={Search}
                                title="اختر المادة"
                                desc="تصفح المعلمين المتميزين"
                                number="1"
                            />
                            <Step
                                icon={Calendar}
                                title="حدد الوقت"
                                desc="اختر الموعد المناسب"
                                number="2"
                            />
                            <Step
                                icon={CheckCircle}
                                title="احجز حصتك"
                                desc="أكد وابدأ التعلم"
                                number="3"
                            />
                        </div>

                        {/* Desktop CTA only - mobile uses sticky CTA */}
                        <div className="pt-4 hidden md:block">
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
            {filteredTeachers.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-bold text-gray-900 text-sm md:text-lg">معلمون مقترحون لك</h3>
                        <Link href="/search" className="text-xs md:text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
                            عرض الكل
                        </Link>
                    </div>

                    <div className={`grid gap-3 ${hasSingleTeacher ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-1 md:grid-cols-3'}`}>
                        {filteredTeachers.slice(0, 3).map((teacher) => (
                            <Card key={teacher.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                <CardContent className="p-3 md:p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={teacher.image}
                                            fallback={teacher.name?.[0] || 'م'}
                                            className="w-11 h-11 ring-2 ring-gray-50 group-hover:ring-primary-100 transition-all flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900 text-base leading-tight truncate" title={teacher.name}>
                                                {teacher.name}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate" title={teacher.subject}>
                                                {teacher.subject}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                <span className="text-xs font-bold text-amber-700">{teacher.rating?.toFixed(1) || '5.0'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Clear Booking CTA */}
                                    <Link href={`/teachers/${teacher.slug || teacher.id}?book=true`} className="block mt-3">
                                        <Button size="sm" className="w-full h-9 text-sm gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            عرض الأوقات المتاحة
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function Step({ icon: Icon, title, desc, number }: { icon: any, title: string, desc: string, number: string }) {
    return (
        <div className="flex flex-col items-center relative bg-white md:bg-transparent p-1 md:p-0 rounded-lg md:rounded-none">
            <div className="w-9 md:w-12 h-9 md:h-12 bg-white border-2 border-primary-100 text-primary-600 rounded-lg md:rounded-2xl flex items-center justify-center mb-1.5 md:mb-4 shadow-sm z-10 relative">
                <Icon className="w-4 md:w-6 h-4 md:h-6" />
                <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 md:w-6 h-4 md:h-6 bg-gray-900 text-white text-[9px] md:text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {number}
                </div>
            </div>
            <h4 className="font-bold text-gray-900 text-xs md:text-base">{title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed hidden md:block">{desc}</p>
        </div>
    );
}
