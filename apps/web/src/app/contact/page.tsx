'use client';

import { useState } from 'react';
import { PublicNavbar, Footer } from '@/components/public';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success('تم استلام رسالتك بنجاح. سنتواصل معك قريباً!');
        setLoading(false);
        (e.target as HTMLFormElement).reset();
    };

    return (
        <div className="min-h-screen bg-white font-tajawal rtl flex flex-col">
            <PublicNavbar />

            <main className="flex-grow">
                {/* Header */}
                <div className="bg-primary-900 text-white py-16 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <Badge variant="secondary" className="mb-4 px-4 py-1 text-primary-700 bg-white/10 text-white border-none hover:bg-white/20">
                            تواصل معنا
                        </Badge>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4">نحن هنا لمساعدتك</h1>
                        <p className="text-lg text-primary-100 max-w-xl mx-auto">
                            هل لديك استفسار أو اقتراح؟ فريق الدعم لدينا جاهز للرد على جميع تساؤلاتك.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12 -mt-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Contact Info Cards */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card className="border-none shadow-md overflow-hidden group">
                                <CardContent className="p-6 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">البريد الإلكتروني</h3>
                                        <p className="text-gray-500 text-sm mb-2">للاستفسارات العامة والدعم</p>
                                        <a href="mailto:support@sidra.sd" className="text-blue-600 font-semibold dir-ltr block">support@sidra.sd</a>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-md overflow-hidden group">
                                <CardContent className="p-6 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                                        <MessageCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">واتساب</h3>
                                        <p className="text-gray-500 text-sm mb-2">تواصل مباشر وسريع</p>
                                        <a href="https://wa.me/249123456789" className="text-green-600 font-semibold dir-ltr block text-left">+249 123 456 789</a>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-md overflow-hidden group">
                                <CardContent className="p-6 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">موقعنا</h3>
                                        <p className="text-gray-500 text-sm mb-2">المقر الرئيسي</p>
                                        <p className="text-gray-700 font-medium">الخرطوم، السودان</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <Card className="border-none shadow-xl bg-white h-full">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">أرسل لنا رسالة</h2>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">الاسم الكامل</Label>
                                                <Input id="name" placeholder="أدخل اسمك" required className="h-12" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                                <Input id="email" type="email" placeholder="name@example.com" required className="h-12" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject">الموضوع</Label>
                                            <Input id="subject" placeholder="ما هو موضوع رسالتك؟" required className="h-12" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">الرسالة</Label>
                                            <Textarea id="message" placeholder="اكتب تفاصيل استفسارك هنا..." required className="min-h-[150px] resize-none" />
                                        </div>

                                        <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                                            {loading ? 'جاري الإرسال...' : (
                                                <>
                                                    إرسال الرسالة
                                                    <Send className="w-4 h-4 -rotate-180" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
