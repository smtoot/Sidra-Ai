'use client';

import Link from 'next/link';
import { GraduationCap, Mail, Phone, Facebook, Instagram } from 'lucide-react';
import Image from 'next/image';

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
        <footer className="bg-[#0F172A] text-white">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand & About */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="relative w-64 h-20">
                                <Image
                                    src="/images/logo-white.png"
                                    alt="Sidra"
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-contain"
                                />
                            </div>
                        </Link>

                        <p className="!text-gray-200 leading-loose text-lg max-w-lg font-medium">
                            سدرة منصة سودانية للدروس الخصوصية أونلاين، تربط الطلاب بأفضل المعلمين السودانيين في حصص فردية مخصصة وآمنة.
                        </p>

                        {/* Contact */}
                        <div className="space-y-3 pt-6">
                            <a
                                href="mailto:support@sidra.sd"
                                className="flex items-center gap-3 text-gray-200 hover:text-white transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-primary transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <span className="text-lg">support@sidra.sd</span>
                            </a>
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-3 pt-4">
                            <a
                                href="https://facebook.com/sidra"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 bg-gray-800/50 hover:bg-primary rounded-xl flex items-center justify-center transition-all hover:-translate-y-1"
                                aria-label="فيسبوك"
                            >
                                <Facebook className="w-6 h-6" />
                            </a>
                            <a
                                href="https://instagram.com/sidra"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 bg-gray-800/50 hover:bg-primary rounded-xl flex items-center justify-center transition-all hover:-translate-y-1"
                                aria-label="انستغرام"
                            >
                                <Instagram className="w-6 h-6" />
                            </a>
                            <a
                                href="https://wa.me/249123456789"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 bg-gray-800/50 hover:bg-green-600 rounded-xl flex items-center justify-center transition-all hover:-translate-y-1"
                                aria-label="واتساب"
                            >
                                <Phone className="w-6 h-6" />
                            </a>
                        </div>
                    </div>

                    {/* Main Links */}
                    {/* Main Links */}
                    <div className="pt-2">
                        <h4 className="font-bold mb-6 text-xl !text-white">روابط سريعة</h4>
                        <ul className="space-y-4">
                            {FOOTER_LINKS.main.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="!text-gray-300 hover:text-white hover:underline transition-all text-base inline-block"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div className="pt-2">
                        <h4 className="font-bold mb-6 text-xl !text-white">قانوني</h4>
                        <ul className="space-y-4">
                            {FOOTER_LINKS.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="!text-gray-300 hover:text-white hover:underline transition-all text-base inline-block"
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
            <div className="border-t border-slate-800/50 bg-[#020617]">
                <div className="container mx-auto px-4 py-8">
                    <p className="text-slate-400 text-sm text-center font-medium">
                        © {currentYear} سدرة. جميع الحقوق محفوظة.
                    </p>
                </div>
            </div>
        </footer>
    );
}
