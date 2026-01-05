'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, Star, Users, BookOpen, Play, ChevronDown } from 'lucide-react';
import { useCurricula } from '@/hooks/useCurricula';
import { useSubjects } from '@/hooks/useSubjects';
import { cn } from '@/lib/utils';

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000, start: number = 0) {
    const [count, setCount] = useState(start);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (hasAnimated) return;

        const startTime = Date.now();
        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(start + (end - start) * easeOutQuart));

            if (progress === 1) {
                clearInterval(timer);
                setHasAnimated(true);
            }
        }, 16);

        return () => clearInterval(timer);
    }, [end, duration, start, hasAnimated]);

    return count;
}

// Sample testimonials for social proof
const TESTIMONIALS = [
    {
        name: 'أم محمد',
        role: 'ولي أمر',
        content: 'ابني تحسن كثيراً في الرياضيات بفضل المعلمين المتميزين',
        rating: 5,
    },
    {
        name: 'أحمد علي',
        role: 'طالب ثانوي',
        content: 'أفضل منصة للدروس الخصوصية، المعلمون محترفون جداً',
        rating: 5,
    },
    {
        name: 'سارة محمود',
        role: 'معلمة',
        content: 'منصة رائعة للتدريس وكسب دخل إضافي بمرونة',
        rating: 5,
    },
];

