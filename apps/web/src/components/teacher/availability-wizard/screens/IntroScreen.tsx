'use client';

import { Button } from '@/components/ui/button';
import { Calendar, Clock, ShieldCheck, ChevronLeft } from 'lucide-react';

type IntroScreenProps = {
    onNext: () => void;
};

export default function IntroScreen({ onNext }: IntroScreenProps) {
    return (
        <div className="flex flex-col h-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-10 h-10 text-primary/40" />
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl font-bold text-primary leading-tight">تحكّم في وقتك… بطريقتك</h2>
                    <div className="space-y-1">
                        <p className="text-xl text-text-subtle">هنا بتحدد الأوقات اللي تناسبك للتدريس بكل سهولة.</p>
                        <p className="text-xl text-text-subtle">تقدر تفتح أو تقفل وقتك حسب ظروفك، في أي وقت.</p>
                    </div>
                </div>

                <div className="flex flex-col items-start space-y-3 bg-surface/50 p-8 rounded-3xl border border-gray-50 text-right w-full">
                    <div className="flex items-center gap-3 text-lg text-primary/80">
                        <span className="w-2 h-2 rounded-full bg-primary/30" />
                        <p>انت صاحب القرار في أوقاتك</p>
                    </div>
                    <div className="flex items-center gap-3 text-lg text-primary/80">
                        <span className="w-2 h-2 rounded-full bg-primary/30" />
                        <p>التعديل سهل وما بياخد وقت</p>
                    </div>
                    <div className="flex items-center gap-3 text-lg text-primary/80">
                        <span className="w-2 h-2 rounded-full bg-primary/30" />
                        <p>ما في التزامات معقّدة</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 pt-8 border-t border-gray-100">
                <Button
                    onClick={onNext}
                    size="lg"
                    className="h-16 px-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all hover:-translate-y-0.5"
                >
                    ابدأ تحديد وقتك
                </Button>
                <p className="text-sm text-text-subtle font-medium">يستغرق أقل من دقيقتين</p>
            </div>
        </div>
    );
}
