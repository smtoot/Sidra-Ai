'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


const CURRICULA = [
    {
        title: 'المنهج السوداني',
        flag: '🇸🇩',
        stages: [
            'ابتدائي: الصف الأول – الصف السادس',
            'متوسط: الأول متوسط – الثالث متوسط',
            'ثانوي: الأول ثانوي – الثالث ثانوي',
        ],
        ctaText: 'استكشف معلمي المنهج السوداني',
        link: '/search?curriculum=sudanese'
    },
    {
        title: 'المنهج البريطاني',
        flag: '🇬🇧',
        stages: [
            'Primary (ابتدائي)',
            'Secondary (ثانوي)',
            'IGCSE',
        ],
        ctaText: 'استكشف معلمي المنهج البريطاني',
        link: '/search?curriculum=british'
    },
];

export function GradesSection() {
    const [isVisible, setIsVisible] = useState(false);
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

    return (
        <section ref={sectionRef} className="py-24 bg-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className={cn(
                    "text-center mb-16 transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#003366] mb-4">
                        الأنظمة التعليمية التي نغطيها
                    </h2>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                        نغطي المنهج السوداني والمنهج البريطاني بما يناسب كل مرحلة دراسية
                    </p>
                </div>

                {/* Curricula Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {CURRICULA.map((item, index) => (
                        <div
                            key={index}
                            className={cn(
                                "rounded-2xl p-10 bg-[#FAF9F6] border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col items-center text-center",
                                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            )}
                            style={{ transitionDelay: `${index * 150}ms` }}
                        >
                            {/* Flag & Title */}
                            <div className="mb-8">
                                <div className="text-6xl mb-4 filter drop-shadow-sm">{item.flag}</div>
                                <h3 className="font-bold text-2xl text-[#003366]">
                                    {item.title}
                                </h3>
                            </div>

                            {/* Stages List */}
                            <div className="space-y-4 mb-10 w-full">
                                {item.stages.map((stage, i) => (
                                    <div key={i} className="bg-white py-3 px-4 rounded-xl border border-gray-100 text-gray-700 font-medium text-lg shadow-sm">
                                        {stage}
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <Link href={item.link} className="w-full mt-auto">
                                <Button className="w-full bg-[#D4A056] hover:bg-[#b88b4a] text-white font-bold py-6 text-lg rounded-xl shadow-md transition-all">
                                    {item.ctaText}
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
