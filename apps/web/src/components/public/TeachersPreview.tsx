'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

export function TeachersPreview() {
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
        <section ref={sectionRef} className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className={cn(
                    "max-w-4xl mx-auto text-center transition-all duration-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                        اختر معلمك بنفسك
                    </h2>

                    <p className="text-lg text-gray-600 leading-relaxed mb-8">
                        في سدرة، ما بنفرض عليك معلم.
                        <br />
                        تصفح قائمة المعلمين السودانيين، شوف خبراتهم وتخصصاتهم،
                        <br />
                        واختر الأنسب لابنك بكل ثقة.
                    </p>

                    <Link href="/search">
                        <Button size="lg" variant="outline" className="gap-2">
                            عرض كل المعلمين
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
