'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, Star } from 'lucide-react';
// Mock data used now, API imports removed

const MOCK_TEACHERS = [
    {
        id: '1',
        name: 'أ. محمد أحمد',
        subject: 'الرياضيات',
        curricula: ['sudanese'],
        rating: 4.9,
        reviews: 120,
        experience: 'خبرة 10 سنوات في تدريس الرياضيات',
        image: null
    },
    {
        id: '2',
        name: 'أ. سارة حسن',
        subject: 'اللغة الإنجليزية',
        curricula: ['sudanese', 'british'],
        rating: 4.8,
        reviews: 85,
        experience: 'متخصصة في التأسيس والمحادثة',
        image: null
    },
    {
        id: '3',
        name: 'أ. عمر الخضر',
        subject: 'الفيزياء',
        curricula: ['sudanese'],
        rating: 5.0,
        reviews: 95,
        experience: 'تبسيط الفيزياء للشهادة السودانية',
        image: null
    }
];

const CURRICULUM_CONFIG: Record<string, { label: string; flag: string }> = {
    sudanese: { label: 'سوداني', flag: '🇸🇩' },
    british: { label: 'بريطاني', flag: '🇬🇧' },
    american: { label: 'أمريكي', flag: '🇺🇸' },
};

export function TeachersPreview() {
    return (
        <section className="py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#003366] mb-4">
                        اختر معلمك بنفسك
                    </h2>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                        نخبة من المعلمين المؤهلين لتدريس أبنائكم، تم اختيارهم بعناية
                    </p>
                </div>

                {/* Teachers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                    {MOCK_TEACHERS.map((teacher) => (
                        <div key={teacher.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col items-center p-8">

                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-full bg-gray-100 mb-5 overflow-hidden border-4 border-white shadow-md">
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                                    <span className="text-2xl font-bold text-[#003366]">
                                        {teacher.name.charAt(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Name */}
                            <h3 className="font-bold text-xl text-[#003366] mb-2">
                                {teacher.name}
                            </h3>

                            {/* Subject */}
                            <div className="mb-4">
                                <span className="inline-block bg-[#F0F7FF] text-[#003366] font-bold px-4 py-1.5 rounded-full text-sm">
                                    {teacher.subject}
                                </span>
                            </div>

                            {/* Curriculum - Improved Clarity */}
                            <div className="flex flex-col items-center gap-2 mb-5 w-full">
                                <span className="text-xs text-gray-500 font-bold">المنهج</span>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {teacher.curricula.map((code) => (
                                        <span key={code} className="bg-white border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm whitespace-nowrap">
                                            <span className="text-base leading-none">{CURRICULUM_CONFIG[code].flag}</span>
                                            {CURRICULUM_CONFIG[code].label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Rating - Simplified */}
                            <div className="flex items-center gap-1.5 mb-5 opacity-90">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span className="font-bold text-gray-900 text-sm">
                                    {teacher.rating}
                                </span>
                                <span className="text-gray-400 text-xs">
                                    ({teacher.reviews} تقييم)
                                </span>
                            </div>

                            {/* Experience - One Line */}
                            <p className="text-gray-500 text-sm font-medium leading-relaxed border-t border-gray-50 pt-4 w-full text-center">
                                {teacher.experience}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <Link href="/search">
                        <Button size="lg" className="bg-[#D4A056] hover:bg-[#b88b4a] text-white px-10 py-6 text-lg font-bold rounded-xl transition-all shadow-md hover:shadow-lg">
                            عرض كل المعلمين
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

