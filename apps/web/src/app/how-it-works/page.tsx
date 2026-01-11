import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GraduationCap, BookUser } from "lucide-react";

export default function HowItWorksIndexPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-surface font-tajawal py-12" dir="rtl">
            <div className="container mx-auto px-4 text-center">
                <h1 className="text-3xl md:text-5xl font-bold text-[#111827] mb-4">كيف تعمل سدرة؟ اختر مسارك وابدأ خلال دقائق</h1>
                <p className="text-xl text-text-subtle max-w-2xl mx-auto mb-12">
                    سواء كنت طالبًا/ولي أمر أو معلمًا، تعرّف على خطوات البداية والميزات الأساسية في سدرة.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
                    {/* Student Card */}
                    <div className="bg-white p-10 rounded-3xl shadow-sm border-2 border-transparent hover:border-primary/20 hover:shadow-xl transition-all h-full flex flex-col">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <GraduationCap className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">كيف تساعدك سدرة كطالب أو ولي أمر؟</h2>

                        <ul className="text-text-subtle mb-8 text-lg text-right space-y-3 flex-1 list-disc list-inside">
                            <li>ابحث حسب المادة، المرحلة، والمنهج</li>
                            <li>قارن المعلمين بالتقييم والسعر</li>
                            <li>احجز الحصة وابدأ التعلم فورًا</li>
                        </ul>

                        <div className="flex flex-col gap-3">
                            <Link href="/search">
                                <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold text-lg h-12">
                                    ابدأ البحث عن معلم
                                </Button>
                            </Link>
                            <Link href="/how-it-works/student" className="text-text-subtle hover:text-primary transition-colors text-sm font-medium">
                                كيف تحجز حصتك خطوة بخطوة
                            </Link>
                        </div>
                    </div>

                    {/* Teacher Card */}
                    <div className="bg-white p-10 rounded-3xl shadow-sm border-2 border-transparent hover:border-accent/20 hover:shadow-xl transition-all h-full flex flex-col">
                        <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center text-accent mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <BookUser className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">كيف تساعدك سدرة كمعلم؟</h2>

                        <ul className="text-text-subtle mb-8 text-lg text-right space-y-3 flex-1 list-disc list-inside">
                            <li>أنشئ ملفك وحدد موادك ومناهجك</li>
                            <li>استقبل طلبات الطلاب بسهولة</li>
                            <li>قدّم حصصك وتابع دخلك</li>
                        </ul>

                        <div className="flex flex-col gap-3">
                            <Link href="/register">
                                <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold text-lg h-12">
                                    انضم كمعلم
                                </Button>
                            </Link>
                            <Link href="/how-it-works/teacher" className="text-text-subtle hover:text-primary transition-colors text-sm font-medium">
                                ما المطلوب للتسجيل كمعلم؟
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
