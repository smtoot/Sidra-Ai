'use client';

import { useState, useEffect } from 'react';
import { packageApi, StudentPackage } from '@/lib/api/package';
import { Package, Clock, CalendarDays, User, BookOpen, ChevronLeft, AlertCircle, CheckCircle, XCircle, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { ar } from 'date-fns/locale';

// =====================================================
// STATUS BADGE COMPONENT
// =====================================================

function StatusBadge({ status }: { status: StudentPackage['status'] }) {
    const config = {
        ACTIVE: {
            label: 'نشط',
            icon: CheckCircle,
            className: 'bg-green-100 text-green-700 border-green-200'
        },
        COMPLETED: {
            label: 'مكتمل',
            icon: CheckCircle,
            className: 'bg-blue-100 text-blue-700 border-blue-200'
        },
        EXPIRED: {
            label: 'منتهي',
            icon: Timer,
            className: 'bg-orange-100 text-orange-700 border-orange-200'
        },
        CANCELLED: {
            label: 'ملغي',
            icon: XCircle,
            className: 'bg-red-100 text-red-700 border-red-200'
        }
    };

    const { label, icon: Icon, className } = config[status] || config.ACTIVE;

    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
            className
        )}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

// =====================================================
// PACKAGE CARD COMPONENT
// =====================================================

interface PackageCardProps {
    pkg: StudentPackage;
    onBook: (pkg: StudentPackage) => void;
}

function PackageCard({ pkg, onBook }: PackageCardProps) {
    // Calculate stats from redemptions
    const completedSessions = pkg.redemptions?.filter(r => r.booking.status === 'COMPLETED').length || 0;

    // Remaining based on Completed only
    const sessionsRemaining = pkg.sessionCount - completedSessions;
    const progressPercent = (completedSessions / pkg.sessionCount) * 100;

    const daysUntilExpiry = differenceInDays(new Date(pkg.expiresAt), new Date());
    const isActive = pkg.status === 'ACTIVE' && sessionsRemaining > 0;
    const isExpiringSoon = isActive && daysUntilExpiry <= 7;

    return (
        <div className={cn(
            "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md",
            pkg.status === 'ACTIVE' ? "border-green-200" : "border-gray-200"
        )}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {/* Teacher Avatar Placeholder */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">
                                {pkg.teacher?.displayName || 'معلم'}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                <span className="truncate">{pkg.subject?.nameAr || 'مادة'}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={pkg.status} />
                        {pkg.readableId && (
                            <span className="text-[10px] text-gray-400 font-mono px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100" dir="ltr">
                                #{pkg.readableId}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Sessions Progress */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">التقدم (مكتملة)</span>
                    <span className="font-bold text-gray-800">
                        {completedSessions} / {pkg.sessionCount}
                    </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all",
                            pkg.status === 'COMPLETED' ? "bg-blue-500" :
                                pkg.status === 'CANCELLED' || pkg.status === 'EXPIRED' ? "bg-gray-400" :
                                    "bg-blue-500"
                        )}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{completedSessions} مكتملة</span>
                    <span className={cn(
                        "font-medium",
                        sessionsRemaining > 0 && pkg.status === 'ACTIVE' ? "text-green-600" : "text-gray-400"
                    )}>
                        {sessionsRemaining} متبقية
                    </span>
                </div>
            </div>

            {/* Expiry Warning */}
            {isExpiringSoon && (
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs text-amber-700">
                            تنتهي خلال {daysUntilExpiry} {daysUntilExpiry === 1 ? 'يوم' : 'أيام'}
                        </span>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    {/* Expiry Date */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <CalendarDays className="w-3 h-3" />
                        <span>
                            {pkg.status === 'ACTIVE' ? 'تنتهي ' : 'انتهت '}
                            {format(new Date(pkg.expiresAt), 'd MMM yyyy', { locale: ar })}
                        </span>
                    </div>

                    {/* Book Button */}
                    {isActive ? (
                        <button
                            onClick={() => onBook(pkg)}
                            className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            جدول حصة
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    ) : (
                        <span className="text-xs text-gray-400">
                            {pkg.status === 'COMPLETED' && 'تم استخدام كل الحصص'}
                            {pkg.status === 'EXPIRED' && 'انتهت صلاحية الباقة'}
                            {pkg.status === 'CANCELLED' && 'تم إلغاء الباقة'}
                            {pkg.status === 'ACTIVE' && sessionsRemaining === 0 && 'لا توجد حصص متبقية'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

interface MyPackagesProps {
    userRole: 'STUDENT' | 'PARENT';
}

export function MyPackages({ userRole }: MyPackagesProps) {
    const router = useRouter();
    const [packages, setPackages] = useState<StudentPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'>('ALL');

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const data = await packageApi.getMyPackages();
            setPackages(data);
        } catch (err) {
            console.error('Failed to load packages', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = (pkg: StudentPackage) => {
        // Navigate to package details page
        const basePath = userRole === 'PARENT' ? '/parent' : '/student';
        router.push(`${basePath}/packages/${pkg.id}`);
    };

    const filteredPackages = packages.filter(pkg => {
        if (filter === 'ALL') return true;
        return pkg.status === filter;
    });

    const activeCount = packages.filter(p => p.status === 'ACTIVE').length;
    const completedCount = packages.filter(p => p.status === 'COMPLETED').length;
    const expiredCount = packages.filter(p => p.status === 'EXPIRED' || p.status === 'CANCELLED').length;

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl border p-6 animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full" />
                            <div className="space-y-2">
                                <div className="w-32 h-4 bg-gray-200 rounded" />
                                <div className="w-24 h-3 bg-gray-100 rounded" />
                            </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">باقاتي</h1>
                        <p className="text-sm text-gray-500">{packages.length} باقات</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: 'ALL', label: 'الكل', count: packages.length },
                    { key: 'ACTIVE', label: 'نشطة', count: activeCount },
                    { key: 'COMPLETED', label: 'مكتملة', count: completedCount },
                    { key: 'EXPIRED', label: 'منتهية', count: expiredCount },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as any)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            filter === tab.key
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Package List */}
            {filteredPackages.length === 0 ? (
                <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                        {filter === 'ALL' ? 'لا توجد باقات' : `لا توجد باقات ${filter === 'ACTIVE' ? 'نشطة' : filter === 'COMPLETED' ? 'مكتملة' : 'منتهية'}`}
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                        يمكنك شراء باقات حصص من صفحة المعلم للحصول على خصومات
                    </p>
                    <button
                        onClick={() => router.push('/marketplace')}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                        تصفح المعلمين
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPackages.map(pkg => (
                        <PackageCard
                            key={pkg.id}
                            pkg={pkg}
                            onBook={handleBook}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
