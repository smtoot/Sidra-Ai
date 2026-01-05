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
        <section ref={sectionRef} className="py-20 bg-green-600 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className={cn(
                    "max-w-3xl mx-auto text-center text-white transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        ساعد ابنك يحقق أفضل مستواه الدراسي
                    </h2>

                    <p className="text-xl md:text-2xl text-white/90 mb-8">
                        مع معلم سوداني تثق فيه.
                    </p>

                    <Link href="/search">
                        <Button
                            size="lg"
                            className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-6 shadow-xl"
                        >
                            تصفح المعلمين
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
