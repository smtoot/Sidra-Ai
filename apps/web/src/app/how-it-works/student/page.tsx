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
                        تعليم أونلاين آمن… <br className="hidden md:block" />
                        <span className="text-primary mt-2 inline-block">يرفع مستوى ابنك من البيت</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                        حصص فردية مباشرة مع نخبة من المعلمين السودانيين.<br className="hidden sm:block" />
                        متابعة مستمرة، بيئة تعليمية آمنة، ودفع محمي 100%.
                    </p>

                    {/* Trust Highlights */}
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10 text-sm md:text-base font-medium text-gray-600">
                        <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-4 py-2 rounded-full text-blue-700">
                            <Video className="w-4 h-4" />
                            <span>حصص مباشرة أونلاين</span>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 px-4 py-2 rounded-full text-emerald-700">
                            <Lock className="w-4 h-4" />
                            <span>دفع محمي</span>
                        </div>
                        <div className="flex items-center gap-2 bg-purple-50/50 border border-purple-100 px-4 py-2 rounded-full text-purple-700">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>معلمون موثوقون</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                            <Button size="lg" className="h-12 px-8 text-lg rounded-full w-full sm:w-auto shadow-sm hover:shadow-md transition-all font-bold" asChild>
                                <Link href="/search" className="!text-white" style={{ color: "white" }}>ابدأ البحث عن معلم</Link>
                            </Button>
                            <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full w-full sm:w-auto border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900" asChild>
                                <Link href="#faq">الأسئلة الشائعة</Link>
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                            بدون التزام • بدون تسجيل مسبق • البحث مجاني
                        </p>
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
                                <h3 className="text-xl font-bold text-[#111827] mb-3">1. اختر المعلم الذي تطمئن له</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    تصفّح ملفات المعلمين، واطّلع على خبراتهم وتقييمات أولياء الأمور.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="relative group text-center bg-white p-4 rounded-xl z-10">
                                <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    <Calendar className="w-10 h-10 text-orange-600" />
                                </div>
                                <h3 className="text-xl font-bold text-[#111827] mb-3">2. احجز موعدك أونلاين بسهولة</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    اختر الوقت المناسب لك وأكّد الحجز خلال دقائق.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="relative group text-center bg-white p-4 rounded-xl z-10">
                                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    <Video className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-[#111827] mb-3">3. ابنك يتعلّم من بيته بأمان</h3>
                                <p className="text-gray-600 leading-relaxed mb-1">
                                    الحصة تتم مباشرة أونلاين بدون أي تنقّل أو مجهود.
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
                            <h2 className="text-2xl md:text-3xl font-bold text-[#111827] mb-4">حصصنا أونلاين 100%… بدون مشاوير ولا تعب</h2>
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                جميع الحصص تتم مباشرة عبر منصات موثوقة مثل Google Meet و Zoom.<br />
                                تعلّم مريح من المنزل يوفر الوقت والمجهود عليك وعلى ابنك.
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
                                <CardTitle className="text-2xl md:text-3xl font-bold text-[#111827]">أمانك المالي مسؤوليتنا</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 md:p-10 text-center">
                                <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-medium mb-8">
                                    "نحتفظ بالمبلغ المدفوع بشكل آمن داخل منصة سدرة، ولا يتم تحويله للمعلم إلا بعد انتهاء الحصة وتأكيدك أنت (أو ولي الأمر) أن الحصة تمت بنجاح. نظام حماية يضمن حقك ويمنحك راحة بال كاملة."
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
                        <AccordionItem value="item-5" className="bg-white border rounded-xl px-2 shadow-sm">
                            <AccordionTrigger className="text-lg font-bold text-[#111827] hover:no-underline px-4 py-4">هل أحتاج تحميل برنامج خاص؟</AccordionTrigger>
                            <AccordionContent className="text-gray-600 leading-relaxed text-base px-4 pb-4">
                                لا، الحصص تتم عبر Google Meet أو Zoom بدون أي تحميل إضافي.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>

            {/* 6) Final CTA */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 text-center max-w-4xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-6">جاهز تبدأ رحلة تعليم أونلاين آمنة لابنك؟</h2>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                        انضم لمئات الأسر التي اختارت سدرة<br className="hidden sm:block" />
                        لتعليم أبنائها مع معلمين موثوقين وفي بيئة آمنة.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-3">
                        <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg hover:shadow-xl transition-all font-bold" asChild>
                            <Link href="/search" className="!text-white" style={{ color: "white" }}>ابدأ البحث عن معلم الآن</Link>
                        </Button>
                        <p className="text-sm text-gray-500 font-medium">
                            الدفع آمن • لا التزام مسبق • دعم دائم
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
