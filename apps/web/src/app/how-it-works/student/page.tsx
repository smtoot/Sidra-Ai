import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Calendar, Video, ShieldCheck, CheckCircle2, Laptop, Lock, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function StudentHowItWorksPage() {
    return (
        <div className="min-h-screen bg-gray-50/50 font-tajawal direction-rtl" dir="rtl">
            {/* 1) Page Hero */}
            <section className="relative py-16 lg:py-24 overflow-hidden bg-white border-b border-gray-100">
                <div className="absolute inset-0 bg-grid-slate-50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] -z-10" />

                <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-[#111827] mb-6 leading-tight tracking-tight">
                        كيف تستخدم سدرة؟ <br className="hidden md:block" />
                        <span className="text-primary mt-2 inline-block">تعلّم أونلاين بثقة وخطوات واضحة</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                        سدرة منصة تعليمية أونلاين 100%، تربطك بأفضل المعلمين السودانيين في حصص مباشرة عبر الإنترنت، بدون الحاجة للذهاب إلى أي مكان.
                    </p>

                    {/* Trust Highlights */}
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10 text-sm md:text-base font-medium text-gray-700">
                        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-blue-800">
                            <Video className="w-4 h-4" />
                            <span>حصص مباشرة أونلاين</span>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full text-emerald-800">
                            <Lock className="w-4 h-4" />
                            <span>دفع محمي</span>
                        </div>
                        <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full text-purple-800">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>معلمون موثوقون</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="h-12 px-8 text-lg rounded-full w-full sm:w-auto shadow-sm hover:shadow-md transition-all" asChild>
                            <Link href="/explore">ابدأ البحث عن معلم</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full w-full sm:w-auto border-gray-200 hover:bg-gray-50 hover:text-gray-900" asChild>
                            <Link href="#faq">الأسئلة الشائعة</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* 2) HOW IT WORKS – Core Steps */}
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden md:block absolute top-12 right-[15%] left-[15%] h-0.5 bg-gradient-to-l from-gray-100 via-primary/20 to-gray-100 -z-0" />

                            {/* Step 1 */}
                            <div className="relative group text-center bg-white p-4 rounded-xl z-10">
                                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    <Search className="w-10 h-10 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-[#111827] mb-3">1. اختر معلمك المناسب</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    تصفح المعلمين حسب المادة، المرحلة، والمنهج، واطّلع على الخبرة والتقييمات.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="relative group text-center bg-white p-4 rounded-xl z-10">
                                <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    <Calendar className="w-10 h-10 text-orange-600" />
                                </div>
                                <h3 className="text-xl font-bold text-[#111827] mb-3">2. احجز الحصة أونلاين</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    اختر الوقت المناسب لك، وأكمل الحجز، وستصلك تفاصيل الحصة الأونلاين.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="relative group text-center bg-white p-4 rounded-xl z-10">
                                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    <Video className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-[#111827] mb-3">3. ابدأ الحصة من بيتك</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    تُقام الحصة مباشرة أونلاين عبر أدوات مثل Google Meet أو Zoom، بدون أي تنقّل.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3) ONLINE LEARNING CLARITY SECTION (Mandatory) */}
            <section className="py-16 bg-blue-50/50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-blue-100 flex flex-col md:flex-row items-center gap-8 md:gap-12 text-center md:text-right">
                        <div className="flex-shrink-0">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <Laptop className="w-12 h-12 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#111827] mb-4">جميع الحصص أونلاين 100%</h2>
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                كل الحصص في سدرة تُقام مباشرة عبر الإنترنت باستخدام أدوات موثوقة مثل Google Meet أو Zoom. لا حاجة للذهاب إلى أي مكان أو الحضور شخصيًا.
                            </p>
                            <ul className="grid sm:grid-cols-3 gap-3 text-sm font-medium text-gray-700">
                                <li className="flex items-center justify-center md:justify-start gap-2 bg-gray-50 py-2 px-3 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    تعلّم من البيت
                                </li>
                                <li className="flex items-center justify-center md:justify-start gap-2 bg-gray-50 py-2 px-3 rounded-lg">
                                    <Video className="w-4 h-4 text-green-500" />
                                    تواصل مباشر صوت وصورة
                                </li>
                                <li className="flex items-center justify-center md:justify-start gap-2 bg-gray-50 py-2 px-3 rounded-lg">
                                    <Calendar className="w-4 h-4 text-green-500" />
                                    مرونة في الوقت والمكان
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4) TRUST & PAYMENT PROTECTION SECTION */}
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm overflow-hidden">
                            <CardHeader className="bg-emerald-100/50 border-b border-emerald-100 py-6 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2 text-emerald-700">
                                    <ShieldCheck className="w-6 h-6" />
                                    <span className="font-semibold tracking-wide uppercase text-xs">أمان مضمون</span>
                                </div>
                                <CardTitle className="text-2xl md:text-3xl font-bold text-[#111827]">دفع محمي عبر سدرة</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 md:p-10 text-center">
                                <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-medium mb-8">
                                    "نحتفظ بالمبلغ المدفوع ولا يتم تحويله للمعلم إلا بعد انتهاء الحصة وتأكيد الطالب أو ولي الأمر."
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <span>معلمون موثوقون وتقييمات حقيقية</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <span>خصوصية وأمان كامل للطالب</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* 5) FAQs */}
            <section id="faq" className="py-16 bg-gray-50">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-[#111827] mb-4">الأسئلة الشائعة</h2>
                    </div>

                    <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-4">
                        <AccordionItem value="item-1" className="bg-white border rounded-xl px-2 shadow-sm">
                            <AccordionTrigger className="text-lg font-bold text-[#111827] hover:no-underline px-4 py-4">كيف أبدأ مع سدرة؟</AccordionTrigger>
                            <AccordionContent className="text-gray-600 leading-relaxed text-base px-4 pb-4">
                                اختر المادة والمرحلة والمنهج، ثم تصفح المعلمين واختر الأنسب بناءً على الخبرة والتقييمات، وبعدها احجز الحصة الأونلاين بكل سهولة.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2" className="bg-white border rounded-xl px-2 shadow-sm">
                            <AccordionTrigger className="text-lg font-bold text-[#111827] hover:no-underline px-4 py-4">هل الحصص حضورية أم أونلاين؟</AccordionTrigger>
                            <AccordionContent className="text-gray-600 leading-relaxed text-base px-4 pb-4">
                                جميع الحصص في سدرة أونلاين 100% وتُقام مباشرة عبر الإنترنت باستخدام أدوات مثل Google Meet أو Zoom.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3" className="bg-white border rounded-xl px-2 shadow-sm">
                            <AccordionTrigger className="text-lg font-bold text-[#111827] hover:no-underline px-4 py-4">كيف تضمن سدرة حقّي بعد الدفع؟</AccordionTrigger>
                            <AccordionContent className="text-gray-600 leading-relaxed text-base px-4 pb-4">
                                تحتفظ سدرة بالمبلغ المدفوع ولا يتم تحويله للمعلم إلا بعد انتهاء الحصة وتأكيد الطالب أو ولي الأمر.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4" className="bg-white border rounded-xl px-2 shadow-sm">
                            <AccordionTrigger className="text-lg font-bold text-[#111827] hover:no-underline px-4 py-4">هل الحصص فردية أم جماعية؟</AccordionTrigger>
                            <AccordionContent className="text-gray-600 leading-relaxed text-base px-4 pb-4">
                                جميع الحصص فردية (واحد لواحد) لضمان أفضل تركيز وجودة تعليم.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>

            {/* 6) Final CTA */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 text-center max-w-4xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-6">جاهز لبدء رحلة تعلّم أونلاين وآمنة لأبنائك؟</h2>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                        تعلّم من البيت مع أفضل المعلمين السودانيين عبر منصة موثوقة.
                    </p>
                    <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg hover:shadow-xl transition-all" asChild>
                        <Link href="/explore">ابدأ البحث عن معلم</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
