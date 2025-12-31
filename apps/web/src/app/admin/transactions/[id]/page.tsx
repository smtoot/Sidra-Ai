'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { walletApi } from '@/lib/api/wallet';
import { getFileUrl } from '@/lib/api/upload';
import { useAuth } from '@/context/AuthContext';
import {
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    User,
    Shield,
    Info,
    AlertCircle,
    Receipt,
    Wallet,
    Hash,
    Phone,
    Mail,
    CreditCard,
    ArrowUpCircle,
    ArrowDownCircle,
    RefreshCw,
    Lock,
    Unlock,
    Package,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Helper to generate readable transaction ID
const generateReadableId = (uuid: string, type: string): string => {
    const prefix = {
        'DEPOSIT': 'DEP',
        'WITHDRAWAL': 'WTH',
        'PAYMENT_LOCK': 'PLK',
        'PAYMENT_RELEASE': 'PRL',
        'PACKAGE_PURCHASE': 'PKG',
        'PACKAGE_RELEASE': 'PKR',
        'REFUND': 'REF',
        'ESCROW_RELEASE': 'ESC',
        'CANCELLATION_COMPENSATION': 'CMP',
    }[type] || 'TXN';

    // Take last 8 characters of UUID and convert to uppercase
    const shortId = uuid.slice(-8).toUpperCase();
    return `${prefix}-${shortId}`;
};

// Arabic type names
const getArabicTypeName = (type: string): string => {
    const types: Record<string, string> = {
        'DEPOSIT': 'إيداع',
        'DEPOSIT_APPROVED': 'إيداع معتمد',
        'WITHDRAWAL': 'سحب',
        'WITHDRAWAL_COMPLETED': 'سحب مكتمل',
        'WITHDRAWAL_REFUNDED': 'سحب مسترد',
        'PAYMENT_LOCK': 'حجز دفعة',
        'PAYMENT_RELEASE': 'تحرير دفعة',
        'PACKAGE_PURCHASE': 'شراء باقة',
        'PACKAGE_RELEASE': 'تحرير باقة',
        'REFUND': 'استرداد',
        'ESCROW_RELEASE': 'تحرير الضمان',
        'CANCELLATION_COMPENSATION': 'تعويض إلغاء',
    };
    return types[type] || type;
};

// Arabic status names
const getArabicStatusName = (status: string): string => {
    const statuses: Record<string, string> = {
        'PENDING': 'قيد الانتظار',
        'APPROVED': 'معتمد',
        'PAID': 'مدفوع',
        'REJECTED': 'مرفوض',
        'COMPLETED': 'مكتمل',
        'CANCELLED': 'ملغي',
    };
    return statuses[status] || status;
};

// Get type icon
const getTypeIcon = (type: string) => {
    switch (type) {
        case 'DEPOSIT':
        case 'DEPOSIT_APPROVED':
            return ArrowDownCircle;
        case 'WITHDRAWAL':
        case 'WITHDRAWAL_COMPLETED':
        case 'WITHDRAWAL_REFUNDED':
            return ArrowUpCircle;
        case 'PAYMENT_LOCK':
            return Lock;
        case 'PAYMENT_RELEASE':
        case 'ESCROW_RELEASE':
            return Unlock;
        case 'PACKAGE_PURCHASE':
        case 'PACKAGE_RELEASE':
            return Package;
        case 'REFUND':
        case 'CANCELLATION_COMPENSATION':
            return RefreshCw;
        default:
            return CreditCard;
    }
};

export default function TransactionDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const id = params.id as string;

    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        loadTransaction();
    }, [id]);

    const loadTransaction = async () => {
        setLoading(true);
        try {
            const data = await walletApi.getTransaction(id);
            setTransaction(data);
        } catch (err) {
            console.error('Failed to load transaction details', err);
            setError('فشل تحميل تفاصيل المعاملة');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`تم نسخ ${label}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center" dir="rtl">
                <div className="text-gray-500 flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="font-medium text-lg">جاري تحميل تفاصيل المعاملة...</span>
                </div>
            </div>
        );
    }

    if (error || !transaction) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center" dir="rtl">
                <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="font-bold text-xl text-gray-900 mb-2">{error || 'المعاملة غير موجودة'}</h2>
                    <p className="text-gray-500 mb-6">
                        المعاملة التي تبحث عنها قد تكون محذوفة أو ليس لديك صلاحية لعرضها.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => router.back()}>
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للسجل المالي
                    </Button>
                </div>
            </div>
        );
    }

    // --- Helpers ---
    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount));
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'DEPOSIT':
            case 'DEPOSIT_APPROVED':
                return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'WITHDRAWAL':
            case 'WITHDRAWAL_COMPLETED':
            case 'WITHDRAWAL_REFUNDED':
                return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'PAYMENT_LOCK':
                return 'text-purple-700 bg-purple-50 border-purple-200';
            case 'PAYMENT_RELEASE':
            case 'PACKAGE_RELEASE':
                return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'REFUND':
            case 'CANCELLATION_COMPENSATION':
                return 'text-red-700 bg-red-50 border-red-200';
            case 'PACKAGE_PURCHASE':
                return 'text-indigo-700 bg-indigo-50 border-indigo-200';
            case 'ESCROW_RELEASE':
                return 'text-teal-700 bg-teal-50 border-teal-200';
            default:
                return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
            case 'COMPLETED':
            case 'PAID':
                return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'PENDING':
                return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'REJECTED':
            case 'CANCELLED':
                return 'text-red-700 bg-red-50 border-red-200';
            default:
                return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    const readableId = generateReadableId(transaction.id, transaction.type);
    const TypeIcon = getTypeIcon(transaction.type);
    const userInfo = transaction.wallet?.user;
    const displayName = userInfo?.teacherProfile?.displayName ||
        userInfo?.parentProfile?.displayName ||
        userInfo?.firstName ||
        userInfo?.email?.split('@')[0] ||
        'مستخدم';

    return (
        <div className="min-h-screen bg-[#F8F9FC] font-tajawal pb-20" dir="rtl">
            {/* Page Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-5">
                    <div className="flex items-start gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="mt-1 h-10 w-10 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                            onClick={() => router.back()}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                        <div className="flex-1">
                            {/* Transaction Type & Status Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${getTypeColor(transaction.type)}`}>
                                    <TypeIcon className="w-4 h-4" />
                                    {getArabicTypeName(transaction.type)}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(transaction.status)}`}>
                                    {getArabicStatusName(transaction.status)}
                                </span>
                            </div>

                            {/* Amount */}
                            <div className="flex items-baseline gap-3 mb-2">
                                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                                    {formatCurrency(transaction.amount)}
                                </h1>
                                <span className="text-xl text-gray-500 font-medium">ج.س</span>
                            </div>

                            {/* Transaction ID & Date */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4" />
                                    <span className="font-mono font-semibold text-gray-700">{readableId}</span>
                                    <button
                                        onClick={() => copyToClipboard(transaction.id, 'معرف المعاملة')}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        title="نسخ المعرف الكامل"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {new Date(transaction.createdAt).toLocaleDateString('ar-SA', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                        {' - '}
                                        {new Date(transaction.createdAt).toLocaleTimeString('ar-SA', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-12 gap-8">

                    {/* Right Column (Primary - 70%) - RTL so this is on the right */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">

                        {/* Transaction Summary Card */}
                        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-primary" />
                                    ملخص المعاملة
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Left side - Financial details */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">نوع المعاملة</label>
                                            <p className="text-gray-900 font-medium">{getArabicTypeName(transaction.type)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">الحالة</label>
                                            <p className="text-gray-900 font-medium">{getArabicStatusName(transaction.status)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">المبلغ</label>
                                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(transaction.amount)} <span className="text-base font-normal text-gray-500">ج.س</span></p>
                                        </div>
                                    </div>

                                    {/* Right side - Timestamps */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">تاريخ الإنشاء</label>
                                            <p className="text-gray-900">
                                                {new Date(transaction.createdAt).toLocaleDateString('ar-SA', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(transaction.createdAt).toLocaleTimeString('ar-SA', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">آخر تحديث</label>
                                            <p className="text-gray-900">
                                                {new Date(transaction.updatedAt).toLocaleDateString('ar-SA', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(transaction.updatedAt).toLocaleTimeString('ar-SA', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Reference ID if exists */}
                                {transaction.referenceId && (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <label className="block text-xs font-semibold text-gray-500 mb-2">رقم المرجع / إثبات الدفع</label>
                                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                            <code className="font-mono text-sm text-gray-900 flex-1">{transaction.referenceId}</code>
                                            <button
                                                onClick={() => copyToClipboard(transaction.referenceId, 'رقم المرجع')}
                                                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                            >
                                                <Copy className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Related Items Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Related Booking */}
                            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    الحجز المرتبط
                                </h4>
                                {transaction.metadata?.bookingId ? (
                                    <Link
                                        href={`/admin/bookings/${transaction.metadata.bookingId}`}
                                        className="group flex items-center gap-3 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-all"
                                    >
                                        <div className="bg-blue-500 p-2.5 rounded-lg text-white">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 flex items-center gap-2">
                                                عرض الحجز
                                                <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-xs font-mono text-gray-500 mt-1">
                                                {transaction.metadata.bookingId.substring(0, 12)}...
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                                        لا يوجد حجز مرتبط
                                    </div>
                                )}
                            </section>

                            {/* Supporting Documents */}
                            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-emerald-600" />
                                    المستندات المرفقة
                                </h4>
                                {transaction.referenceImage ? (
                                    <a
                                        href={getFileUrl(transaction.referenceImage)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-3 p-4 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-all"
                                    >
                                        <div className="bg-emerald-500 p-2.5 rounded-lg text-white">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 flex items-center gap-2">
                                                عرض الإيصال
                                                <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                انقر لعرض المرفق
                                            </div>
                                        </div>
                                    </a>
                                ) : (
                                    <div className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                                        لا توجد مستندات مرفقة
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Admin Notes */}
                        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-gray-600" />
                                    سجل المراجعة
                                </h3>
                            </div>
                            <div className="p-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-2">ملاحظات الإدارة</label>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[80px]">
                                        <p className="text-gray-700 leading-relaxed">
                                            {transaction.adminNote || 'لا توجد ملاحظات إدارية لهذه المعاملة.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* Left Column (Secondary - 30%) - RTL so this is on the left */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">

                        {/* User Card */}
                        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-l from-primary/5 to-transparent">
                                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" />
                                    معلومات المستخدم
                                </h4>
                            </div>
                            <div className="p-5">
                                {/* User Avatar & Name */}
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl">
                                        {displayName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-900 text-lg truncate">
                                            {displayName}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {userInfo?.role === 'TEACHER' ? 'معلم' :
                                                userInfo?.role === 'PARENT' ? 'ولي أمر' :
                                                    userInfo?.role === 'STUDENT' ? 'طالب' : 'مستخدم'}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-3 mb-5">
                                    {userInfo?.email && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <span className="text-gray-700 truncate flex-1" dir="ltr">{userInfo.email}</span>
                                        </div>
                                    )}
                                    {userInfo?.phoneNumber && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Phone className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <span className="text-gray-700" dir="ltr">{userInfo.phoneNumber}</span>
                                        </div>
                                    )}
                                </div>

                                {/* User ID */}
                                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">معرف المستخدم</label>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 truncate flex-1 text-gray-600 font-mono" title={transaction.wallet?.userId}>
                                            {transaction.wallet?.userId?.substring(0, 16)}...
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(transaction.wallet?.userId, 'معرف المستخدم')}
                                            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                        >
                                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* View Profile Button */}
                                <Link
                                    href={`/admin/users/${transaction.wallet?.userId}`}
                                    className="block w-full text-center text-sm font-semibold text-primary hover:bg-primary/5 py-3 rounded-lg border border-primary/20 transition-colors"
                                >
                                    عرض الملف الشخصي الكامل
                                </Link>
                            </div>
                        </section>

                        {/* Bank Snapshot (Withdrawal Only) */}
                        {transaction.type === 'WITHDRAWAL' && (
                            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50">
                                    <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        معلومات الحساب البنكي
                                    </h4>
                                </div>
                                <div className="p-5">
                                    {transaction.bankSnapshot ? (
                                        <>
                                            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg mb-4 flex items-start gap-2">
                                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span>
                                                    هذه المعلومات تمثل الحساب البنكي <strong>وقت طلب السحب</strong>
                                                </span>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">اسم البنك</label>
                                                    <p className="text-gray-900 font-medium">{transaction.bankSnapshot.bankName}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">رقم الحساب</label>
                                                    <p className="text-gray-900 font-mono font-medium tracking-wider" dir="ltr">{transaction.bankSnapshot.accountNumber}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">اسم صاحب الحساب</label>
                                                    <p className="text-gray-900">{transaction.bankSnapshot.accountHolder}</p>
                                                </div>
                                                {transaction.bankSnapshot.iban && (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">رقم الآيبان</label>
                                                        <p className="text-xs font-mono text-gray-600 break-all" dir="ltr">{transaction.bankSnapshot.iban}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-6 text-gray-400 text-sm">
                                            لا توجد معلومات بنكية لهذه المعاملة
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Technical Details (Collapsible) */}
                        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-gray-500" />
                                    التفاصيل التقنية
                                </h4>
                            </div>
                            <div className="p-5 space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">معرف المعاملة الكامل</label>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs bg-gray-50 px-2 py-1.5 rounded border border-gray-100 truncate flex-1 text-gray-600 font-mono" dir="ltr">
                                            {transaction.id}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(transaction.id, 'المعرف الكامل')}
                                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">معرف المحفظة</label>
                                    <code className="text-xs bg-gray-50 px-2 py-1.5 rounded border border-gray-100 block truncate text-gray-600 font-mono" dir="ltr">
                                        {transaction.walletId}
                                    </code>
                                </div>
                            </div>
                        </section>

                        {/* Support Actions */}
                        <section className="text-center">
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">إجراءات الدعم</p>
                            <Button variant="outline" size="sm" className="w-full text-sm text-gray-500" disabled>
                                <AlertCircle className="w-4 h-4 ml-2" />
                                إبلاغ / نزاع (قريباً)
                            </Button>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
