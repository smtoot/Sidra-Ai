'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    TrendingUp, TrendingDown, DollarSign, Users, Calendar, BookOpen,
    ArrowUpRight, ArrowDownRight, Loader2, BarChart3, PieChart, Download,
    GraduationCap, UserCheck, UsersRound, Filter, X, ChevronDown, FileSpreadsheet
} from 'lucide-react';

// =================== TYPES ===================

interface FilterOptions {
    curricula: Array<{ id: string; nameAr: string; nameEn: string }>;
    subjects: Array<{ id: string; nameAr: string; nameEn: string }>;
    grades: Array<{ id: string; nameAr: string; fullName: string }>;
    cities: string[];
    countries: string[];
    applicationStatuses: Array<{ value: string; label: string }>;
    bookingStatuses: Array<{ value: string; label: string }>;
}

interface BreakdownItem {
    name: string;
    count: number;
    percentage?: string;
    revenue?: number;
}

interface StudentAnalytics {
    summary: {
        totalStudents: number;
        activeStudents: number;
        withBookings: number;
        withPackages: number;
        totalBookings: number;
        totalPackages: number;
    };
    breakdown: {
        byCurriculum: BreakdownItem[];
        byGradeLevel: BreakdownItem[];
        byCity: BreakdownItem[];
        byCountry: BreakdownItem[];
    };
}

interface TeacherAnalytics {
    summary: {
        totalTeachers: number;
        approvedTeachers: number;
        pendingTeachers: number;
        withBookings: number;
        onVacation: number;
        totalBookings: number;
        averageRating: string;
        averageExperience: string;
    };
    breakdown: {
        byStatus: BreakdownItem[];
        bySubject: BreakdownItem[];
        byCurriculum: BreakdownItem[];
        byCity: BreakdownItem[];
        byCountry: BreakdownItem[];
    };
}

interface BookingAnalytics {
    summary: {
        totalBookings: number;
        completedBookings: number;
        cancelledBookings: number;
        pendingBookings: number;
        disputedBookings: number;
        totalRevenue: number;
        averagePrice: number;
        withRating: number;
        withHomework: number;
        averageRating: string;
    };
    breakdown: {
        bySubject: BreakdownItem[];
        byStatus: BreakdownItem[];
        byTeacher: BreakdownItem[];
        timeSeries: Array<{ label: string; count: number; revenue: number }>;
    };
}

interface ParentAnalytics {
    summary: {
        totalParents: number;
        activeParents: number;
        withBookings: number;
        withPackages: number;
        totalChildren: number;
        totalBookings: number;
        totalPackages: number;
        averageChildrenPerParent: string;
    };
    breakdown: {
        byCity: BreakdownItem[];
        byCountry: BreakdownItem[];
        byChildrenCount: Array<{ count: number; parents: number }>;
        byChildrenCurriculum: BreakdownItem[];
    };
}

type AnalyticsTab = 'students' | 'teachers' | 'bookings' | 'parents';

// =================== COMPONENTS ===================

