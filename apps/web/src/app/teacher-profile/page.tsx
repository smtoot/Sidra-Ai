'use client';

import { useState } from 'react';
import { CreateBookingModal } from '@/components/booking/CreateBookingModal';

export default function TeacherProfilePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock teacher data
    const mockTeacherSubjects = [
        { id: '1', name: 'الكيمياء العامة', price: 2500 },
        { id: '2', name: 'IGCSE Chemistry', price: 3000 },
        { id: '3', name: 'AS & A Level', price: 3500 }
    ];

    return (
        <div className="min-h-screen flex flex-col font-display text-text-main overflow-x-hidden bg-background-light">
            {/* Navigation */}
            <nav className="bg-white border-b border-[#e6edf4] sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3 text-primary">
                                <div className="size-8 rounded bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">school</span>
                                </div>
                                <h2 className="text-primary text-xl font-bold tracking-tight">سدرة</h2>
                            </div>
                            <div className="hidden md:flex items-center gap-6">
                                <a className="text-text-main hover:text-primary text-sm font-medium transition-colors" href="#">المعلمين</a>
                                <a className="text-text-main hover:text-primary text-sm font-medium transition-colors" href="#">الدورات</a>
                                <a className="text-text-main hover:text-primary text-sm font-medium transition-colors" href="#">تعلمي</a>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative hidden sm:block">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                </div>
                                <input
                                    className="block w-full rounded-full border-0 py-1.5 pr-10 pl-4 bg-gray-100 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                    placeholder="ابحث عن معلم..."
                                    type="text"
                                />
                            </div>
                            <div
                                className="h-9 w-9 rounded-full bg-cover bg-center border border-gray-200"
                                style={{
                                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAXH6pkH7VsJ1LehevfzKmrWkqWqldvLNAlj3HLgPB0JoUH1xeWrMb1GVInTvLL5TNObrWBOG1lCVStI45BkqP3DAC20p1Dx5qRV5kT3G_FqcSUTa4O3xuDstrmeV0vxI8lUPeWZMpQxAUOyDG0vh2A6GaPQwklhQbriLi_l2PNotlDT1q_raKT4cjil_t7l4k-zm5BXzHOP5ORrZWlDkUFeqU4ywh65_D3ycBwPQVN8tHKlikjfF1QlmN_IQU6QBBKPXUJgklITkI')"
                                }}
                            />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Header */}
            <header className="relative bg-gradient-to-br from-cream-light to-secondary/30">
                <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-4">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[3px] border-white shadow-xl overflow-hidden bg-white">
                            <img
                                alt="Teacher Omar Portrait"
                                className="w-full h-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlBnHM8C_7qyd35saRH9R5Aa8lChRKmd_kWRhrQ_1Ji3ybcRt6dwCwHr8UMiZ0CzTYfXWvu16N4rv-4Rjcvjuzcb70YAexKNUYRm1G0jQ8fQgsrB8PybmI1S7eRegHMiFQwRbctYggDjAW7JzRkjIrhGHS5zSoJ-jbZ4PAWgpvGwW6NMxP4IRZwK6WLyp6IuEy7-autfGLsAha_W_zsHPtEECqd9Ym2qtFJ5WvRjcjbQxSG_pNhOKki0Z4SsLEHFNbiBk1Eo3vQgQ"
                            />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white" title="Online" />
                    </div>
                    <h1 className="text-primary text-3xl sm:text-4xl font-bold mb-2 font-display">الأستاذ عمر عبدالله</h1>
                    <p className="text-gray-700 text-lg sm:text-xl font-medium mb-4">معلم كيمياء • ماجستير في التربية</p>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-gray-700">
                        <div className="flex items-center gap-1.5 bg-white/50 px-3 py-1 rounded-full shadow-sm border border-gray-100">
                            <span className="material-symbols-outlined text-secondary filled text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="font-bold font-sans">4.9</span>
                            <span className="text-sm opacity-80">(124 تقييم)</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/50 px-3 py-1 rounded-full shadow-sm border border-gray-100">
                            <span className="material-symbols-outlined text-secondary text-[20px]">school</span>
                            <span className="font-bold font-sans">500+</span>
                            <span className="text-sm opacity-80">طالب</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/50 px-3 py-1 rounded-full shadow-sm border border-gray-100">
                            <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
                            <span className="text-sm font-medium">معلم موثق</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="layout-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 relative items-start">
                {/* Left Column - Main Content */}
                <main className="flex-1 w-full min-w-0 flex flex-col gap-6">
                    {/* About Section */}
                    <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-gray-100">
                        <h3 className="text-primary text-2xl font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">person</span>
                            عن الأستاذ عمر
                        </h3>
                        <div className="text-text-main leading-relaxed space-y-4 text-lg text-justify">
                            <p>
                                مرحباً بكم! أنا الأستاذ عمر، متخصص في تدريس الكيمياء للمرحلة الثانوية والجامعية بخبرة تزيد عن 8 سنوات. حاصل على درجة الماجستير في طرق تدريس العلوم، وأسعى دائماً لتبسيط المفاهيم المعقدة وربطها بالحياة العملية لجعل التعلم تجربة ممتعة ومفيدة.
                            </p>
                            <p>
                                أسلوبي يعتمد على الفهم العميق بدلاً من الحفظ، مع التركيز على حل المشكلات والتدريب المكثف على نماذج الامتحانات. ساعدت مئات الطلاب في تحقيق درجات ممتازة في اختبارات IGCSE و SAT Chemistry.
                            </p>
                        </div>
                    </section>

                    {/* Why Choose Me Section */}
                    <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-gray-100">
                        <h3 className="text-primary text-2xl font-bold mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined">psychology_alt</span>
                            لماذا تختارني؟
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-secondary shadow-sm mb-4 border border-gray-100">
                                    <span className="material-symbols-outlined text-[24px]">lightbulb</span>
                                </div>
                                <h4 className="font-bold text-primary mb-2">تبسيط المفاهيم</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">تحويل المعادلات الكيميائية المعقدة إلى أمثلة واقعية سهلة الفهم والاستيعاب.</p>
                            </div>
                            <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-secondary shadow-sm mb-4 border border-gray-100">
                                    <span className="material-symbols-outlined text-[24px]">assignment_turned_in</span>
                                </div>
                                <h4 className="font-bold text-primary mb-2">التركيز على الاختبارات</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">خبرة واسعة في نماذج اختبارات IGCSE و SAT مع استراتيجيات حل مضمونة.</p>
                            </div>
                            <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-secondary shadow-sm mb-4 border border-gray-100">
                                    <span className="material-symbols-outlined text-[24px]">trending_up</span>
                                </div>
                                <h4 className="font-bold text-primary mb-2">نتائج مضمونة</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">سجل حافل من تحسين درجات الطلاب ورفع مستواهم الأكاديمي بشكل ملحوظ.</p>
                            </div>
                        </div>
                    </section>

                    {/* Subjects & Skills */}
                    <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-gray-100">
                        <h3 className="text-primary text-2xl font-bold mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined">menu_book</span>
                            المواد والمهارات
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {['الكيمياء العامة', 'IGCSE Chemistry', 'AS & A Level', 'تحضيري جامعي', 'علوم المرحلة المتوسطة', 'SAT Subject Test'].map((subject) => (
                                <a
                                    key={subject}
                                    className="group cursor-pointer px-5 py-2.5 rounded-xl bg-gray-50 text-text-main font-medium border border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm hover:shadow-md"
                                    href="#"
                                >
                                    <span className="group-hover:translate-x-1 transition-transform inline-block">{subject}</span>
                                </a>
                            ))}
                        </div>
                    </section>

                    {/* Reviews Section */}
                    <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-primary text-2xl font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">reviews</span>
                                تقييمات الطلاب
                            </h3>
                            <div className="bg-primary/5 px-4 py-2 rounded-lg flex items-center gap-2">
                                <span className="text-2xl font-bold text-primary font-sans">4.9</span>
                                <div className="flex text-secondary">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="material-symbols-outlined filled text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500 mr-1">(124)</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-8 mb-8">
                            {/* Review 1 */}
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 relative group hover:border-primary/20 transition-colors">
                                <span className="material-symbols-outlined absolute top-6 left-6 text-6xl text-primary/5 select-none -z-0">format_quote</span>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div
                                            className="w-12 h-12 rounded-full bg-gray-200 bg-cover bg-center border-2 border-white shadow-sm"
                                            style={{
                                                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCwuroGYk0sb5G-_6UgZk9oMVJTDtNoXb4dmD3AuQP1iRwyFUvuTJfOcRjwq0ev9OW_gJ7bnCaAc6_DI3TAXYfanbYY6iDb_K5JuWkF5PSbs0GbyHFZ8ODTjpSM0jP3_vcC93y14J4-W10mKxQnLji3jZW2cvjAhIooAqfrdmMCxBaFadFHhnmlNU0blhiZA3Gco_4-ay_yzTCR7bEI7H7fiiyRw5eYQir6TBJzbyN7EEyxtuaOmowkk5k1hl1bPqZWs4pVKypieXo')"
                                            }}
                                        />
                                        <div>
                                            <h4 className="font-bold text-gray-900">أم يوسف</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="flex text-secondary text-[14px]">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className="material-symbols-outlined filled text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    ))}
                                                </div>
                                                <span className="text-xs text-gray-400">منذ أسبوعين</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xl font-medium text-primary/90 leading-relaxed mb-4 italic">
                                        "شرح ممتاز جداً ومبسط. ابني كان يعاني في الكيمياء العضوية والآن درجاته تحسنت بشكل ملحوظ. شكراً أستاذ عمر على اهتمامك ومتابعتك."
                                    </p>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 border-r-4 border-r-secondary/50">
                                        <p className="text-xs text-primary font-bold mb-1">رد المعلم:</p>
                                        <p className="text-sm text-gray-600">العفو أم يوسف، هذا واجبي ويوسف طالب مجتهد ويستحق كل خير.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Review 2 */}
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 relative group hover:border-primary/20 transition-colors">
                                <span className="material-symbols-outlined absolute top-6 left-6 text-6xl text-primary/5 select-none -z-0">format_quote</span>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-white shadow-sm">
                                            س
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">سعيد الغامدي</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="flex text-secondary text-[14px]">
                                                    {[...Array(4)].map((_, i) => (
                                                        <span key={i} className="material-symbols-outlined filled text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    ))}
                                                    <span className="material-symbols-outlined filled text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                                                </div>
                                                <span className="text-xs text-gray-400">منذ شهر</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xl font-medium text-primary/90 leading-relaxed italic">
                                        "الأستاذ متمكن جداً من المادة، والأسلوب تفاعلي يجعل الطالب يشارك في الحصة ولا يشعر بالملل. أتمنى لو كان هناك المزيد من الأوقات المسائية المتاحة."
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button className="w-full py-4 text-primary font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                            عرض جميع التقييمات (124)
                            <span className="material-symbols-outlined">expand_more</span>
                        </button>
                    </section>
                </main>

                {/* Right Sidebar - Simplified for Book Now button */}
                <aside className="w-full lg:w-[380px] shrink-0">
                    <div className="sticky top-24 z-10">
                        <div className="bg-white rounded-2xl shadow-float overflow-hidden border border-gray-100 p-6">
                            <h3 className="text-xl font-bold text-text-main mb-4">احجز جلستك الآن</h3>
                            <p className="text-sm text-gray-600 mb-6">اختر الموعد والمادة المناسبة لك</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
                            >
                                <span>احجز الآن</span>
                                <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform rtl:rotate-180">arrow_forward</span>
                            </button>
                            
                            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">event_repeat</span>
                                    <span>إعادة جدولة مجانية</span>
                                </div>
                                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                                    <span>دفع آمن</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Booking Modal */}
            <CreateBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teacherName="الأستاذ عمر عبدالله"
                teacherSubjects={mockTeacherSubjects}
            />

            {/* Material Symbols Font */}
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        </div>
    );
}
