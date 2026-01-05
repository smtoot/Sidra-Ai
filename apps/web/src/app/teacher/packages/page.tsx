'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { teacherApi } from '@/lib/api/teacher';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { TeacherApprovalGuard } from '@/components/teacher/TeacherApprovalGuard';
import {
    Package, User, Calendar, Clock, CheckCircle, XCircle,
    Timer, BookOpen, ChevronLeft, DollarSign, Eye, Loader2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PACKAGES_PER_PAGE = 10;

interface TeacherPackage {
    id: string;
    readableId?: string;
    studentId: string;
    payerId: string;
    sessionCount: number;
    sessionsUsed: number;
    status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
    purchasedAt: string;
    expiresAt: string;
    discountedPricePerSession: number;
    totalPaid: number;
    payer?: {
        id: string;
        email: string;
        role: string;
        parentProfile?: {
            children: Array<{ id: string; name: string; gradeLevel?: string }>;
        };
    };
    student: {
        id: string;
        email: string;
        phoneNumber?: string;
        studentProfile?: { gradeLevel?: string };
    };
    subject: {
        id: string;
        nameAr: string;
        nameEn: string;
    };
    redemptions?: Array<{
        id: string;
        booking: {
            startTime: string;
            status: string;
            childId?: string;
            child?: { id: string; name: string };
        };
    }>;
}

// Status Badge Component
function StatusBadge({ status }: { status: TeacherPackage['status'] }) {
    const config = {
        ACTIVE: { label: 'نشط', icon: CheckCircle, className: 'bg-success-100 text-success-700' },
        COMPLETED: { label: 'مكتمل', icon: CheckCircle, className: 'bg-blue-100 text-blue-700' },
        EXPIRED: { label: 'منتهي', icon: Timer, className: 'bg-warning-100 text-warning-700' },
        CANCELLED: { label: 'ملغي', icon: XCircle, className: 'bg-red-100 text-red-700' }
    };

    const { label, icon: Icon, className } = config[status] || config.ACTIVE;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
            className
        )}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </span>
    );
}

// Get student/child name from package data
function getStudentName(pkg: TeacherPackage): string {
    // First, try to get child name from redemptions
    if (pkg.redemptions && pkg.redemptions.length > 0) {
        const firstChildName = pkg.redemptions.find(r => r.booking.child?.name)?.booking.child?.name;
        if (firstChildName) return firstChildName;
    }

    // Second, try to get first child from parent's children
    if (pkg.payer?.parentProfile?.children && pkg.payer.parentProfile.children.length > 0) {
        return pkg.payer.parentProfile.children[0].name;
    }

    // Fallback to generic name (PRIVACY: Do not share email)
    return 'طالب';
}

