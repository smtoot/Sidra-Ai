'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Mail, Phone, MapPin, Send, Facebook, Twitter, Instagram, Youtube, Linkedin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FOOTER_LINKS = {
    platform: [
        { href: '/search', label: 'ابحث عن معلم' },
        { href: '/how-it-works', label: 'كيف نعمل' },
        { href: '/join-as-teacher', label: 'انضم كمعلم' },
        { href: '/about', label: 'من نحن' },
        { href: '/contact', label: 'تواصل معنا' },
        { href: '/faq', label: 'الأسئلة الشائعة' },
    ],
    legal: [
        { href: '/terms', label: 'شروط الاستخدام' },
        { href: '/privacy', label: 'سياسة الخصوصية' },
        { href: '/refund-policy', label: 'سياسة الاسترداد' },
    ],
    subjects: [
        { href: '/search?subject=math', label: 'الرياضيات' },
        { href: '/search?subject=arabic', label: 'اللغة العربية' },
        { href: '/search?subject=english', label: 'اللغة الإنجليزية' },
        { href: '/search?subject=physics', label: 'الفيزياء' },
        { href: '/search?subject=chemistry', label: 'الكيمياء' },
    ],
};

const SOCIAL_LINKS = [
    { icon: Facebook, href: 'https://facebook.com/sidra', label: 'فيسبوك' },
    { icon: Twitter, href: 'https://twitter.com/sidra', label: 'تويتر' },
    { icon: Instagram, href: 'https://instagram.com/sidra', label: 'انستغرام' },
    { icon: Youtube, href: 'https://youtube.com/sidra', label: 'يوتيوب' },
    { icon: Linkedin, href: 'https://linkedin.com/company/sidra', label: 'لينكدإن' },
];

export function Footer() {
    const currentYear = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsSubscribing(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSubscribing(false);
        setSubscribed(true);
        setEmail('');

        // Reset after 3 seconds
        setTimeout(() => setSubscribed(false), 3000);
    };

    return (
        <footer className="bg-gray-900 text-white">
            {/* Newsletter Section */}
            <div className="border-b border-gray-800">
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <h3 className="text-2xl font-bold mb-2">اشترك في نشرتنا البريدية</h3>
                        <p className="text-gray-400 mb-6">احصل على آخر العروض والأخبار التعليمية</p>

                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                            <div className="relative flex-1">
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="أدخل بريدك الإلكتروني"
                                    className="w-full h-12 bg-gray-800 border border-gray-700 rounded-xl pr-10 pl-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    disabled={isSubscribing || subscribed}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSubscribing || subscribed || !email}
                                className={cn(
                                    "h-12 px-6 gap-2 transition-all",
                                    subscribed && "bg-green-600 hover:bg-green-600"
                                )}
                            >
                                {isSubscribing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : subscribed ? (
                                    <>تم الاشتراك!</>
                                ) : (
                                    <>
                                        اشترك
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-2xl font-bold">سدرة</span>
                        </Link>
                        <p className="text-gray-400 leading-relaxed max-w-sm">
                            منصة سدرة التعليمية - وجهتك الأولى للدروس الخصوصية مع نخبة من المعلمين المعتمدين في السودان.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-3">
                            <a href="mailto:info@sidra.sd" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <span>info@sidra.sd</span>
                            </a>
                            <a href="tel:+249123456789" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <span dir="ltr">+249 123 456 789</span>
                            </a>
                            <div className="flex items-center gap-3 text-gray-400">
                                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <span>الخرطوم، السودان</span>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-2">
                            {SOCIAL_LINKS.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 bg-gray-800 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
                                        aria-label={social.label}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div>
                        <h4 className="font-bold mb-4 text-lg">المنصة</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.platform.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 group"
                                    >
                                        <ArrowLeft className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Subjects */}
                    <div>
                        <h4 className="font-bold mb-4 text-lg">المواد</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.subjects.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 group"
                                    >
                                        <ArrowLeft className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold mb-4 text-lg">الشروط والسياسات</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 group"
                                    >
                                        <ArrowLeft className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {/* App Download Placeholder */}
                        <div className="mt-8">
                            <h4 className="font-bold mb-3 text-lg">حمّل التطبيق</h4>
                            <p className="text-gray-500 text-sm">قريباً على</p>
                            <div className="flex gap-2 mt-2">
                                <div className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400">
                                    App Store
                                </div>
                                <div className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400">
                                    Google Play
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-sm text-center md:text-right">
                            © {currentYear} سدرة. جميع الحقوق محفوظة.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>صنع بـ ❤️ في السودان</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
