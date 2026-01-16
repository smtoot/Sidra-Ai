import { useAuth } from '@/context/AuthContext';
import { GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function DashboardHeader() {
    const { user } = useAuth();
    const now = new Date();
    const hours = now.getHours();

    let greeting = 'مرحباً،';
    if (hours < 12) greeting = 'صباح الخير،';
    else if (hours < 17) greeting = 'مساء الخير،';
    else greeting = 'مرحباً،';

    return (
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-6 mb-3 md:mb-8">
            <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5 md:hidden">لوحة الطالب</p>
                <h1 className="text-lg md:text-3xl font-semibold text-gray-700 md:text-gray-900 mb-1 md:mb-2 font-tajawal">
                    {greeting} {user?.firstName}
                    <span className="inline-block text-sm md:text-2xl px-1 md:animate-wave">👋</span>
                </h1>
                <p className="text-gray-800 md:text-gray-500 flex items-center gap-1.5 md:gap-2 text-sm md:text-lg font-medium md:font-normal">
                    <GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-primary-500" />
                    <span>جاهز تحجز حصتك الجاية؟</span>
                </p>
            </div>

            <div className="hidden md:flex items-center gap-2 md:block text-right md:text-left rtl:text-left ltr:text-right">
                <div className="text-sm md:text-lg font-bold text-gray-700 font-sans">
                    {format(now, 'd MMMM yyyy', { locale: ar })}
                </div>
                <span className="text-gray-300 md:hidden">•</span>
                <div className="text-sm text-gray-400 font-medium">
                    {format(now, 'EEEE', { locale: ar })}
                </div>
            </div>
        </header>
    );
}
