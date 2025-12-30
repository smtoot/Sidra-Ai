import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GraduationCap, School } from "lucide-react";

export default function HowItWorksIndexPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-surface font-tajawal" dir="rtl">
            <div className="container mx-auto px-4 text-center">
                <h1 className="text-3xl md:text-5xl font-bold text-[#111827] mb-12">كيف يمكننا مساعدتك اليوم؟</h1>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Student Card */}
                    <Link href="/how-it-works/student" className="group">
                        <div className="bg-white p-10 rounded-3xl shadow-sm border-2 border-transparent hover:border-primary/20 hover:shadow-xl transition-all h-full">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <GraduationCap className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors">كيف تساعدك سدرة كطالب؟</h2>
                            <p className="text-text-subtle mb-8 text-lg">
                                اكتشف كيف نسهل عليك رحلة البحث عن المعلم المثالي والتعلم بمرونة وأمان.
                            </p>
                            <span className="text-primary font-bold flex items-center justify-center gap-2">
                                اكتشف تجربة الطالب
                                <span className="text-xl">&larr;</span>
                            </span>
                        </div>
                    </Link>

                    {/* Teacher Card */}
                    <Link href="/how-it-works/teacher" className="group">
                        <div className="bg-white p-10 rounded-3xl shadow-sm border-2 border-transparent hover:border-accent/20 hover:shadow-xl transition-all h-full">
                            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center text-accent mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <School className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-accent transition-colors">كيف تساعدك سدرة كمعلم؟</h2>
                            <p className="text-text-subtle mb-8 text-lg">
                                تعرف على الأدوات التي نقدمها لتمكينك من التدريس وبناء دخلك الخاص بحرية.
                            </p>
                            <span className="text-accent font-bold flex items-center justify-center gap-2">
                                اكتشف تجربة المعلم
                                <span className="text-xl">&larr;</span>
                            </span>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
