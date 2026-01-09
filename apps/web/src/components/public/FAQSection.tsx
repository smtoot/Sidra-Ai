'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
    {
        question: 'كيف أبدأ مع سدرة؟',
        answer: 'اختر المادة والمرحلة والمنهج المناسب لطفلك، ثم تصفح قائمة المعلمين واختر المعلم الأنسب بناءً على الخبرة والتقييمات، وبعدها احجز الحصة بكل سهولة.',
    },
    {
        question: 'هل جميع المعلمين في سدرة سودانيون؟',
        answer: 'نعم، جميع معلمي سدرة سودانيون ومؤهلون، وتم اختيارهم بعناية لضمان جودة الشرح وفهم احتياجات الطلاب وأولياء الأمور.',
    },
    {
        question: 'هل التدريس حسب المنهج السوداني فقط؟',
        answer: 'لا، نوفر التدريس حسب المنهج السوداني والمنهج البريطاني (IGCSE)، مع الالتزام بمحتوى كل منهج ومتطلباته.',
    },
    {
        question: 'هل الحصص فردية أم جماعية؟',
        answer: 'جميع الحصص في سدرة فردية (واحد لواحد) لضمان التركيز الكامل على الطالب وتحقيق أفضل نتيجة تعليمية.',
    },
    {
        question: 'هل توجد حصة تجريبية مجانية؟',
        answer: 'بعض المعلمين يوفرون حصة تجريبية مجانية حسب سياسة المعلم، ويمكنك معرفة ذلك من خلال الملف الشخصي للمعلم.',
    },
    {
        question: 'ما هي طرق الدفع المتاحة؟',
        answer: 'نوفر طرق دفع محلية وآمنة مثل التحويل البنكي داخل السودان، مع إجراءات سهلة وسريعة لإتمام الحجز.',
    },
];

export function FAQSection() {
    const [isVisible, setIsVisible] = useState(false);
    const [openIndex, setOpenIndex] = useState<number | null>(0); // Default to first item open
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
        <section ref={sectionRef} className="py-24 bg-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className={cn(
                    "text-center mb-16 transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                        أسئلة تهم أولياء الأمور
                    </h2>
                </div>

                {/* FAQ Items */}
                <div className="max-w-3xl mx-auto space-y-6 mb-20">
                    {FAQ_ITEMS.map((item, index) => (
                        <div
                            key={index}
                            className={cn(
                                "bg-gray-50 rounded-xl overflow-hidden transition-all duration-500 border border-transparent hover:border-gray-200",
                                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            )}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <button
                                onClick={() => toggleItem(index)}
                                className="w-full flex items-center justify-between p-6 text-right hover:bg-gray-100 transition-colors"
                            >
                                <span className={cn(
                                    "font-bold text-lg text-gray-900",
                                    openIndex === index && "text-[#003366]"
                                )}>
                                    {item.question}
                                </span>
                                <ChevronDown
                                    className={cn(
                                        "w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 mr-4",
                                        openIndex === index && "rotate-180 text-[#D4A056]"
                                    )}
                                />
                            </button>

                            <div
                                className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out",
                                    openIndex === index ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                                )}
                            >
                                <div className="px-6 pb-6 text-gray-600 leading-relaxed text-base">
                                    {item.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className={cn(
                    "text-center max-w-2xl mx-auto bg-[#F9F5F0] rounded-2xl p-10 transition-all duration-700 delay-500",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        هل لديك سؤال آخر؟
                    </h3>
                    <p className="text-gray-600 mb-8 font-medium">
                        فريق سدرة جاهز لمساعدتك
                    </p>
                    <Link href="/search">
                        <Button className="bg-[#003366] hover:bg-[#002244] text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                            ابدأ البحث عن معلم
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
