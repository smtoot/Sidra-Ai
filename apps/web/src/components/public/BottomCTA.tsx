'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function BottomCTA() {
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
        <section ref={sectionRef} className="py-20 bg-[#0A3D73] relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2 filter blur-3xl opacity-20" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4A056] rounded-full translate-y-1/2 -translate-x-1/2 filter blur-3xl opacity-30" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className={cn(
                    "max-w-4xl mx-auto text-center text-white transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight drop-shadow-sm !text-white" style={{ color: '#ffffff' }}>
                        مستعد لمساعدة ابنك على التفوق الدراسي؟
                    </h2>

                    <p className="text-xl md:text-2xl !text-white/85 font-medium mb-8 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        اختر معلماً سودانياً مؤهلاً وابدأ دروساً خصوصية أونلاين تناسب مستوى ابنك ومنهجه.
                    </p>

                    <Link href="/search">
                        <Button
                            size="lg"
                            className="bg-[#D4A056] text-white hover:bg-[#C29046] text-xl px-12 py-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all font-extrabold transform hover:-translate-y-1"
                        >
                            ابدأ باختيار المعلم المناسب
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