export function HeroSection() {
    const router = useRouter();
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedCurriculum, setSelectedCurriculum] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
    const { data: curricula = [], isLoading: curriculaLoading } = useCurricula();

    // Animated stats
    const teacherCount = useAnimatedCounter(150, 2000);
    const studentCount = useAnimatedCounter(800, 2500);
    const sessionCount = useAnimatedCounter(2500, 3000);

    // Trigger entrance animation
    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Auto-rotate testimonials
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (selectedSubject) params.set('subjectId', selectedSubject);
        if (selectedCurriculum) params.set('curriculumId', selectedCurriculum);
        router.push(`/search?${params.toString()}`);
    };

    const scrollToHowItWorks = () => {
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/10 min-h-[90vh] flex items-center">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-green-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23003366' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            <div className="container mx-auto px-4 py-12 md:py-20 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content Side */}
                    <div className={cn(
                        "space-y-8 transition-all duration-1000",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    )}>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            منصة التعليم الأولى في السودان
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                            اكتشف أفضل المعلمين
                            <span className="text-primary block mt-2">لأبنائك</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed">
                            دروس خصوصية عبر الإنترنت مع نخبة من المعلمين المعتمدين.
                            احجز جلستك الأولى اليوم وانطلق في رحلة التفوق.
                        </p>

                        {/* Search Box */}
                        <div
                            className={cn(
                                "bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100 transition-all duration-1000 delay-300",
                                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            )}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Subject Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 block text-right">
                                        المادة
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            disabled={subjectsLoading}
                                            className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="">جميع المواد</option>
                                            {subjects.map((subject) => (
                                                <option key={subject.id} value={subject.id}>
                                                    {subject.nameAr}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        {subjectsLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Curriculum Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 block text-right">
                                        المنهج
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedCurriculum}
                                            onChange={(e) => setSelectedCurriculum(e.target.value)}
                                            disabled={curriculaLoading}
                                            className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="">جميع المناهج</option>
                                            {curricula.map((curriculum) => (
                                                <option key={curriculum.id} value={curriculum.id}>
                                                    {curriculum.nameAr}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        {curriculaLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Search Button */}
                                <div className="flex items-end">
                                    <Button
                                        onClick={handleSearch}
                                        className="w-full h-12 text-lg gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                                    >
                                        <Search className="w-5 h-5" />
                                        ابحث الآن
                                    </Button>
                                </div>
                            </div>

                            {/* Popular Searches */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-2">بحث شائع:</p>
                                <div className="flex flex-wrap gap-2">
                                    {['رياضيات', 'فيزياء', 'لغة إنجليزية', 'كيمياء'].map((term) => (
                                        <button
                                            key={term}
                                            onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                                            className="px-3 py-1 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-full text-xs transition-colors"
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Secondary CTA */}
                        <button
                            onClick={scrollToHowItWorks}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors group"
                        >
                            <Play className="w-5 h-5 p-1 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors" />
                            <span>شاهد كيف يعمل</span>
                        </button>
                    </div>

                    {/* Visual Side - Illustration & Stats */}
                    <div className={cn(
                        "relative hidden lg:block transition-all duration-1000 delay-500",
                        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                    )}>
                        {/* Main Illustration Card */}
                        <div className="relative">
                            {/* Decorative shapes */}
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/20 rounded-2xl rotate-12" />
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full" />

                            {/* Main visual container */}
                            <div className="relative bg-gradient-to-br from-primary to-primary-700 rounded-3xl p-8 text-white overflow-hidden">
                                {/* Background pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                                </div>

                                {/* Content */}
                                <div className="relative space-y-6">
                                    {/* Illustration placeholder - Teacher & Student */}
                                    <div className="flex items-center justify-center py-8">
                                        <div className="relative">
                                            {/* Teacher avatar */}
                                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                                                <Users className="w-12 h-12" />
                                            </div>
                                            {/* Connection line */}
                                            <div className="absolute top-1/2 -left-16 w-12 h-0.5 bg-white/30" />
                                            {/* Student avatar */}
                                            <div className="absolute top-1/2 -left-28 -translate-y-1/2 w-16 h-16 bg-accent/30 rounded-full flex items-center justify-center">
                                                <BookOpen className="w-8 h-8" />
                                            </div>
                                            {/* Live indicator */}
                                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                مباشر
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 bg-white/10 rounded-xl">
                                            <div className="text-2xl font-bold">{teacherCount}+</div>
                                            <div className="text-xs text-white/70">معلم معتمد</div>
                                        </div>
                                        <div className="text-center p-3 bg-white/10 rounded-xl">
                                            <div className="text-2xl font-bold">{studentCount}+</div>
                                            <div className="text-xs text-white/70">طالب مسجل</div>
                                        </div>
                                        <div className="text-center p-3 bg-white/10 rounded-xl">
                                            <div className="text-2xl font-bold">{sessionCount}+</div>
                                            <div className="text-xs text-white/70">حصة منجزة</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Testimonial Card */}
                            <div className="absolute -bottom-8 -right-8 bg-white rounded-2xl shadow-xl p-4 max-w-xs border border-gray-100">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-primary font-bold">
                                            {TESTIMONIALS[currentTestimonial].name.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 mb-1">
                                            {[...Array(TESTIMONIALS[currentTestimonial].rating)].map((_, i) => (
                                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            "{TESTIMONIALS[currentTestimonial].content}"
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            - {TESTIMONIALS[currentTestimonial].name}، {TESTIMONIALS[currentTestimonial].role}
                                        </p>
                                    </div>
                                </div>
                                {/* Testimonial indicators */}
                                <div className="flex justify-center gap-1 mt-3">
                                    {TESTIMONIALS.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentTestimonial(i)}
                                            className={cn(
                                                "w-2 h-2 rounded-full transition-colors",
                                                i === currentTestimonial ? "bg-primary" : "bg-gray-200"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Stats - Show below search on mobile */}
                <div className={cn(
                    "lg:hidden mt-12 transition-all duration-1000 delay-700",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="text-2xl md:text-3xl font-bold text-primary">{teacherCount}+</div>
                            <div className="text-gray-500 text-xs md:text-sm">معلم معتمد</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="text-2xl md:text-3xl font-bold text-primary">{studentCount}+</div>
                            <div className="text-gray-500 text-xs md:text-sm">طالب مسجل</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="text-2xl md:text-3xl font-bold text-primary">{sessionCount}+</div>
                            <div className="text-gray-500 text-xs md:text-sm">حصة منجزة</div>
                        </div>
                    </div>

                    {/* Mobile Testimonial */}
                    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-primary font-bold">
                                    {TESTIMONIALS[currentTestimonial].name.charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-1 mb-1">
                                    {[...Array(TESTIMONIALS[currentTestimonial].rating)].map((_, i) => (
                                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600">
                                    "{TESTIMONIALS[currentTestimonial].content}"
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    - {TESTIMONIALS[currentTestimonial].name}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
