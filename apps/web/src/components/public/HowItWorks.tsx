'use client';

import { Search, Calendar, Video } from 'lucide-react';

const STEPS = [
    {
        icon: Search,
        title: 'ابحث عن معلم',
        description: 'تصفح قائمة المعلمين المعتمدين وفلتر حسب المادة والمنهج والسعر',
        color: 'from-blue-500 to-blue-600',
    },
    {
        icon: Calendar,
        title: 'احجز موعدك',
        description: 'اختر الموعد المناسب من جدول المعلم واحجز جلستك بسهولة',
        color: 'from-green-500 to-green-600',
    },
    {
        icon: Video,
        title: 'ابدأ التعلم',
        description: 'انضم للجلسة عبر الإنترنت وتعلم مع أفضل المعلمين',
        color: 'from-purple-500 to-purple-600',
    },
];

export function HowItWorks() {
    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">كيف يعمل سدرة؟</h2>
                    <p className="text-gray-500 mt-2">ثلاث خطوات بسيطة للبدء</p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div key={index} className="relative text-center">
                                {/* Connector Line */}
                                {index < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gray-200 -translate-x-1/2" />
                                )}

                                {/* Step Number */}
                                <div className="relative z-10">
                                    <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} mx-auto mb-6 flex items-center justify-center shadow-xl`}>
                                        <Icon className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                        {index + 1}
                                    </div>
                                </div>

                                <h3 className="font-bold text-xl text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{step.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
