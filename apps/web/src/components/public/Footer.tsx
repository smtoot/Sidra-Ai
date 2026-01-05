'use client';

import Link from 'next/link';
import { GraduationCap, Mail, Phone, Facebook, Instagram } from 'lucide-react';

const FOOTER_LINKS = {
    main: [
        { href: '/', label: 'الرئيسية' },
        { href: '/search', label: 'تصفح المعلمين' },
        { href: '/#subjects', label: 'المواد والمراحل' },
        { href: '/faq', label: 'الأسئلة الشائعة' },
        { href: '/join-as-teacher', label: 'انضم كمعلم' },
    ],
    legal: [
        { href: '/privacy', label: 'سياسة الخصوصية' },
        { href: '/terms', label: 'شروط الاستخدام' },
    ],
};

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand & About */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold">سدرة</span>
                        </Link>

                        <p className="text-gray-400 leading-relaxed max-w-md">
                            سدرة منصة سودانية للدروس الخصوصية الأونلاين،
                            بنربط الطلاب بأفضل المعلمين السودانيين في حصص فردية مخصصة وآمنة.
                        </p>

                        {/* Contact */}
                        <div className="space-y-2 pt-4">
                            <a
                                href="mailto:support@sidra.sd"
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                                <span>support@sidra.sd</span>
                            </a>
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-3 pt-2">
                            <a
                                href="https://facebook.com/sidra"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-800 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
                                aria-label="فيسبوك"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a
                                href="https://instagram.com/sidra"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-800 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
                                aria-label="انستغرام"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="https://wa.me/249123456789"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors"
                                aria-label="واتساب"
                            >
                                <Phone className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Main Links */}
                    <div>
                        <h4 className="font-bold mb-4 text-lg">روابط سريعة</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.main.map((link) => (
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

                    {/* Legal Links */}
                    <div>
                        <h4 className="font-bold mb-4 text-lg">قانوني</h4>
                        <ul className="space-y-3">
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
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container mx-auto px-4 py-6">
                    <p className="text-gray-500 text-sm text-center">
                        © {currentYear} سدرة. جميع الحقوق محفوظة.
                    </p>
                </div>
            </div>
        </footer>
    );
}
