import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Calendar, Video, ShieldCheck, CreditCard, Star } from "lucide-react";
import Link from "next/link";

export default function StudentHowItWorksPage() {
    return (
        <div className="font-tajawal relative overflow-hidden" dir="rtl">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden bg-surface">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in-up">
                        <Star className="w-4 h-4 fill-current" />
                        <span>منصة التعليم الأولى في السودان</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#111827] mb-6 tracking-tight animate-fade-in-up delay-100">
                        رحلتك التعليمية تبدأ <span className="text-primary relative inline-block">
                            هنا
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-accent/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-text-subtle max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200 leading-relaxed">
                        اكتشف أفضل المعلمين السودانيين، وتعلم وفق جدولك الخاص، وحقق أهدافك الدراسية في بيئة آمنة ومتطورة.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all w-full sm:w-auto" asChild>
                            <Link href="/explore">ابحث عن معلم الآن</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 w-full sm:w-auto" asChild>
                            <Link href="/faq">الأسئلة الشائعة</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#111827] mb-4">كيف تعمل المنصة؟</h2>
                        <p className="text-text-subtle text-lg">ثلاث خطوات بسيطة تفصلك عن التفوق الدراسي</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 right-1/6 left-1/6 h-0.5 bg-gradient-to-l from-transparent via-gray-200 to-transparent -z-10" />

                        {/* Step 1 */}
                        <div className="relative group">
                            <div className="w-24 h-24 bg-white border-4 border-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 relative z-10">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                    <Search className="w-8 h-8" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-white">1</div>
                            </div>
                            <h3 className="text-xl font-bold text-[#111827] text-center mb-3">اختر معلمك المفضل</h3>
                            <p className="text-text-subtle text-center leading-relaxed">
                                تصفح ملفات المعلمين، شاهد فيديوهاتهم التعريفية، واقرأ تقييمات الطلاب السابقين لتجد المعلم الأنسب لك.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative group">
                            <div className="w-24 h-24 bg-white border-4 border-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 relative z-10">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-white">2</div>
                            </div>
                            <h3 className="text-xl font-bold text-[#111827] text-center mb-3">احجز حصتك بسهولة</h3>
                            <p className="text-text-subtle text-center leading-relaxed">
                                اختر التوقيت الذي يناسبك من جدول المعلم المتاح، وقم بتأكيد الحجز والدفع بخطوات آمنة وسريعة.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative group">
                            <div className="w-24 h-24 bg-white border-4 border-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 relative z-10">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <Video className="w-8 h-8" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-white">3</div>
                            </div>
                            <h3 className="text-xl font-bold text-[#111827] text-center mb-3">ابدأ التعلم فوراً</h3>
                            <p className="text-text-subtle text-center leading-relaxed">
                                انضم للفصل الافتراضي في الموعد المحدد واستمتع بتجربة تعليمية تفاعلية مباشرة مع معلمك.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features/Benefits Section */}
            <section className="py-20 bg-surface">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#111827] mb-4">لماذا يختار الطلاب سدرة؟</h2>
                        <p className="text-text-subtle text-lg">نوفر لك بيئة تعليمية متكاملة تضمن لك الأمان والجودة</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white">
                            <CardHeader>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-xl font-bold text-[#111827]">معلمون موثوقون</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-text-subtle leading-relaxed">
                                    نحن نتحقق من هوية ومؤهلات كل معلم ينضم للمنصة لضمان حصولك على تعليم عالي الجودة من خبراء في مجالهم.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white">
                            <CardHeader>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                                    <Star className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-xl font-bold text-[#111827]">جودة مضمونة</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-text-subtle leading-relaxed">
                                    نظام تقييم شفاف يسمح لك برؤية آراء الطلاب السابقين، مع ضمان استرداد الحقوق في حال عدم رضاك عن التجربة.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white">
                            <CardHeader>
                                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-xl font-bold text-[#111827]">دفع آمن وسهل</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-text-subtle leading-relaxed">
                                    خيارات دفع محلية وعالمية آمنة، مع حماية كاملة لمدفوعاتك ورصيدك في المحفظة الإلكترونية.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* FAQ Teaser Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-[#111827] mb-4">أسئلة شائعة من الطلاب</h2>
                        <Link href="/faq" className="text-primary hover:text-primary-hover font-medium hover:underline">
                            عرض جميع الأسئلة الشائعة &larr;
                        </Link>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-lg font-medium">كيف أضمن جودة المعلم؟</AccordionTrigger>
                            <AccordionContent className="text-text-subtle leading-relaxed text-base">
                                يمكنك الاطلاع على الملف الشخصي للمعلم، ومشاهدة الفيديو التعريفي، وقراءة تقييمات الطلاب الآخرين. كما نقدم لك ضمان استرداد الرصيد في حال لم تكن الحصة كما هو متوقع.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="text-lg font-medium">ماذا لو اضطررت لإلغاء الحصة؟</AccordionTrigger>
                            <AccordionContent className="text-text-subtle leading-relaxed text-base">
                                يمكنك إلغاء أو إعادة جدولة الحصة بسهولة من لوحة التحكم الخاصة بك. يرجى مراجعة سياسة الإلغاء الخاصة بالمعلم، والتي تظهر بوضوح قبل الحجز (عادةً يسمح بالإلغاء المجاني قبل 24 ساعة).
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="text-lg font-medium">هل يمكنني تجربة حصة قبل الالتزام بباقة؟</AccordionTrigger>
                            <AccordionContent className="text-text-subtle leading-relaxed text-base">
                                نعم، العديد من المعلمين يقدمون حصصاً تجريبية بأسعار مخفضة أو مدد قصيرة لتتعرف على أسلوبهم قبل شراء باقة كاملة.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary/5">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-6">مستعد لرفع مستواك الدراسي؟</h2>
                    <p className="text-text-subtle text-lg max-w-2xl mx-auto mb-10">
                        انضم لآلاف الطلاب الذين يحققون أهدافهم يومياً مع أفضل المعلمين السودانيين.
                    </p>
                    <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all" asChild>
                        <Link href="/explore">ابحث عن معلم الآن</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
