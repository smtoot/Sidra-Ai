'use client';


import { Badge } from '@/components/ui/badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function FAQPage() {
    const faqs = {
        students: [
            {
                q: 'كيف يمكنني حجز حصة مع معلم؟',
                a: 'يمكنك البحث عن المعلم المناسب عبر صفحة "بحث"، ثم اختيار الوقت المتاح من جدول المعلم وإتمام عملية الدفع لتأكيد الحجز.'
            },
            {
                q: 'هل يمكنني إلغاء الحصة واسترداد المبلغ؟',
                a: 'نعم، يمكنك إلغاء الحصة قبل 24 ساعة من موعدها مجاناً. سياسات الإلغاء المتأخر تعتمد على سياسة كل معلم.'
            },
            {
                q: 'كيف يمكنني حضور الحصة؟',
                a: 'بعد تأكيد الحجز، سيظهر رابط الحصة في لوحة التحكم الخاصة بك. يمكنك الانضمام في الموعد المحدد عبر أي جهاز متصل بالإنترنت.'
            }
        ],
        parents: [
            {
                q: 'كيف يمكنني متابعة تقدم أبنائي؟',
                a: 'يمكنك إنشاء حساب ولي أمر وربط حسابات أبنائك به. ستتمكن من رؤية جداولهم، سجل الحجوزات، وتقارير المعلمين.'
            },
            {
                q: 'هل المنصة آمنة للأطفال؟',
                a: 'نعم، نحن نولي أمان الطلاب أولوية قصوى. جميع المعلمين يتم التحقق من هوياتهم وسجلاتهم، ونراقب جودة الحصص بانتظام.'
            }
        ],
        teachers: [
            {
                q: 'كيف يمكنني الانضمام كمعلم في سدرة؟',
                a: 'يمكنك التسجيل عبر صفحة "انضم كمعلم"، ورفع المستندات المطلوبة. سيقوم فريقنا بمراجعة طلبك والتواصل معك لإجراء المقابلة.'
            },
            {
                q: 'كم تبلغ عمولة المنصة؟',
                a: 'تقتطع المنصة نسبة محددة من كل حصة لتغطية تكاليف التشغيل والتسويق والدعم الفني. سيتم توضيح التفاصيل في عقد المعلم.'
            }
        ]
    };

    return (
        <div className="min-h-screen bg-gray-50 font-tajawal rtl flex flex-col">


            <main className="flex-grow py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <Badge variant="secondary" className="mb-4 px-4 py-1 text-primary-700 bg-primary-100 hover:bg-primary-200 border-none">
                            الأسئلة الشائعة
                        </Badge>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">كيف يمكننا مساعدتك؟</h1>
                        <p className="text-gray-600 mb-8">
                            إليك الإجابات على أكثر الأسئلة شيوعاً حول استخدام منصة سدرة
                        </p>

                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="ابحث عن سؤال..."
                                className="pr-12 h-12 bg-white shadow-sm border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                        <Tabs defaultValue="students" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-gray-100/50 p-1">
                                <TabsTrigger value="students" className="data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm">الطلاب</TabsTrigger>
                                <TabsTrigger value="parents" className="data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm">أولياء الأمور</TabsTrigger>
                                <TabsTrigger value="teachers" className="data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm">المعلمون</TabsTrigger>
                            </TabsList>

                            {Object.entries(faqs).map(([key, questions]) => (
                                <TabsContent key={key} value={key} className="mt-0">
                                    <Accordion type="single" collapsible className="w-full">
                                        {questions.map((faq, i) => (
                                            <AccordionItem key={i} value={`item-${i}`} className="border-b-gray-100 last:border-0">
                                                <AccordionTrigger className="text-right font-semibold text-gray-900 hover:text-primary-600 hover:no-underline py-4">
                                                    <div className="flex items-center gap-3">
                                                        <HelpCircle className="w-5 h-5 text-primary-500 shrink-0" />
                                                        {faq.q}
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="text-gray-600 leading-relaxed pr-8 pb-4">
                                                    {faq.a}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>

                    <div className="text-center mt-12 bg-blue-50 rounded-2xl p-8 max-w-3xl mx-auto">
                        <h3 className="font-bold text-lg text-blue-900 mb-2">لم تجد إجابة لسؤالك؟</h3>
                        <p className="text-blue-700 mb-6">فريق الدعم لدينا متواجد دائماً لمساعدتك في أي وقت</p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                            <a href="/contact">تواصل معنا</a>
                        </Button>
                    </div>
                </div>
            </main>


        </div>
    );
}
