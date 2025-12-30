'use client';

import { PublicNavbar, Footer } from '@/components/public';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Heart, Sparkles, BookOpen, GraduationCap } from 'lucide-react';

export default function AboutPage() {
    const stats = [
        { label: 'طالب نشط', value: '+5,000', icon: Users },
        { label: 'معلم معتمد', value: '+200', icon: GraduationCap },
        { label: 'حصة تعليمية', value: '+15,000', icon: BookOpen },
        { label: 'نسبة رضا', value: '%98', icon: Heart },
    ];

    const values = [
        {
            title: 'الجودة والتميز',
            description: 'نلتزم بتقديم أعلى معايير الجودة في التعليم من خلال اختيار نخبة المعلمين.',
            icon: Sparkles,
            color: 'bg-purple-100 text-purple-600',
        },
        {
            title: 'التعلم للجميع',
            description: 'نؤمن بأن التعليم حق للجميع، ونسعى لتوفير فرص تعليمية بأسعار تنافسية.',
            icon: Users,
            color: 'bg-blue-100 text-blue-600',
        },
        {
            title: 'الابتكار',
            description: 'نستخدم أحدث التقنيات لتسهيل عملية التعلم وجعلها أكثر متعة وفاعلية.',
            icon: Target,
            color: 'bg-green-100 text-green-600',
        },
    ];

    return (
        <div className="min-h-screen bg-white font-tajawal rtl flex flex-col">
            <PublicNavbar />

            <main className="flex-grow">
                {/* Hero Section */}
                <div className="relative bg-primary-900 text-white py-20 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <Badge variant="secondary" className="mb-4 px-4 py-1 text-primary-700 bg-white/10 text-white border-none hover:bg-white/20">
                            من نحن
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            بوابة المستقبل للتعليم <span className="text-secondary-400">المتطور</span>
                        </h1>
                        <p className="text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
                            سدرة هي منصة تعليمية رائدة تهدف إلى ربط الطلاب بأفضل المعلمين المؤهلين لتقديم تجربة تعليمية مخصصة ومبتكرة.
                        </p>
                    </div>
                </div>

                {/* Mission & Vision */}
                <div className="py-20 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 text-primary-600 font-bold bg-primary-50 px-3 py-1 rounded-full text-sm">
                                    <Target className="w-4 h-4" />
                                    رؤيتنا ورسالتنا
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">نصنع مستقبلاً تعليمياً أفضل</h2>
                                <div className="space-y-4 text-gray-600 leading-relaxed">
                                    <p>
                                        انطلقت سدرة من رؤية طموحة تهدف إلى سد الفجوة بين التعليم التقليدي ومتطلبات العصر الرقمي. نحن نؤمن بأن كل طالب يستحق فرصة للتعلم بطريقته الخاصة وبالسرعة التي تناسبه.
                                    </p>
                                    <p>
                                        مهمتنا هي تمكين الطلاب والمعلمين من خلال توفير بيئة تعليمية آمنة، تفاعلية، وسهلة الاستخدام، تضمن تحقيق أفضل النتائج الأكاديمية.
                                    </p>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4 transform translate-y-8">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="w-12 h-12 bg-blue-100 rounded-xl mb-4 flex items-center justify-center text-blue-600">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-bold text-lg mb-2">مجتمع تعليمي</h3>
                                            <p className="text-sm text-gray-500">بيئة داعمة للطلاب والمعلمين</p>
                                        </div>
                                        <div className="bg-primary-600 text-white p-6 rounded-2xl shadow-lg">
                                            <div className="w-12 h-12 bg-white/20 rounded-xl mb-4 flex items-center justify-center">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-bold text-lg mb-2">تعليم ذكي</h3>
                                            <p className="text-sm text-white/80">أدوات متطورة للتعلم عن بعد</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="bg-secondary-50 p-6 rounded-2xl shadow-sm border border-secondary-100">
                                            <div className="w-12 h-12 bg-secondary-100 rounded-xl mb-4 flex items-center justify-center text-secondary-600">
                                                <GraduationCap className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-bold text-lg mb-2">معلمون خبراء</h3>
                                            <p className="text-sm text-gray-600">نخبة من أفضل الكفاءات</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="w-12 h-12 bg-purple-100 rounded-xl mb-4 flex items-center justify-center text-purple-600">
                                                <Heart className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-bold text-lg mb-2">نهتم بكم</h3>
                                            <p className="text-sm text-gray-500">فريق دعم متواجد دائماً</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="py-16 bg-white border-y border-gray-100">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {stats.map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="w-16 h-16 mx-auto bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mb-4 transition-transform hover:scale-110 duration-300">
                                        <stat.icon className="w-8 h-8" />
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                                    <div className="text-gray-500 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Values */}
                <div className="py-20 bg-gray-50">
                    <div className="container mx-auto px-4 text-center">
                        <div className="max-w-2xl mx-auto mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">قيمنا الجوهرية</h2>
                            <p className="text-gray-600">المبادئ التي تقودنا في رحلتنا لتقديم أفضل تجربة تعليمية</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {values.map((val, i) => (
                                <Card key={i} className="border-none shadow-md hover:shadow-xl transition-shadow duration-300">
                                    <CardContent className="p-8 text-center">
                                        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 ${val.color}`}>
                                            <val.icon className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{val.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{val.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
