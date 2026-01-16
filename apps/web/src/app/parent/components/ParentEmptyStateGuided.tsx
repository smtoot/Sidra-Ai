import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Search, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';

export function ParentEmptyStateGuided() {
    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 md:p-12 text-center">
                <div className="max-w-2xl mx-auto space-y-3 md:space-y-8">
                    <div>
                        <h2 className="text-lg md:text-3xl font-bold text-gray-900 mb-1 md:mb-3">
                            ابدأ بإضافة ابنك أو ابنتك
                        </h2>
                        <p className="text-gray-500 text-xs md:text-lg">
                            بعد الإضافة، اختر المعلم المناسب واحجز الحصة بسهولة
                        </p>
                    </div>

                    {/* 3-Step Guide */}
                    <div className="grid grid-cols-3 gap-1 md:gap-6 relative">
                        {/* Connector Line (Desktop) */}
                        <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-gray-100 -z-10" />

                        <Step
                            icon={Users}
                            title="أضف ابنك"
                            desc="أنشئ حساباً لكل ابن لمتابعة تقدمه"
                            number="1"
                        />
                        <Step
                            icon={Search}
                            title="اختر معلمًا"
                            desc="تصفح المعلمين حسب المادة والمرحلة"
                            number="2"
                        />
                        <Step
                            icon={Calendar}
                            title="احجز الحصة"
                            desc="حدد الوقت المناسب وابدأ التعلم"
                            number="3"
                        />
                    </div>

                    {/* Desktop CTA - mobile uses sticky */}
                    <div className="pt-2 hidden md:flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/parent/children/new">
                            <Button size="lg" className="w-full sm:w-auto min-w-[200px] h-12 text-lg font-bold shadow-lg bg-primary-600 hover:bg-primary-700">
                                <Plus className="w-5 h-5 ml-2" />
                                إضافة ابن / ابنة
                            </Button>
                        </Link>

                        <Link href="/search">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 text-lg">
                                تصفح المعلمين
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile CTA */}
                    <div className="md:hidden">
                        <Link href="/parent/children/new">
                            <Button className="w-full h-10 font-bold shadow-md">
                                <Plus className="w-4 h-4 ml-1.5" />
                                إضافة ابن / ابنة
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function Step({ icon: Icon, title, desc, number }: any) {
    return (
        <div className="flex flex-col items-center bg-white p-1 md:p-4 rounded-lg md:rounded-xl relative z-10">
            <div className="w-9 md:w-12 h-9 md:h-12 rounded-lg md:rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-1.5 md:mb-4 ring-2 md:ring-4 ring-white shadow-sm font-bold text-sm md:text-lg">
                {number}
            </div>
            <h3 className="font-bold text-gray-900 text-xs md:text-base">{title}</h3>
            <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed hidden md:block">
                {desc}
            </p>
        </div>
    );
}

