'use client';

import { PublicNavbar, Footer } from '@/components/public';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollText, Calendar, Shield, CreditCard, Users, AlertCircle } from 'lucide-react';

export default function TermsPage() {
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
                                الشروط والأحكام
                            </Badge>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">اتفاقية استخدام منصة سدرة</h1>
                            <p className="text-gray-500">
                                آخر تحديث: {lastUpdated}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <Card className="border-none shadow-sm bg-blue-50/50">
                            <CardContent className="p-6 flex gap-4">
                                <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-blue-900 mb-2">مقدمة هامة</h3>
                                    <p className="text-blue-800 leading-relaxed text-sm">
                                        مرحباً بكم في منصة سدرة. يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام خدماتنا. بوصولك واستخدامك لمنصة سدرة، فإنك توافق على الالتزام بهذه الشروط والأحكام وجميع القوانين المعمول بها.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 1 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <Shield className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-gray-900">1. الحسابات والتسجيل</h2>
                            </div>
                            <ul className="list-disc list-inside space-y-2 text-gray-600 pr-4 marker:text-primary-400">
                                <li>يجب أن تكون المعلومات المقدمة أثناء التسجيل دقيقة ومحدثة.</li>
                                <li>أنت مسؤول مسؤولية كاملة عن الحفاظ على سرية بيانات اعتماد حسابك.</li>
                                <li>يجب على المستخدمين دون سن 18 عاماً استخدام المنصة بإشراف ولي الأمر عن طريق حساب ولي الأمر حصراً.</li>
                            </ul>
                        </section>

                        {/* Section 2 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <ScrollText className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-gray-900">2. خدمات المنصة</h2>
                            </div>
                            <div className="text-gray-600 space-y-2 pr-4">
                                <p>تعمل سدرة كوسيط تقني يربط بين المعلمين والطلاب/أولياء الأمور لتسهيل العملية التعليمية.</p>
                                <p className="font-medium text-gray-900">تنويه هام: المعلمون في سدرة هم مقدمو خدمات مستقلون وليسوا موظفين لدى المنصة.</p>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <CreditCard className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-gray-900">3. الحجوزات والمدفوعات</h2>
                            </div>
                            <div className="space-y-4 pr-4 text-gray-600">
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">طرق الدفع</h3>
                                    <p>يتم الدفع عبر القنوات المتاحة والرسمية في المنصة (مثل التحويل البنكي أو الدفع الإلكتروني).</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">سياسة الإلغاء والاسترداد</h3>
                                    <ul className="list-disc list-inside space-y-2 marker:text-primary-400">
                                        <li><strong className="text-gray-800">حرية المعلم:</strong> سياسة الإلغاء الدقيقة (المدة المسموحة للإلغاء المجاني) تعتمد بشكل أساسي على السياسة التي يحددها كل معلم في ملفه الشخصي.</li>
                                        <li><strong className="text-gray-800">الإطار العام:</strong> يجب على الطالب مراجعة سياسة المعلم قبل الحجز. في حال عدم وجود سياسة محددة، تطبق سياسة المنصة القياسية (إلغاء مجاني قبل 24 ساعة).</li>
                                        <li><strong className="text-gray-800">استرداد الرصيد:</strong> في حال الإلغاء ضمن الفترة المسموحة، يعاد الرصيد إلى محفظة الطالب في المنصة.</li>
                                        <li><strong className="text-gray-800">إلغاء المعلم:</strong> في حال قام المعلم بإلغاء الحصة، يحق للطالب استرداد كامل المبلغ أو إعادة جدولة الحصة.</li>
                                        <li><strong className="text-gray-800">عدم الحضور (No-Show):</strong> في حال عدم حضور الطالب للحصة دون إلغاء مسبق، لا يحق له استرداد المبلغ.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Section 4 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <Users className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-gray-900">4. قواعد السلوك والاستخدام</h2>
                            </div>
                            <div className="space-y-4 pr-4 text-gray-600">
                                <ul className="list-disc list-inside space-y-2 marker:text-primary-400">
                                    <li><strong className="text-gray-800">الاحترام المتبادل:</strong> يلتزم جميع المستخدمين بالتواصل باحترام ومهنية. يُمنع أي سلوك مسيء، تحرش، أو تنمر.</li>
                                    <li><strong className="text-gray-800">التواصل داخل المنصة:</strong> يمنع تبادل أرقام التواصل الشخصية أو محاولة التعامل المالي خارج نطاق المنصة.</li>
                                    <li><strong className="text-gray-800">المحتوى المحظور:</strong> يُمنع نشر أي محتوى مخالف للقوانين، أو سياسي، أو خادش للحياء.</li>
                                </ul>
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                    <h3 className="font-bold text-orange-900 mb-2 text-sm">تسجيل الجلسات</h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
                                        <li>يُمنع تسجيل الجلسات (فيديو أو صوت) من قبل الطالب دون موافقة صريحة من المعلم.</li>
                                        <li>أي تسجيلات مسموحة هي للاستخدام الشخصي التعليمي فقط ويمنع نشرها أو مشاركتها.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Section 5 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <AlertCircle className="w-6 h-6 text-primary-600" />
                                <h2 className="text-2xl font-bold text-gray-900">5. الملكية الفكرية وإنهاء الخدمة</h2>
                            </div>
                            <div className="text-gray-600 space-y-4 pr-4">
                                <p>
                                    جميع المحتويات والمواد التعليمية الموجودة على المنصة (بما في ذلك دروس المعلمين المسجلة وموادهم) محمية بموجب حقوق الطبع والنشر. لا يجوز نسخها أو إعادة توزيعها دون إذن.
                                </p>
                                <p>
                                    تحتفظ سدرة بالحق في تعليق أو إنهاء حساب أي مستخدم ينتهك هذه الشروط، خاصة فيما يتعلق بالتواصل الخارجي أو الإساءة للآخرين.
                                </p>
                            </div>
                        </section>

                        {/* Disclaimer */}
                        <div className="mt-12 p-6 bg-gray-50 rounded-xl text-center text-gray-500 text-sm">
                            <p>
                                المنصة تقدم "كما هي" ولا نضمن عدم انقطاع الخدمة أو خلوها من الأخطاء. نحن غير مسؤولين عن أي أضرار ناتجة عن استخدام المنصة أو عن جودة المحتوى التعليمي الذي يقدمه المعلمون المستقلون.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
