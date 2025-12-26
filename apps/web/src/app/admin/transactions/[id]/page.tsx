'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { walletApi } from '@/lib/api/wallet';
import { getFileUrl } from '@/lib/api/upload';
import { useAuth } from '@/context/AuthContext';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    Copy,
    DollarSign,
    ExternalLink,
    FileText,
    User,
    Shield,
    Info,
    AlertCircle,
    Receipt,
    Briefcase,
    CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
            setError('فشل تحميل تفاصيل المعاملة (Failed to load transaction)');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
                <div className="text-gray-500 flex items-center gap-2">
                    <Clock className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Loading transaction details...</span>
                </div>
            </div>
        );
    }

    if (error || !transaction) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
                <div className="text-red-500 bg-white p-6 rounded-lg shadow-sm border border-red-100 text-center max-w-md">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 text-red-500" />
                    <p className="font-bold text-lg mb-2">{error || 'Transaction not found'}</p>
                    <p className="text-sm text-gray-500 mb-6">The transaction you are looking for might have been removed or you may not have permission to view it.</p>
                    <Button variant="outline" className="w-full" onClick={() => router.back()}>
                        Return to Ledger
                    </Button>
                </div>
            </div>
        );
    }

    // --- Helpers ---

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount));
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'DEPOSIT':
            case 'DEPOSIT_APPROVED':
                return 'text-emerald-700 bg-emerald-50 border-emerald-100';
            case 'WITHDRAWAL':
            case 'WITHDRAWAL_COMPLETED':
            case 'WITHDRAWAL_REFUNDED':
                return 'text-amber-700 bg-amber-50 border-amber-100';
            case 'PAYMENT_LOCK':
                return 'text-purple-700 bg-purple-50 border-purple-100';
            case 'PAYMENT_RELEASE':
            case 'PACKAGE_RELEASE':
                return 'text-blue-700 bg-blue-50 border-blue-100';
            case 'REFUND':
            case 'CANCELLATION_COMPENSATION':
                return 'text-red-700 bg-red-50 border-red-100';
            case 'PACKAGE_PURCHASE':
                return 'text-indigo-700 bg-indigo-50 border-indigo-100';
            case 'ESCROW_RELEASE':
                return 'text-teal-700 bg-teal-50 border-teal-100';
            default:
                return 'text-gray-700 bg-gray-50 border-gray-100';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'text-blue-700 bg-blue-50 border-blue-100';
            case 'PAID': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
            case 'PENDING': return 'text-amber-700 bg-amber-50 border-amber-100';
            case 'REJECTED': return 'text-red-700 bg-red-50 border-red-100';
            default: return 'text-gray-700 bg-gray-50 border-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC] font-sans pb-20">
            {/* 1. Page Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <Button variant="ghost" size="icon" className="mt-1 h-8 w-8 text-gray-400 hover:text-gray-900" onClick={() => router.back()}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase border ${getTypeColor(transaction.type)}`}>
                                        {transaction.type}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase border ${getStatusColor(transaction.status)}`}>
                                        {transaction.status}
                                    </span>
                                    <span className="text-gray-300 text-xs">|</span>
                                    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => copyToClipboard(transaction.id, 'Transaction ID')}>
                                        <span className="font-mono text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                                            {transaction.id}
                                        </span>
                                        <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-gray-400 font-medium text-lg">SDG</span>
                                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                                        {formatCurrency(transaction.amount)}
                                    </h1>
                                </div>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    Created on {new Date(transaction.createdAt).toLocaleString('en-US', {
                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-12 gap-8">

                    {/* Left Column (Primary - 70%) */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">

                        {/* A. Financial Breakdown */}
                        <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-gray-500" />
                                    Financial Detail
                                </h3>
                                <div className="text-xs text-gray-400 font-mono">INV-STYLE VIEW</div>
                            </div>
                            <div className="p-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Gross Amount</span>
                                        <span className="font-mono font-medium text-gray-900">{formatCurrency(transaction.amount)} SDG</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-1.5">
                                            Platform Commission
                                            {/* Logic check: if commission exists in metadata, show it. Otherwise text placeholder as requested */}
                                            {/* <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded">0%</span> */}
                                        </span>
                                        <span className="font-mono text-gray-400 italic">0.00 SDG</span>
                                    </div>
                                    <div className="border-t border-gray-100 my-4"></div>
                                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg -mx-4 border border-gray-100">
                                        <span className="font-bold text-gray-900">Net Amount</span>
                                        <span className="font-mono font-bold text-xl text-gray-900">{formatCurrency(transaction.amount)} SDG</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* B. Context & Links */}
                        <div className="grid grid-cols-2 gap-6">
                            <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Related Booking</h4>
                                {transaction.metadata?.bookingId ? (
                                    <Link href={`/admin/bookings/${transaction.metadata.bookingId}`} className="group flex items-start gap-3 p-3 rounded-md hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all">
                                        <div className="bg-blue-100 p-2 rounded text-blue-600">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 flex items-center gap-1">
                                                View Booking <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-xs font-mono text-gray-500 mt-1">
                                                ID: {transaction.metadata.bookingId.substring(0, 8)}...
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="text-sm text-gray-400 italic py-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        No linked booking reference
                                    </div>
                                )}
                            </section>

                            <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Supporting Documents</h4>
                                {transaction.referenceImage ? (
                                    <a href={getFileUrl(transaction.referenceImage)} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 p-3 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                                        <div className="bg-gray-100 p-2 rounded text-gray-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-gray-700 flex items-center gap-1">
                                                Receipt / Reference <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">Click to view attachment</div>
                                        </div>
                                    </a>
                                ) : (
                                    <div className="text-sm text-gray-400 italic py-2 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        No document attached
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* C. Audit Trail */}
                        <section className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50/30">
                            <div className="px-6 py-3 bg-gray-100/50 border-b border-gray-200 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-gray-500" />
                                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Official Audit Log</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Admin / System Note</label>
                                    <div className="font-mono text-sm text-gray-800 bg-white p-3 border border-gray-200 rounded leading-relaxed">
                                        {transaction.adminNote || 'No administrative notes recorded for this transaction.'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Processed By</label>
                                    <div className="text-sm font-medium text-gray-900">System / Admin</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Updated</label>
                                    <div className="text-sm font-medium text-gray-900 font-mono">
                                        {new Date(transaction.updatedAt).toLocaleDateString()} <span className="text-gray-400">at</span> {new Date(transaction.updatedAt).toLocaleTimeString()}
                                    </div>
                                </div>
                                {transaction.referenceId && (
                                    <div className="col-span-2 pt-4 border-t border-gray-100">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">External Payment Reference / Proof ID</label>
                                        <div className="font-mono text-sm text-gray-900 select-all">{transaction.referenceId}</div>
                                    </div>
                                )}
                            </div>
                        </section>

                    </div>

                    {/* Right Column (Secondary - 30%) */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">

                        {/* User Card */}
                        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">User Profile</h4>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                                    {transaction.wallet?.user?.teacherProfile?.displayName?.charAt(0) || transaction.wallet?.user?.email?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 line-clamp-1">
                                        {transaction.wallet?.user?.teacherProfile?.displayName || 'Unknown User'}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono line-clamp-1" title={transaction.wallet?.user?.email}>
                                        {transaction.wallet?.user?.email}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-t border-b border-gray-50">
                                    <span className="text-xs text-gray-500">Role</span>
                                    <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                        {transaction.wallet?.user?.role || 'USER'}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 uppercase font-bold">User UUID</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100 truncate flex-1 text-gray-600" title={transaction.wallet?.userId}>
                                            {transaction.wallet?.userId}
                                        </code>
                                        <button onClick={() => copyToClipboard(transaction.wallet?.userId, 'User ID')} className="text-gray-400 hover:text-gray-600">
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <Link
                                    href={`/admin/users/${transaction.wallet?.userId}`}
                                    className="block w-full text-center text-xs font-medium text-blue-600 hover:bg-blue-50 py-2 rounded transition-colors mt-2"
                                >
                                    View Full Profile →
                                </Link>
                            </div>
                        </section>

                        {/* Bank Snapshot (Withdrawal Only) */}
                        {transaction.type === 'WITHDRAWAL' && (
                            <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-3 border-b border-gray-100 bg-amber-50/30">
                                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" />
                                        Bank Snapshot
                                    </h4>
                                </div>
                                <div className="p-5">
                                    {transaction.bankSnapshot ? (
                                        <div className="space-y-4">
                                            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded mb-4">
                                                <Info className="w-3 h-3 inline-block mr-1 mb-0.5" />
                                                <strong>Frozen Info:</strong> These details represent the bank account <em>at the exact time</em> of the withdrawal request.
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Bank Name</label>
                                                    <div className="text-sm font-medium text-gray-900">{transaction.bankSnapshot.bankName}</div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Account Number</label>
                                                    <div className="text-sm font-mono font-medium text-gray-900 tracking-wider">{transaction.bankSnapshot.accountNumber}</div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Account Holder</label>
                                                    <div className="text-sm text-gray-900">{transaction.bankSnapshot.accountHolder}</div>
                                                </div>
                                                {transaction.bankSnapshot.iban && (
                                                    <div>
                                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">IBAN</label>
                                                        <div className="text-xs font-mono text-gray-600 break-all">{transaction.bankSnapshot.iban}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-gray-400 text-xs italic">
                                            No bank snapshot captured for this transaction.
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Quick Actions (Read Only) */}
                        <section className="text-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Support Actions</p>
                            <Button variant="outline" size="sm" className="w-full text-xs text-gray-500" disabled>
                                <AlertCircle className="w-3 h-3 mr-2" />
                                Report / Dispute (Soon)
                            </Button>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
