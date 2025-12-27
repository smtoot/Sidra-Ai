'use client';

import Link from 'next/link';
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';

const FOOTER_LINKS = {
    platform: [
        { href: '/search', label: 'ابحث عن معلم' },
        { href: '/how-it-works', label: 'كيف نعمل' },
        { href: '/join-as-teacher', label: 'انضم كمعلم' },
        { href: '/about', label: 'من نحن' },
    ],
    legal: [
        { href: '/terms', label: 'شروط الاستخدام' },
        { href: '/privacy', label: 'سياسة الخصوصية' },
        { href: '/refund-policy', label: 'سياسة الاسترداد' },
    ],
    subjects: [
        { href: '/subjects/math', label: 'الرياضيات' },
        { href: '/subjects/arabic', label: 'اللغة العربية' },
        { href: '/subjects/english', label: 'اللغة الإنجليزية' },
        { href: '/subjects/physics', label: 'الفيزياء' },
    ],
};

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold">سدرة</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            منصة سدرة التعليمية - وجهتك الأولى للدروس الخصوصية مع نخبة من المعلمين المعتمدين.
                        </p>
                        <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>info@sidra.sd</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span dir="ltr">+249 123 456 789</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>الخرطوم، السودان</span>
                            </div>
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div>
                        <h4 className="font-bold mb-4">المنصة</h4>
                        <ul className="space-y-2">
                            {FOOTER_LINKS.platform.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Subjects */}
                    <div>
                        <h4 className="font-bold mb-4">المواد</h4>
                        <ul className="space-y-2">
                            {FOOTER_LINKS.subjects.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold mb-4">الشروط والسياسات</h4>
                        <ul className="space-y-2">
                            {FOOTER_LINKS.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
                    <p>© {currentYear} سدرة. جميع الحقوق محفوظة.</p>
                </div>
            </div>
        </footer>
    );
}
