'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HeroSection() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <section className="relative bg-primary min-h-[85vh] flex items-center overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent rounded-full blur-3xl" />
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content Side */}
                    <div className={cn(
                        "text-white space-y-8 transition-all duration-1000",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    )}>
                        {/* Main Headline */}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                            أفضل المعلمين السودانيين لأبنائك –
                            <span className="block mt-2 text-accent">
                                دروس خصوصية أونلاين حسب المنهج المناسب لهم.
                            </span>
                        </h1>

                        {/* Subtitle with features */}
                        <p className="text-lg md:text-xl text-white/80 leading-relaxed">
                            نخبة المعلمين السودانيين | منهج سوداني وبريطاني | تدريس مخصص وخصوصية تامة من بيتكم
                        </p>

                        {/* CTA Button */}
                        <div className={cn(
                            "transition-all duration-1000 delay-300",
                            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                        )}>
                            <Link href="/search">
                                <Button
                                    size="lg"
                                    className="bg-accent hover:bg-accent/90 text-white text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all"
                                >
                                    تصفح المعلمين
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Illustration Side */}
                    <div className={cn(
                        "hidden lg:flex justify-center items-center transition-all duration-1000 delay-500",
                        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                    )}>
                        {/* Online Learning Illustration */}
                        <div className="relative w-full max-w-lg">
                            {/* Monitor/Screen */}
                            <div className="bg-white rounded-3xl p-6 shadow-2xl">
                                {/* Screen Header */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                </div>

                                {/* Video Call Interface */}
                                <div className="bg-gray-100 rounded-2xl p-6 relative">
                                    {/* Teacher Avatar */}
                                    <div className="flex items-center justify-center mb-4">
                                        <div className="relative">
                                            <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center">
                                                <svg className="w-20 h-20 text-primary" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                </svg>
                                            </div>
                                            {/* Live indicator */}
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                مباشر
                                            </div>
                                        </div>
                                    </div>

                                    {/* Student small video */}
                                    <div className="absolute bottom-4 left-4 w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center border-2 border-white shadow-lg">
                                        <svg className="w-8 h-8 text-accent" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                    </div>

                                    {/* Whiteboard/Notes area */}
                                    <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            <span>سبورة تفاعلية</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-accent rounded-xl rotate-12 opacity-80" />
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/20 rounded-full" />

                            {/* Book icon */}
                            <div className="absolute -bottom-6 right-8 bg-white rounded-xl p-3 shadow-lg">
                                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
