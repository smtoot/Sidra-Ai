'use client';

import { PublicNavbar, Footer } from '@/components/public';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Eye, Share2, Database, UserCheck, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
    const lastUpdated = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="min-h-screen bg-white font-tajawal rtl flex flex-col">
            <PublicNavbar />

            <main className="flex-grow">
                {/* Header */}
                <div className="bg-gray-50 py-12 border-b border-gray-100">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto text-center">
                            <Badge variant="outline" className="mb-4 bg-white border-gray-200">
                                سياسة الخصوصية
                            </Badge>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">كيف نحمي بياناتك</h1>
                            <p className="text-gray-500">
                                آخر تحديث: {lastUpdated}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <Card className="border-none shadow-sm bg-green-50/50">
                            <CardContent className="p-6 flex gap-4">
                                <ShieldCheck className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-green-900 mb-2">التزامنا بالخصوصية</h3>
                                    <p className="text-green-800 leading-relaxed text-sm">
                                        في منصة سدرة، نولي خصوصية بياناتك أهمية قصوى. تهدف هذه السياسة إلى توضيح كيفية تعاملنا مع معلوماتك الشخصية لضمان تجربة آمنة وموثوقة.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 1 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <Database className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-gray-900">1. المعلومات التي نجمعها</h2>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-2">بيانات التسجيل</h3>
                                    <p className="text-gray-600 text-sm">الاسم، البريد الإلكتروني، رقم الهاتف، والبيانات الأكاديمية.</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-2">بيانات الدفع</h3>
                                    <p className="text-gray-600 text-sm">تفاصيل المعاملات المالية (علماً بأننا لا نخزن بيانات البطاقات البنكية).</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-2">بيانات الاستخدام</h3>
                                    <p className="text-gray-600 text-sm">معلومات حول كيفية تفاعلك مع المنصة والجلسات المحجوزة.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <Eye className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-gray-900">2. كيف نستخدم معلوماتك</h2>
                            </div>
                            <ul className="list-disc list-inside space-y-2 text-gray-600 pr-4 marker:text-primary-400">
                                <li>لتسهيل عملية حجز الدروس والتواصل الفعال بين الطالب والمعلم.</li>
                                <li>لتحسين جودة خدماتنا وتخصيص تجربة المستخدم بما يناسب احتياجاته.</li>
                                <li>لإرسال إشعارات مهمة وتنبيهات بخصوص حسابك أو حجوزاتك القادمة.</li>
                                <li>لأغراض الامتثال القانوني ومنع الاحتيال.</li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <Share2 className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-gray-900">3. مشاركة المعلومات</h2>
                            </div>
                            <div className="text-gray-600 space-y-2 pr-4">
                                <p>نحن نحترم خصوصيتك، ولذلك:</p>
                                <ul className="list-disc list-inside space-y-2 marker:text-primary-400">
                                    <li><strong className="text-gray-900">لا نقوم ببيع</strong> بياناتك لأي أطراف ثالثة لأغراض دعائية.</li>
                                    <li>قد نشارك معلومات محدودة مع <strong className="text-gray-900">مزودي الخدمات الموثوقين</strong> (مثل بوابات الدفع) فقط لغرض تقديم الخدمة.</li>
                                    <li>قد نفصح عن المعلومات إذا كان ذلك مطلوباً بموجب القانون أو لحماية حقوقنا.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 4 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <Lock className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-gray-900">4. أمن البيانات</h2>
                            </div>
                            <p className="text-gray-600 pr-4">
                                نتخذ تدابير أمنية تقنية وتنظيمية صارمة لحماية بياناتك من الوصول غير المصرح به، التغيير، الكشف، أو الإتلاف. نستخدم تقنيات التشفير المتطورة لحماية البيانات الحساسة أثناء النقل والتخزين.
                            </p>
                        </section>

                        {/* Section 5 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <UserCheck className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-gray-900">5. حقوقك</h2>
                            </div>
                            <div className="text-gray-600 space-y-2 pr-4">
                                <p>لك الحق في التحكم الكامل بمعلوماتك:</p>
                                <ul className="list-disc list-inside space-y-2 marker:text-primary-400">
                                    <li>حق الوصول إلى بياناتك الشخصية في أي وقت.</li>
                                    <li>حق تصحيح البيانات غير الدقيقة أو تحديثها.</li>
                                    <li>حق طلب حذف حسابك وجميع بياناتك نهائياً بالتواصل مع الدعم الفني.</li>
                                </ul>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