// Package Card Component
function PackageCard({ pkg, onClick }: { pkg: TeacherPackage; onClick: () => void }) {
    // Calculate stats from redemptions
    const allBookings = pkg.redemptions?.map(r => r.booking) || [];
    const completedSessions = allBookings.filter(b => b.status === 'COMPLETED').length;
    const scheduledSessions = allBookings.filter(b =>
        ['SCHEDULED', 'CONFIRMED', 'PENDING_CONFIRMATION'].includes(b.status)
    ).length;

    const sessionsRemaining = pkg.sessionCount - completedSessions;
    const progressPercent = (completedSessions / pkg.sessionCount) * 100;

    const daysUntilExpiry = differenceInDays(new Date(pkg.expiresAt), new Date());
    const isExpiringSoon = pkg.status === 'ACTIVE' && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    const studentName = getStudentName(pkg);

    return (
        <Card
            onClick={onClick}
            className="hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer overflow-hidden"
        >
            <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Student Info */}
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center shrink-0">
                            <User className="w-7 h-7 text-primary-700" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-lg text-gray-800 truncate">{studentName}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <BookOpen className="w-4 h-4 shrink-0" />
                                <span className="truncate">{pkg.subject?.nameAr || 'مادة غير محددة'}</span>
                            </p>
                        </div>
                    </div>

                    {/* Center: Progress */}
                    <div className="hidden md:flex flex-col items-center gap-2 px-6 border-x border-gray-100 min-w-[200px]">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-gray-800">{sessionsRemaining}</span>
                            <span className="text-gray-400">/{pkg.sessionCount}</span>
                        </div>
                        <span className="text-xs text-gray-500 mb-2">حصص متبقية للتدريس</span>

                        <div className="w-full flex gap-2 text-xs">
                            <div className="flex-1 flex flex-col items-center">
                                <span className="font-bold text-blue-600">{completedSessions}</span>
                                <span className="text-[10px] text-gray-400">مكتملة</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                                <span className="font-bold text-success-600">{scheduledSessions}</span>
                                <span className="text-[10px] text-gray-400">مجدولة</span>
                            </div>
                        </div>

                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex mt-1">
                            <div
                                className="h-full bg-blue-500"
                                style={{ width: `${(completedSessions / pkg.sessionCount) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Right: Status & Dates */}
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:block text-left">
                            <div className="text-xs text-gray-400 mb-1">تاريخ الشراء</div>
                            <div className="text-sm font-medium text-gray-700">
                                {format(new Date(pkg.purchasedAt), 'd MMM yyyy', { locale: ar })}
                            </div>
                        </div>

                        {/* Readable ID */}
                        {pkg.readableId && (
                            <div className="hidden lg:block text-left">
                                <div className="text-xs text-gray-400 mb-1">المعرف</div>
                                <div className="text-sm font-mono text-gray-700">#{pkg.readableId}</div>
                            </div>
                        )}

                        {isExpiringSoon && (
                            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-xs font-medium">
                                <Timer className="w-4 h-4" />
                                ينتهي خلال {daysUntilExpiry} أيام
                            </div>
                        )}

                        <StatusBadge status={pkg.status} />

                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Mobile Progress */}
                <div className="md:hidden mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-primary-600">{sessionsRemaining}</span>
                            <span className="text-sm text-gray-400">من {pkg.sessionCount} حصص</span>
                        </div>
                        <div className="flex-1 max-w-32">
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function TeacherPackagesPage() {
    const router = useRouter();
    const { packagesEnabled, isLoading: configLoading } = useSystemConfig();
    const [packages, setPackages] = useState<TeacherPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!configLoading && !packagesEnabled) {
            router.replace('/teacher');
        }
    }, [configLoading, packagesEnabled, router]);

    useEffect(() => {
        const loadPackages = async () => {
            try {
                const data = await teacherApi.getPackages();
                setPackages(data);
            } catch (error) {
                console.error("Failed to load packages", error);
            } finally {
                setLoading(false);
            }
        };
        loadPackages();
    }, []);

    // Combined loading check
    if (configLoading || (!packagesEnabled && !configLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    // Filter packages by status
    const filteredPackages = packages.filter(pkg =>
        statusFilter === 'ALL' || pkg.status === statusFilter
    );

    // Stats
    const activeCount = packages.filter(p => p.status === 'ACTIVE').length;
    const completedCount = packages.filter(p => p.status === 'COMPLETED').length;
    const totalRemainingSessions = packages
        .filter(p => p.status === 'ACTIVE')
        .reduce((sum, p) => {
            const allBookings = p.redemptions?.map(r => r.booking) || [];
            const completed = allBookings.filter(b => b.status === 'COMPLETED').length;
            return sum + Math.max(0, p.sessionCount - completed);
        }, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-8" dir="rtl">
                <div className="max-w-6xl mx-auto">
                    <Card className="border-none shadow-md">
                        <CardContent className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                            <p className="text-gray-500">جاري التحميل...</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <TeacherApprovalGuard>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-8" dir="rtl">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <header className="mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 flex items-center gap-3">
                            باقات الدروس
                        </h1>
                        <p className="text-gray-600 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            <span>متابعة الباقات المشتراة وحصص الطلاب</span>
                        </p>
                    </header>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Active Packages */}
                        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-lg">
                                        <Package className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 mb-1">باقات نشطة</div>
                                <div className="text-3xl font-bold text-gray-900">{activeCount}</div>
                            </CardContent>
                        </Card>

                        {/* Completed Packages */}
                        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 shadow-lg">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 mb-1">باقات مكتملة</div>
                                <div className="text-3xl font-bold text-gray-900">{completedCount}</div>
                            </CardContent>
                        </Card>

                        {/* Remaining Sessions */}
                        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 mb-1">حصص متبقية</div>
                                <div className="text-3xl font-bold text-gray-900">{totalRemainingSessions}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filter Tabs */}
                    <Card className="border-none shadow-md">
                        <CardContent className="p-4">
                            <div className="flex gap-2 overflow-x-auto">
                                {[
                                    { key: 'ALL', label: 'الكل', count: packages.length },
                                    { key: 'ACTIVE', label: 'نشط', count: activeCount },
                                    { key: 'COMPLETED', label: 'مكتمل', count: completedCount },
                                    { key: 'EXPIRED', label: 'منتهي', count: packages.filter(p => p.status === 'EXPIRED').length }
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => {
                                            setStatusFilter(tab.key);
                                            setCurrentPage(1); // Reset to page 1
                                        }}
                                        className={cn(
                                            "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2",
                                            statusFilter === tab.key
                                                ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg"
                                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm"
                                        )}
                                    >
                                        {tab.label}
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-xs font-bold",
                                            statusFilter === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                                        )}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Packages List */}
                    {filteredPackages.length === 0 ? (
                        <Card className="border-2 border-dashed border-gray-200">
                            <CardContent className="p-12 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {statusFilter === 'ALL' ? 'لا توجد باقات' : `لا توجد باقات ${statusFilter === 'ACTIVE' ? 'نشطة' : statusFilter === 'COMPLETED' ? 'مكتملة' : 'منتهية'}`}
                                </h3>
                                <p className="text-gray-500">
                                    عندما يشتري الطلاب باقات حصص معك، ستظهر هنا.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {(() => {
                                    // Pagination logic
                                    const startIndex = (currentPage - 1) * PACKAGES_PER_PAGE;
                                    const endIndex = startIndex + PACKAGES_PER_PAGE;
                                    const paginatedPackages = filteredPackages.slice(startIndex, endIndex);

                                    return paginatedPackages.map(pkg => (
                                        <PackageCard
                                            key={pkg.id}
                                            pkg={pkg}
                                            onClick={() => router.push(`/teacher/packages/${pkg.id}`)}
                                        />
                                    ));
                                })()}
                            </div>

                            {/* Pagination */}
                            {filteredPackages.length > PACKAGES_PER_PAGE && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(filteredPackages.length / PACKAGES_PER_PAGE)}
                                    onPageChange={(page) => {
                                        setCurrentPage(page);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="mt-6"
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </TeacherApprovalGuard>
    );
}
