'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show button when page is scrolled more than 400px
            setIsVisible(window.scrollY > 400);
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-6 left-6 z-50 w-12 h-12 bg-primary text-white rounded-full shadow-lg",
                "flex items-center justify-center",
                "hover:bg-primary-600 hover:shadow-xl hover:-translate-y-1",
                "transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}
            aria-label="العودة للأعلى"
        >
            <ChevronUp className="w-6 h-6" />
        </button>
    );
}
