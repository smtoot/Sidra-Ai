import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Timer, Wallet, Globe, Users, Laptop, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function TeacherHowItWorksPage() {
    return (
        <div className="font-tajawal relative overflow-hidden" dir="rtl">
            {/* Hero Section */}
            <section className="relative py-24 lg:py-40 bg-[#0f172a] text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/20 rounded-full blur-[100px]" />

                <div className="container mx-auto px-4 text-center relative z-10">

                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-8 tracking-tight animate-fade-in-up delay-100 leading-tight text-white drop-shadow-sm">
                        ابدأ التدريس أونلاين
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent">وزِد دخلك بمرونة</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-12 animate-fade-in-up delay-200 leading-relaxed font-light">
                        أنشئ ملفك، حدّد سعرك وجدولك، واستقبل طلبات طلاب مناسبين لموادك من داخل وخارج السودان.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 animate-fade-in-up delay-300">
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-full bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 w-full sm:w-auto transition-all hover:scale-105 group" asChild>
                                <Link href="/join-as-teacher" className="!text-white group-hover:text-white">انضم كمعلم الآن</Link>
                            </Button>
                            <Button variant="outline" size="lg" className="h-16 px-10 text-xl rounded-full border-2 border-white/20 hover:bg-white/10 text-white w-full sm:w-auto" asChild>
                                <Link href="#requirements">شروط الانضمام</Link>
                            </Button>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">التسجيل مجاني • تحكم كامل في وقتك • دعم في إعداد الملف</p>
                    </div>
                </div>
            </section>

            {/* Why Sidra Section */}
            <section className="py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl font-bold text-[#111827] mb-4">لماذا سدرة هي خيارك الأفضل؟</h2>
                        <p className="text-text-subtle text-lg max-w-2xl mx-auto">صممنا المنصة لتمنحك الأدوات والحرية التي تستحقها كمعلم محترف.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                                <Timer className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">حرية كاملة في الوقت</h3>
                            <p className="text-text-subtle leading-relaxed">
                                اختر الأيام والساعات التي تناسبك فقط.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-6">
                                <Wallet className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">دخل إضافي بمرونة</h3>
                            <p className="text-text-subtle leading-relaxed">
                                أنت من يحدد سعر الحصة حسب خبرتك ومجالك.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                                <Users className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">مجتمع تعليمي سوداني</h3>
                            <p className="text-text-subtle leading-relaxed">
                                طلاب من داخل السودان وخارجه يبحثون عن معلمين موثوقين.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                                <CheckCircle className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">مدفوعات مضمونة وآمنة</h3>
                            <p className="text-text-subtle leading-relaxed">
                                كل حصة يتم حجزها عبر سدرة تكون مدفوعة ومؤكدة مسبقًا. نستلم قيمة الحصة لضمان حقك الكامل، ويتم تحويل أرباحك بعد انتهاء الحصة بكل سلاسة.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section className="py-24 bg-white relative">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative order-2 lg:order-1">
                            {/* Placeholder for an image of dashboard or happy teacher - using a gradient box for now */}
                            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center relative overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
                                <Laptop className="w-24 h-24 text-gray-300" />
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
                            </div>
                            {/* Floating Card */}
                            <div className="absolute -bottom-6 -right-6 lg:right-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-xs animate-bounce-slow">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">تم تحويل</p>
                                        <p className="text-lg font-bold text-gray-900">$1,000</p>
                                    </div>
                                </div>
                                <p className="text-xs text-green-600 font-medium">+ أرباح هذا الشهر</p>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <h2 className="text-3xl font-bold text-[#111827] mb-8">ابدأ في 3 خطوات بسيطة</h2>

                            <div className="space-y-10">
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white ring-2 ring-primary/10">1</div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">أنشئ ملفك التعريفي</h3>
                                        <p className="text-text-subtle leading-relaxed">
                                            أضف خبراتك، موادك، ومعلوماتك التعليمية.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white ring-2 ring-primary/10">2</div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">حدّد سعرك وجدولك</h3>
                                        <p className="text-text-subtle leading-relaxed">
                                            أنت المتحكم الكامل في السعر والأوقات.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white ring-2 ring-primary/10">3</div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">استقبل الطلبات وابدأ التدريس</h3>
                                        <p className="text-text-subtle leading-relaxed">
                                            طلبات حقيقية من طلاب جاهزين للتعلّم.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10">
                                <p className="text-sm text-text-subtle mb-4">التسجيل لا يستغرق أكثر من 3–5 دقائق، ويمكنك تعديل ملفك في أي وقت.</p>
                                <Button className="h-12 px-8 rounded-full" asChild>
                                    <Link href="/join-as-teacher">ابدأ التسجيل الآن <ArrowLeft className="w-4 h-4 mr-2" /></Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Requirements Section */}
            <section id="requirements" className="py-24 bg-gray-50 border-t border-gray-100">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#111827] mb-4">شروط الانضمام</h2>
                        <p className="text-text-subtle text-lg">نضع هذه المتطلبات فقط لضمان جودة التعليم وحماية حقوق الجميع.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">التحقق من الهوية لضمان الأمان</h4>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">خبرة أو مؤهل مناسب</h4>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">الالتزام بالمواعيد</h4>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">اتصال إنترنت مستقر</h4>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">جهاز مناسب (لابتوب أو تابلت)</h4>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">أسلوب تواصل مهني</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Teacher FAQ Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#111827] mb-4">أسئلة شائعة للمعلمين</h2>
                    </div>

                    <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-lg font-bold">كيف تصلني طلبات الطلاب؟</AccordionTrigger>
                            <AccordionContent className="text-text-subtle text-base leading-relaxed">
                                تظهر لك الطلبات مباشرة حسب تخصصك وجدولك ويمكنك قبولها أو رفضها.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="text-lg font-bold">متى وكيف يتم الدفع؟</AccordionTrigger>
                            <AccordionContent className="text-text-subtle text-base leading-relaxed">
                                يتم تحويل المبلغ لك بعد انتهاء الحصة وتأكيد الطالب.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="text-lg font-bold">هل أتحكم في السعر والجدول؟</AccordionTrigger>
                            <AccordionContent className="text-text-subtle text-base leading-relaxed">
                                نعم، أنت من يحدد السعر وأوقات التدريس بالكامل.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger className="text-lg font-bold">هل توجد عمولة؟</AccordionTrigger>
                            <AccordionContent className="text-text-subtle text-base leading-relaxed">
                                نعم، توجد نسبة بسيطة لتغطية تكاليف التشغيل والتسويق، تظهر لك بوضوح عند تحديد السعر.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-primary text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-8">جاهز تبدأ التدريس مع سدرة؟</h2>
                    <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-12">
                        أنشئ ملفك وحدد سعرك واستقبل طلبات طلاب مناسبين.
                    </p>
                    <div className="flex flex-col items-center">
                        <Button size="lg" variant="secondary" className="h-16 px-12 text-xl font-bold rounded-full shadow-2xl hover:scale-105 transition-transform text-primary bg-[#FCD34D] hover:bg-[#FCD34D]/90 border-none group" asChild>
                            <Link href="/join-as-teacher">انضم كمعلم الآن</Link>
                        </Button>
                        <p className="text-primary-foreground/80 mt-4 text-sm font-medium">التسجيل مجاني • بدون التزام • دعم خطوة بخطوة</p>
                    </div>
                </div>
            </section>
        </div >
    );
}
