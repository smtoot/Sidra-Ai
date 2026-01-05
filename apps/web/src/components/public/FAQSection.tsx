'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
    {
        question: 'كيف أبدأ مع سدرة؟',
        answer: 'اختَر المادة والمرحلة، وبعدها تتصفح قائمة المعلمين وتشوف صفحة كل معلم بالتفصيل، ثم تحجز الحصة المناسبة.',
    },
    {
        question: 'هل المعلمين في سدرة سودانيين؟',
        answer: 'نعم، كل المعلمين في سدرة سودانيين، مؤهلين، وعندهم خبرة في التدريس.',
    },
    {
        question: 'هل التدريس حسب المنهج السوداني فقط؟',
        answer: 'لا، نوفر المنهج السوداني والبريطاني، ويتم توضيح ذلك في صفحة كل معلم.',
    },
    {
        question: 'هل الحصص فردية أم جماعية؟',
        answer: 'حاليًا كل الحصص فردية (واحد لواحد).',
    },
    {
        question: 'هل توجد حصة تجريبية مجانية؟',
        answer: 'بعض المعلمين يوفّروا حصة تجريبية مجانية حسب إتاحتهم، وسيظهر ذلك بوضوح في صفحة المعلم.',
    },
    {
        question: 'ما هي طرق الدفع المتاحة؟',
        answer: 'حاليًا التحويل البنكي (بنك الخرطوم – بنكك)، وسيتم إضافة فوري وكاشي قريبًا.',
    },
];

export function FAQSection() {
    const [isVisible, setIsVisible] = useState(false);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const toggleItem = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section ref={sectionRef} className="py-20 bg-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className={cn(
                    "text-center mb-12 transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                        أسئلة بتهم أولياء الأمور
                    </h2>
                </div>

                {/* FAQ Items */}
                <div className="max-w-3xl mx-auto space-y-4">
                    {FAQ_ITEMS.map((item, index) => (
                        <div
                            key={index}
                            className={cn(
                                "bg-gray-50 rounded-xl overflow-hidden transition-all duration-500",
                                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            )}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <button
                                onClick={() => toggleItem(index)}
                                className="w-full flex items-center justify-between p-5 text-right hover:bg-gray-100 transition-colors"
                            >
                                <span className="font-semibold text-gray-900">
                                    {item.question}
                                </span>
                                <ChevronDown
                                    className={cn(
                                        "w-5 h-5 text-gray-500 transition-transform duration-300 flex-shrink-0 mr-4",
                                        openIndex === index && "rotate-180"
                                    )}
                                />
                            </button>

                            <div
                                className={cn(
                                    "overflow-hidden transition-all duration-300",
                                    openIndex === index ? "max-h-48" : "max-h-0"
                                )}
                            >
                                <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                                    {item.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