function StatCard({ title, value, subtitle, icon: Icon, color = 'gray', trend }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: 'gray' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
    trend?: number;
}) {
    const colorClasses = {
        gray: 'bg-gray-50 border-gray-100 text-gray-700',
        blue: 'bg-blue-50 border-blue-100 text-blue-700',
        green: 'bg-green-50 border-green-100 text-green-700',
        purple: 'bg-purple-50 border-purple-100 text-purple-700',
        orange: 'bg-orange-50 border-orange-100 text-orange-700',
        red: 'bg-red-50 border-red-100 text-red-700',
        yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700',
    };

    return (
        <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm">{title}</span>
                <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold font-mono">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {subtitle && <div className="text-sm mt-1 opacity-80">{subtitle}</div>}
            {trend !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
    );
}

function BreakdownChart({ data, title, showPercentage = true }: {
    data: BreakdownItem[];
    title: string;
    showPercentage?: boolean;
}) {
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="space-y-3">
            <h4 className="font-medium text-gray-900">{title}</h4>
            <div className="space-y-2">
                {data.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="w-24 text-sm text-gray-600 truncate" title={item.name}>
                            {item.name}
                        </div>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary/70 rounded-full transition-all duration-500"
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                            />
                        </div>
                        <div className="w-16 text-sm font-mono text-gray-700 text-left">
                            {item.count.toLocaleString()}
                        </div>
                        {showPercentage && item.percentage && (
                            <div className="w-12 text-xs text-gray-500 text-left">
                                ({item.percentage}%)
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function FilterPanel({
    filterOptions,
    filters,
    setFilters,
    onApply,
    onClear,
    activeTab
}: {
    filterOptions: FilterOptions | null;
    filters: Record<string, any>;
    setFilters: (filters: Record<string, any>) => void;
    onApply: () => void;
    onClear: () => void;
    activeTab: AnalyticsTab;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== undefined);

    return (
        <div className="relative">
            <Button
                variant={hasActiveFilters ? "default" : "outline"}
                onClick={() => setIsOpen(!isOpen)}
                className="gap-2"
            >
                <Filter className="w-4 h-4" />
                فلترة البيانات
                {hasActiveFilters && (
                    <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-xs">
                        {Object.values(filters).filter(v => v !== '' && v !== undefined).length}
                    </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-[500px] bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">خيارات الفلترة</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                        {/* Common Filters */}
                        {filterOptions?.curricula && (activeTab === 'students' || activeTab === 'teachers' || activeTab === 'bookings') && (
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">المنهج</label>
                                <select
                                    value={filters.curriculumId || ''}
                                    onChange={(e) => setFilters({ ...filters, curriculumId: e.target.value })}
                                    className="w-full p-2 border rounded-lg text-sm"
                                >
                                    <option value="">الكل</option>
                                    {filterOptions.curricula.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nameAr}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {filterOptions?.subjects && (activeTab === 'teachers' || activeTab === 'bookings') && (
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">المادة</label>
                                <select
                                    value={filters.subjectId || ''}
                                    onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
                                    className="w-full p-2 border rounded-lg text-sm"
                                >
                                    <option value="">الكل</option>
                                    {filterOptions.subjects.map((s) => (
                                        <option key={s.id} value={s.id}>{s.nameAr}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {filterOptions?.cities && (
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">المدينة</label>
                                <select
                                    value={filters.city || ''}
                                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                                    className="w-full p-2 border rounded-lg text-sm"
                                >
                                    <option value="">الكل</option>
                                    {filterOptions.cities.map((city) => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {filterOptions?.countries && (
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">الدولة</label>
                                <select
                                    value={filters.country || ''}
                                    onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                                    className="w-full p-2 border rounded-lg text-sm"
                                >
                                    <option value="">الكل</option>
                                    {filterOptions.countries.map((country) => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Student-specific filters */}
                        {activeTab === 'students' && (
                            <>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">الصف الدراسي</label>
                                    <Input
                                        placeholder="مثال: الصف الأول"
                                        value={filters.gradeLevel || ''}
                                        onChange={(e) => setFilters({ ...filters, gradeLevel: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">المدرسة</label>
                                    <Input
                                        placeholder="اسم المدرسة"
                                        value={filters.schoolName || ''}
                                        onChange={(e) => setFilters({ ...filters, schoolName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">لديه حجوزات</label>
                                    <select
                                        value={filters.hasBookings ?? ''}
                                        onChange={(e) => setFilters({ ...filters, hasBookings: e.target.value === '' ? undefined : e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    >
                                        <option value="">الكل</option>
                                        <option value="true">نعم</option>
                                        <option value="false">لا</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Teacher-specific filters */}
                        {activeTab === 'teachers' && filterOptions?.applicationStatuses && (
                            <>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">حالة الطلب</label>
                                    <select
                                        value={filters.applicationStatus || ''}
                                        onChange={(e) => setFilters({ ...filters, applicationStatus: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    >
                                        <option value="">الكل</option>
                                        {filterOptions.applicationStatuses.map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">الحد الأدنى للتقييم</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.5"
                                        placeholder="0-5"
                                        value={filters.minRating || ''}
                                        onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">الحد الأدنى للخبرة (سنوات)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="سنوات الخبرة"
                                        value={filters.minExperience || ''}
                                        onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">في إجازة</label>
                                    <select
                                        value={filters.isOnVacation ?? ''}
                                        onChange={(e) => setFilters({ ...filters, isOnVacation: e.target.value === '' ? undefined : e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    >
                                        <option value="">الكل</option>
                                        <option value="true">نعم</option>
                                        <option value="false">لا</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Booking-specific filters */}
                        {activeTab === 'bookings' && filterOptions?.bookingStatuses && (
                            <>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">حالة الحجز</label>
                                    <select
                                        value={filters.status || ''}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    >
                                        <option value="">الكل</option>
                                        {filterOptions.bookingStatuses.map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">الحد الأدنى للسعر</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="SDG"
                                        value={filters.minPrice || ''}
                                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">الحد الأقصى للسعر</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="SDG"
                                        value={filters.maxPrice || ''}
                                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">تجميع حسب</label>
                                    <select
                                        value={filters.groupBy || ''}
                                        onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    >
                                        <option value="">بدون تجميع</option>
                                        <option value="day">يومي</option>
                                        <option value="week">أسبوعي</option>
                                        <option value="month">شهري</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Parent-specific filters */}
                        {activeTab === 'parents' && (
                            <>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">الحد الأدنى لعدد الأطفال</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="عدد الأطفال"
                                        value={filters.minChildren || ''}
                                        onChange={(e) => setFilters({ ...filters, minChildren: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">لديه حجوزات</label>
                                    <select
                                        value={filters.hasBookings ?? ''}
                                        onChange={(e) => setFilters({ ...filters, hasBookings: e.target.value === '' ? undefined : e.target.value })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    >
                                        <option value="">الكل</option>
                                        <option value="true">نعم</option>
                                        <option value="false">لا</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Date Range */}
                        <div>
                            <label className="text-sm text-gray-600 mb-1 block">من تاريخ</label>
                            <Input
                                type="date"
                                value={filters.dateFrom || ''}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 mb-1 block">إلى تاريخ</label>
                            <Input
                                type="date"
                                value={filters.dateTo || ''}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                        <Button variant="outline" onClick={onClear}>
                            مسح الفلاتر
                        </Button>
                        <Button onClick={() => { onApply(); setIsOpen(false); }}>
                            تطبيق
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// =================== MAIN PAGE ===================

export default function AdminAdvancedAnalyticsPage() {
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('students');
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Filter options
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [filters, setFilters] = useState<Record<string, any>>({});

    // Analytics data
    const [studentData, setStudentData] = useState<StudentAnalytics | null>(null);
    const [teacherData, setTeacherData] = useState<TeacherAnalytics | null>(null);
    const [bookingData, setBookingData] = useState<BookingAnalytics | null>(null);
    const [parentData, setParentData] = useState<ParentAnalytics | null>(null);

    // Load filter options on mount
    useEffect(() => {
        loadFilterOptions();
    }, []);

    // Load data when tab or filters change
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadFilterOptions = async () => {
        try {
            const options = await adminApi.getAnalyticsFilterOptions();
            setFilterOptions(options);
        } catch (error) {
            console.error('Failed to load filter options:', error);
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'students':
                    const students = await adminApi.getStudentAnalytics(filters);
                    setStudentData(students);
                    break;
                case 'teachers':
                    const teachers = await adminApi.getTeacherAnalytics(filters);
                    setTeacherData(teachers);
                    break;
                case 'bookings':
                    const bookings = await adminApi.getBookingAnalytics(filters);
                    setBookingData(bookings);
                    break;
                case 'parents':
                    const parents = await adminApi.getParentAnalytics(filters);
                    setParentData(parents);
                    break;
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, filters]);

    const handleApplyFilters = () => {
        loadData();
    };

    const handleClearFilters = () => {
        setFilters({});
        loadData();
    };

    const handleExport = async (format: 'csv' | 'json') => {
        setExporting(true);
        try {
            const result = await adminApi.exportAnalytics(activeTab, format, filters);

            if (format === 'csv' && result.csv) {
                // Download CSV file
                const blob = new Blob(['\ufeff' + result.csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename || `${activeTab}-export.csv`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // Download JSON file
                const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${activeTab}-export-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Failed to export:', error);
            alert('فشل التصدير');
        } finally {
            setExporting(false);
        }
    };

    const tabs = [
        { id: 'students' as const, label: 'الطلاب', icon: GraduationCap },
        { id: 'teachers' as const, label: 'المعلمون', icon: UserCheck },
        { id: 'bookings' as const, label: 'الحجوزات', icon: Calendar },
        { id: 'parents' as const, label: 'أولياء الأمور', icon: UsersRound },
    ];

    return (
        <div className="min-h-screen bg-background font-sans rtl p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6" />
                            التحليلات المتقدمة
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">تحليل شامل للبيانات مع إمكانية الفلترة والتصدير</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <FilterPanel
                            filterOptions={filterOptions}
                            filters={filters}
                            setFilters={setFilters}
                            onApply={handleApplyFilters}
                            onClear={handleClearFilters}
                            activeTab={activeTab}
                        />
                        <Button variant="outline" onClick={() => handleExport('csv')} disabled={exporting} className="gap-2">
                            <FileSpreadsheet className="w-4 h-4" />
                            {exporting ? 'جاري التصدير...' : 'CSV'}
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('json')} disabled={exporting} className="gap-2">
                            <Download className="w-4 h-4" />
                            {exporting ? 'جاري التصدير...' : 'JSON'}
                        </Button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-lg overflow-x-auto w-full text-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setFilters({}); }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-md whitespace-nowrap transition-colors flex-1 justify-center ${
                                activeTab === tab.id
                                    ? 'bg-white text-primary shadow-sm font-medium'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="py-20 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Students Analytics */}
                        {activeTab === 'students' && studentData && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <StatCard
                                        title="إجمالي الطلاب"
                                        value={studentData.summary.totalStudents}
                                        icon={GraduationCap}
                                        color="blue"
                                    />
                                    <StatCard
                                        title="طلاب نشطون"
                                        value={studentData.summary.activeStudents}
                                        icon={UserCheck}
                                        color="green"
                                    />
                                    <StatCard
                                        title="لديهم حجوزات"
                                        value={studentData.summary.withBookings}
                                        icon={Calendar}
                                        color="purple"
                                    />
                                    <StatCard
                                        title="لديهم باقات"
                                        value={studentData.summary.withPackages}
                                        icon={BookOpen}
                                        color="orange"
                                    />
                                    <StatCard
                                        title="إجمالي الحجوزات"
                                        value={studentData.summary.totalBookings}
                                        icon={Calendar}
                                        color="gray"
                                    />
                                    <StatCard
                                        title="إجمالي الباقات"
                                        value={studentData.summary.totalPackages}
                                        icon={BookOpen}
                                        color="gray"
                                    />
                                </div>

                                {/* Breakdowns */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع الطلاب حسب المنهج</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={studentData.breakdown.byCurriculum} title="" />
                                        </div>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع الطلاب حسب الصف</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={studentData.breakdown.byGradeLevel} title="" />
                                        </div>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع الطلاب حسب المدينة</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={studentData.breakdown.byCity} title="" />
                                        </div>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع الطلاب حسب الدولة</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={studentData.breakdown.byCountry} title="" />
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* Teachers Analytics */}
                        {activeTab === 'teachers' && teacherData && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                                    <StatCard
                                        title="إجمالي المعلمين"
                                        value={teacherData.summary.totalTeachers}
                                        icon={Users}
                                        color="blue"
                                    />
                                    <StatCard
                                        title="معتمدون"
                                        value={teacherData.summary.approvedTeachers}
                                        icon={UserCheck}
                                        color="green"
                                    />
                                    <StatCard
                                        title="قيد المراجعة"
                                        value={teacherData.summary.pendingTeachers}
                                        icon={Users}
                                        color="yellow"
                                    />
                                    <StatCard
                                        title="لديهم حجوزات"
                                        value={teacherData.summary.withBookings}
                                        icon={Calendar}
                                        color="purple"
                                    />
                                    <StatCard
                                        title="في إجازة"
                                        value={teacherData.summary.onVacation}
                                        icon={Users}
                                        color="orange"
                                    />
                                    <StatCard
                                        title="إجمالي الحجوزات"
                                        value={teacherData.summary.totalBookings}
                                        icon={Calendar}
                                        color="gray"
                                    />
                                    <StatCard
                                        title="متوسط التقييم"
                                        value={teacherData.summary.averageRating}
                                        icon={TrendingUp}
                                        color="green"
                                    />
                                    <StatCard
                                        title="متوسط الخبرة"
                                        value={`${teacherData.summary.averageExperience} سنة`}
                                        icon={TrendingUp}
                                        color="blue"
                                    />
                                </div>

                                {/* Breakdowns */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع المعلمين حسب الحالة</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={teacherData.breakdown.byStatus} title="" />
                                        </div>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع المعلمين حسب المادة</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={teacherData.breakdown.bySubject} title="" showPercentage={false} />
                                        </div>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع المعلمين حسب المنهج</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={teacherData.breakdown.byCurriculum} title="" showPercentage={false} />
                                        </div>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع المعلمين حسب المدينة</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={teacherData.breakdown.byCity} title="" />
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* Bookings Analytics */}
                        {activeTab === 'bookings' && bookingData && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <StatCard
                                        title="إجمالي الحجوزات"
                                        value={bookingData.summary.totalBookings}
                                        icon={Calendar}
                                        color="blue"
                                    />
                                    <StatCard
                                        title="مكتملة"
                                        value={bookingData.summary.completedBookings}
                                        icon={UserCheck}
                                        color="green"
                                    />
                                    <StatCard
                                        title="ملغاة"
                                        value={bookingData.summary.cancelledBookings}
                                        icon={X}
                                        color="red"
                                    />
                                    <StatCard
                                        title="إجمالي الإيرادات"
                                        value={`${bookingData.summary.totalRevenue.toLocaleString()} SDG`}
                                        icon={DollarSign}
                                        color="green"
                                    />
                                    <StatCard
                                        title="متوسط السعر"
                                        value={`${bookingData.summary.averagePrice.toLocaleString()} SDG`}
                                        icon={DollarSign}
                                        color="orange"
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <StatCard
                                        title="قيد الانتظار"
                                        value={bookingData.summary.pendingBookings}
                                        icon={Calendar}
                                        color="yellow"
                                    />
                                    <StatCard
                                        title="متنازع عليها"
                                        value={bookingData.summary.disputedBookings}
                                        icon={Calendar}
                                        color="red"
                                    />
                                    <StatCard
                                        title="لديها تقييم"
                                        value={bookingData.summary.withRating}
                                        icon={TrendingUp}
                                        color="purple"
                                    />
                                    <StatCard
                                        title="متوسط التقييم"
                                        value={bookingData.summary.averageRating}
                                        icon={TrendingUp}
                                        color="green"
                                    />
                                </div>

                                {/* Breakdowns */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع الحجوزات حسب المادة</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={bookingData.breakdown.bySubject} title="" />
                                        </div>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع الحجوزات حسب الحالة</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={bookingData.breakdown.byStatus} title="" />
                                        </div>
                                    </Card>
                                    <Card className="lg:col-span-2">
                                        <CardHeader>
                                            <CardTitle>أفضل المعلمين (حسب عدد الحجوزات)</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={bookingData.breakdown.byTeacher} title="" showPercentage={false} />
                                        </div>
                                    </Card>
                                </div>

                                {/* Time Series */}
                                {bookingData.breakdown.timeSeries && bookingData.breakdown.timeSeries.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>الحجوزات عبر الزمن</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <div className="space-y-2">
                                                {bookingData.breakdown.timeSeries.map((item, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="font-mono text-gray-600">{item.label}</span>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm text-gray-500">{item.count} حجز</span>
                                                            <span className="font-mono font-bold text-green-600">{item.revenue.toLocaleString()} SDG</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Parents Analytics */}
                        {activeTab === 'parents' && parentData && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                                    <StatCard
                                        title="إجمالي أولياء الأمور"
                                        value={parentData.summary.totalParents}
                                        icon={UsersRound}
                                        color="blue"
                                    />
                                    <StatCard
                                        title="نشطون"
                                        value={parentData.summary.activeParents}
                                        icon={UserCheck}
                                        color="green"
                                    />
                                    <StatCard
                                        title="لديهم حجوزات"
                                        value={parentData.summary.withBookings}
                                        icon={Calendar}
                                        color="purple"
                                    />
                                    <StatCard
                                        title="لديهم باقات"
                                        value={parentData.summary.withPackages}
                                        icon={BookOpen}
                                        color="orange"
                                    />
                                    <StatCard
                                        title="إجمالي الأطفال"
                                        value={parentData.summary.totalChildren}
                                        icon={GraduationCap}
                                        color="blue"
                                    />
                                    <StatCard
                                        title="إجمالي الحجوزات"
                                        value={parentData.summary.totalBookings}
                                        icon={Calendar}
                                        color="gray"
                                    />
                                    <StatCard
                                        title="إجمالي الباقات"
                                        value={parentData.summary.totalPackages}
                                        icon={BookOpen}
                                        color="gray"
                                    />
                                    <StatCard
                                        title="متوسط الأطفال/ولي أمر"
                                        value={parentData.summary.averageChildrenPerParent}
                                        icon={UsersRound}
                                        color="blue"
                                    />
                                </div>

                                {/* Breakdowns */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع أولياء الأمور حسب المدينة</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={parentData.breakdown.byCity} title="" />
                                        </div>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع أولياء الأمور حسب الدولة</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={parentData.breakdown.byCountry} title="" />
                                        </div>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع حسب عدد الأطفال</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <div className="space-y-2">
                                                {parentData.breakdown.byChildrenCount.map((item) => (
                                                    <div key={item.count} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-gray-600">{item.count} {item.count === 1 ? 'طفل' : 'أطفال'}</span>
                                                        <span className="font-mono font-bold">{item.parents} ولي أمر</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>توزيع الأطفال حسب المنهج</CardTitle>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <BreakdownChart data={parentData.breakdown.byChildrenCurriculum} title="" showPercentage={false} />
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
