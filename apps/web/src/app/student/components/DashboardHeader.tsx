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
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 font-tajawal">
                    {greeting} {user?.firstName}
                    <span className="inline-block animate-wave origin-bottom-right px-2">👋</span>
                </h1>
                <p className="text-gray-500 flex items-center gap-2 text-lg">
                    <GraduationCap className="w-5 h-5 text-primary-500" />
                    <span>جاهز تحجز حصتك الجاية؟</span>
                </p>
            </div>

            <div className="text-left md:text-left rtl:text-left ltr:text-right hidden md:block">
                <div className="text-lg font-bold text-gray-700 font-sans">
                    {format(now, 'd MMMM yyyy', { locale: ar })}
                </div>
                <div className="text-sm text-gray-400 font-medium">
                    {format(now, 'EEEE', { locale: ar })}
                </div>
            </div>
        </header>
    );
}
