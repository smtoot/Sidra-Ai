'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GraduationCap, CheckCircle, Sparkles } from 'lucide-react';

const BENEFITS = [
    'حدد جدولك ومواعيدك بنفسك',
    'تلقى مدفوعاتك بشكل آمن',
    'انضم لمجتمع من المعلمين المتميزين',
    'احصل على دعم فني مستمر',
];

// Fixed positions for decorative dots to avoid hydration mismatch
const DOT_POSITIONS = [
    { top: 10, left: 5, opacity: 0.3 },
    { top: 20, left: 85, opacity: 0.4 },
    { top: 35, left: 15, opacity: 0.25 },
    { top: 45, left: 75, opacity: 0.35 },
    { top: 60, left: 25, opacity: 0.4 },
    { top: 70, left: 90, opacity: 0.3 },
    { top: 80, left: 45, opacity: 0.25 },
    { top: 15, left: 55, opacity: 0.35 },
    { top: 55, left: 65, opacity: 0.3 },
    { top: 85, left: 35, opacity: 0.4 },
];

export function TeacherCTA() {
    return (
        <section className="py-16 bg-gradient-to-br from-primary to-primary-700 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full">
                    {DOT_POSITIONS.map((dot, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-white rounded-full"
                            style={{
                                top: `${dot.top}%`,
                                left: `${dot.left}%`,
                                opacity: dot.opacity,
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4 relative">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    {/* Icon */}
                    <div className="w-20 h-20 bg-white/10 rounded-3xl mx-auto flex items-center justify-center">
                        <GraduationCap className="w-10 h-10" />
                    </div>

                    {/* Headline */}
                    <h2 className="text-3xl md:text-4xl font-bold">
                        هل أنت معلم؟
                        <span className="block mt-2 text-white/80">انضم لمنصة سدرة اليوم</span>
                    </h2>

                    {/* Benefits */}
                    <div className="flex flex-wrap justify-center gap-4">
                        {BENEFITS.map((benefit, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm"
                            >
                                <CheckCircle className="w-4 h-4 text-green-300" />
                                {benefit}
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="pt-4">
                        <Link href="/join-as-teacher">
                            <Button
                                size="lg"
                                className="bg-white text-primary hover:bg-gray-100 shadow-xl text-lg px-8 gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                سجّل كمعلم الآن
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
