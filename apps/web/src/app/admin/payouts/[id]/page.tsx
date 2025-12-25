'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { walletApi, Transaction, TransactionStatus } from '@/lib/api/wallet';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import {
    ChevronRight, Calendar, User, Building2,
    CreditCard, ArrowRight, Download, CheckCircle,
    XCircle, Clock, Upload, AlertTriangle, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { getFileUrl } from '@/lib/api/upload';

export default function PayoutDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [tx, setTx] = useState<any | null>(null); // Using any for extended types
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Action Modal State
    const [action, setAction] = useState<'APPROVE' | 'PAY' | 'REJECT' | null>(null);

    useEffect(() => {
        loadTransaction();
    }, [id]);

    const loadTransaction = async () => {
        setLoading(true);
        try {
            const data = await walletApi.getTransaction(id);
            setTx(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load transaction details');
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (data: { adminNote?: string; referenceId?: string; proofDocumentId?: string }) => {
        if (!tx || !action) return;

        setActionLoading(true);
        try {
            let status: TransactionStatus;
            if (action === 'APPROVE') status = 'APPROVED';
            else if (action === 'REJECT') status = 'REJECTED';
            else status = 'PAID';

            await walletApi.processTransaction(tx.id, {
                status,
                adminNote: data.adminNote,
                referenceId: data.referenceId,
                proofDocumentId: data.proofDocumentId
            });

            toast.success('Transaction processed successfully');
            loadTransaction(); // Refresh details
            setAction(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to process transaction');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">جاري التحميل...</div>;
    if (!tx) return <div className="p-8 text-center text-red-500">المعاملة غير موجودة</div>;

    // Smart Bank Info Resolution
    const liveBank = tx.wallet?.user?.teacherProfile?.bankInfo;
    const snapshot = tx.bankSnapshot;

    // Helper: Check if string is masked
    const isMasked = (str?: string) => !str || str.includes('***');

    // Prefer snapshot if valid/unmasked, otherwise use live data
    // This handles legacy transactions where snapshot might be masked
    const bank = {
        bankName: snapshot?.bankName || liveBank?.bankName,
        bankBranch: snapshot?.bankBranch || liveBank?.bankBranch,
        accountHolder: snapshot?.accountHolder || liveBank?.accountHolderName,
        accountNumber: !isMasked(snapshot?.accountNumber) ? snapshot?.accountNumber : liveBank?.accountNumber,
        iban: !isMasked(snapshot?.iban) ? snapshot?.iban : liveBank?.iban,
        swift: snapshot?.swift || liveBank?.swiftCode,
        isLive: isMasked(snapshot?.accountNumber) // Flag to indicate we are using live data fallback
    };

    return (
        <div className="p-8 max-w-5xl mx-auto font-tajawal rtl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowRight className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        تفاصيل طلب السحب
                        <StatusBadge status={tx.status} />
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">المعرف: {tx.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Amount Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">المبلغ المطلوب سحبه</p>
                            <h2 className="text-4xl font-bold text-primary">{Number(tx.amount).toLocaleString()} <span className="text-base text-gray-600">SDG</span></h2>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <Download className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Bank Details Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-gray-500" />
                            <h3 className="font-bold text-gray-800">بيانات الحساب البنكي</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
                            <DetailRow label="اسم البنك" value={bank.bankName} />
                            <DetailRow label="الفرع" value={bank.bankBranch} />

                            <div className="col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden">
                                {bank.isLive && (
                                    <div className="absolute top-0 left-0 bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-br">
                                        بيانات حالية
                                    </div>
                                )}
                                <p className="text-xs text-blue-600 font-bold mb-2">رقم الحساب الكامل (للتحويل)</p>
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-100">
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                    <code className="flex-1 font-mono text-lg text-gray-900 select-all" dir="ltr">
                                        {bank.accountNumber || 'غير متوفر'}
                                    </code>
                                </div>
                            </div>

                            <DetailRow label="اسم صاحب الحساب" value={bank.accountHolder} />

                            {bank.iban && (
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 mb-1">الايبان (IBAN)</p>
                                    <code className="block bg-gray-50 px-3 py-2 rounded-lg border font-mono text-gray-700 select-all" dir="ltr">
                                        {bank.iban}
                                    </code>
                                </div>
                            )}

                            {bank.swift && <DetailRow label="SWIFT Code" value={bank.swift} mono />}
                        </div>
                    </div>

                    {/* Payment Verification Details (Only if PAID) */}
                    {tx.status === 'PAID' && (
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm space-y-4 mb-6">
                            <h3 className="font-bold text-green-800 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                تفاصيل الدفع
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs text-green-600 mb-1 font-bold">رقم الإيصال / المعاملة</p>
                                    <code className="block bg-white px-3 py-2 rounded-lg border border-green-200 font-mono text-green-800 select-all" dir="ltr">
                                        {tx.referenceId || 'غير متوفر'}
                                    </code>
                                </div>
                                <div>
                                    <p className="text-xs text-green-600 mb-1 font-bold">صورة الإيصال</p>
                                    <button
                                        onClick={async () => {
                                            try {
                                                // Use the API client to fetch with auth headers
                                                const url = getFileUrl(tx.proofDocumentId);
                                                // Extract relative path if getFileUrl returns absolute, or just use the path
                                                // The api client base URL is already set, so we need the relative path.
                                                // getFileUrl returns full URL usually. We can just use the endpoint directly.
                                                const endpoint = `/upload/file?key=${encodeURIComponent(tx.proofDocumentId!)}`;

                                                // Use the global 'api' instance which has the interceptor
                                                // We need to import 'api' from '@/lib/api' if not available, or use walletApi if we extend it.
                                                // Simplest is to just fetch using the auth token manually or import api.
                                                // Importing api in this file might be circular or messy? No, it's fine.
                                                // Let's assume we can import { api } from '@/lib/api' or just use XHR/fetch with token.
                                                const token = localStorage.getItem('token');
                                                const res = await fetch(url, {
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });

                                                if (!res.ok) throw new Error('Failed to load');

                                                const blob = await res.blob();
                                                const blobUrl = URL.createObjectURL(blob);
                                                window.open(blobUrl, '_blank');
                                            } catch (e) {
                                                console.error(e);
                                                toast.error('فشل تحميل الصورة');
                                            }
                                        }}
                                        className="inline-flex items-center gap-2 text-sm text-green-700 hover:underline bg-white px-3 py-2 rounded-lg border border-green-200 w-full"
                                    >
                                        <FileText className="w-4 h-4" />
                                        عرض الإيصال المرفق
                                    </button>
                                </div>
                            </div>
                            {tx.adminNote && (
                                <div className="pt-2 border-t border-green-200/50">
                                    <p className="text-xs text-green-600 mb-1 font-bold">ملاحظات</p>
                                    <p className="text-sm text-green-800">{tx.adminNote}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timeline / Dates */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800 mb-4">سجل الطلب</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">1</div>
                                <div>
                                    <p className="font-bold text-gray-800">تاريخ الانشاء</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(tx.createdAt).toLocaleDateString('ar-EG')} - {new Date(tx.createdAt).toLocaleTimeString('ar-EG')}
                                    </p>
                                </div>
                            </div>

                            {tx.status === 'APPROVED' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">2</div>
                                    <div>
                                        <p className="font-bold text-gray-800">تاريخ الموافقة</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(tx.updatedAt).toLocaleDateString('ar-EG')} - {new Date(tx.updatedAt).toLocaleTimeString('ar-EG')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {tx.status === 'PAID' && (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">2</div>
                                        <div>
                                            <p className="font-bold text-gray-800">تاريخ الموافقة</p>
                                            <p className="text-sm text-gray-500">
                                                {/* If paidAt exists, assumes updatedAt was the approval time, or just use created if immediate. 
                                                    Actually, for PAID status, updatedAt is usually the pay time. 
                                                    Let's separate events if possible. If paidAt is set, use it for step 3. 
                                                    If only updatedAt, it's the latest change. 
                                                    Simplification: 
                                                    1. Created
                                                    2. Approved (if we track it separaterly, otherwise skip)
                                                    3. Paid
                                                */}
                                                {/* For now, just showing "Last Update" as step 2 if not paid, or specialized step if paid. 
                                                    Better: 
                                                    Step 2: Payment Completed (if paid)
                                                 */}
                                                <span className="text-gray-400 text-xs">(مكتمل)</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">3</div>
                                        <div>
                                            <p className="font-bold text-gray-800">تم الدفع</p>
                                            <p className="text-sm text-gray-500">
                                                {tx.paidAt
                                                    ? `${new Date(tx.paidAt).toLocaleDateString('ar-EG')} - ${new Date(tx.paidAt).toLocaleTimeString('ar-EG')}`
                                                    : `${new Date(tx.updatedAt).toLocaleDateString('ar-EG')} - ${new Date(tx.updatedAt).toLocaleTimeString('ar-EG')}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {tx.status === 'REJECTED' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">2</div>
                                    <div>
                                        <p className="font-bold text-gray-800">تاريخ الرفض</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(tx.updatedAt).toLocaleDateString('ar-EG')} - {new Date(tx.updatedAt).toLocaleTimeString('ar-EG')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    {/* User Profile Summary */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-400">
                            <User className="w-10 h-10" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{tx.wallet?.user?.teacherProfile?.displayName || 'Unknown'}</h3>
                        <p className="text-gray-500 text-sm mb-4">{tx.wallet?.user?.email}</p>
                        <a href={`/admin/users/${tx.wallet?.user?.id}`} className="text-primary text-sm hover:underline">
                            عرض الملف الشخصي
                        </a>
                    </div>

                    {/* Actions Panel */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                        <h3 className="font-bold text-gray-800 mb-2">اتخاذ إجراء</h3>

                        {tx.status === 'PENDING' && (
                            <>
                                <button
                                    onClick={() => setAction('APPROVE')}
                                    className="w-full py-3 bg-green-50 text-green-700 rounded-xl font-bold hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    موافقة مبدئية
                                </button>
                                <button
                                    onClick={() => setAction('REJECT')}
                                    className="w-full py-3 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-5 h-5" />
                                    رفض الطلب
                                </button>
                            </>
                        )}

                        {tx.status === 'APPROVED' && (
                            <>
                                <button
                                    onClick={() => setAction('PAY')}
                                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Upload className="w-5 h-5" />
                                    تأكيد الدفع
                                </button>
                                <button
                                    onClick={() => setAction('REJECT')}
                                    className="w-full py-3 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-5 h-5" />
                                    رفض
                                </button>
                            </>
                        )}

                        {tx.status === 'PAID' && (
                            <div className="bg-green-50 p-4 rounded-xl text-center text-green-700 font-bold border border-green-100">
                                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                                تم الدفع بنجاح
                            </div>
                        )}

                        {tx.status === 'REJECTED' && (
                            <div className="bg-red-50 p-4 rounded-xl text-center text-red-700 font-bold border border-red-100">
                                <XCircle className="w-8 h-8 mx-auto mb-2" />
                                مرفوض
                                <div className="text-xs text-red-600 font-normal mt-2 bg-white/50 p-2 rounded">
                                    {tx.adminNote}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Confirmation Modal */}
            {action && (
                <ActionModal
                    action={action}
                    amount={tx.amount}
                    loading={actionLoading}
                    onClose={() => setAction(null)}
                    onConfirm={handleProcess}
                />
            )}
        </div>
    );
}

function DetailRow({ label, value, mono = false }: { label: string, value: any, mono?: boolean }) {
    return (
        <div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={cn("font-bold text-gray-900 border-b border-gray-50 pb-2", mono && "font-mono")}>
                {value || '-'}
            </p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        PENDING: 'bg-yellow-100 text-yellow-700',
        APPROVED: 'bg-blue-100 text-blue-700',
        PAID: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-700'
    };

    const labels: any = {
        PENDING: 'قيد الانتظار',
        APPROVED: 'تمت الموافقة',
        PAID: 'تم الدفع',
        REJECTED: 'مرفوض'
    };

    return (
        <span className={cn("px-3 py-1 rounded-full text-xs font-bold", styles[status])}>
            {labels[status]}
        </span>
    );
}

function ActionModal({ action, amount, loading, onClose, onConfirm }: any) {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [uploading, setUploading] = useState(false);
    const [receiptFile, setReceiptFile] = useState<{ key: string, name: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate type
        if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
            toast.error('الملفات المدعومة: image/jpeg, image/png, application/pdf');
            return;
        }

        setUploading(true);
        try {
            // Import dynamically or use the imported function if at top level.
            // Assuming uploadFile is imported at top level. If not, I'll add the import in next chunk.
            const { uploadFile } = await import('@/lib/api/upload');
            const key = await uploadFile(file, 'deposits'); // reusing 'deposits' folder for now or 'teacher-docs'
            setReceiptFile({ key, name: file.name });
            toast.success('تم رفع الإيصال بنجاح');
        } catch (error) {
            console.error(error);
            toast.error('فشل رفع الملف');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const onSubmit = (data: any) => {
        onConfirm({
            ...data,
            proofDocumentId: receiptFile?.key
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">
                        {action === 'APPROVE' && 'تأكيد الموافقة'}
                        {action === 'PAY' && 'تأكيد الدفع'}
                        {action === 'REJECT' && 'رفض الطلب'}
                    </h3>
                    <button onClick={onClose}><XCircle className="w-5 h-5 text-gray-400" /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {action === 'APPROVE' && (
                        <p className="text-gray-600">
                            هل أنت متأكد من الموافقة المبدئية على مبلغ <b className="text-gray-900">{Number(amount).toLocaleString()} SDG</b>؟
                            <br />
                            <span className="text-xs text-gray-400 block mt-2">سينتقل الطلب إلى حالة "جاهز للدفع"</span>
                        </p>
                    )}

                    {action === 'PAY' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm">
                                <AlertTriangle className="w-4 h-4 inline-block ml-2" />
                                سيتم خصم المبلغ نهائياً من النظام وارسال اشعار للمعلم.
                            </div>

                            {/* Reference ID (Mandatory) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    رقم الإيصال / المعاملة (مطلوب) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('referenceId', { required: 'رقم الإيصال مطلوب' })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                    placeholder="مثال: TRX-987654321"
                                />
                                {errors.referenceId && <p className="text-red-500 text-xs mt-1">مطلوب</p>}
                            </div>

                            {/* File Upload */}
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleUpload}
                                    className="hidden"
                                />

                                {receiptFile ? (
                                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <span className="text-sm text-green-800 truncate">{receiptFile.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setReceiptFile(null)}
                                            className="text-red-500 text-xs hover:underline flex-shrink-0"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => !uploading && fileInputRef.current?.click()}
                                        className={cn(
                                            "border-2 border-dashed border-gray-200 rounded-xl p-6 text-center transition-colors cursor-pointer",
                                            uploading ? "bg-gray-50 cursor-wait" : "hover:bg-gray-50 hover:border-primary/50"
                                        )}
                                    >
                                        <Upload className={cn("w-8 h-8 mx-auto mb-2", uploading ? "text-primary animate-pulse" : "text-gray-400")} />
                                        <p className="text-sm text-gray-500">
                                            {uploading ? 'جاري الرفع...' : 'رفع صورة الإيصال (اختياري)'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <textarea
                                {...register('adminNote')}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                placeholder="ملاحظة إدارية (اختياري)"
                                rows={2}
                            />
                        </div>
                    )}

                    {action === 'REJECT' && (
                        <div className="space-y-3">
                            <p className="text-gray-600 text-sm">سيتم إعادة المبلغ إلى رصيد المعلم. يرجى ذكر السبب:</p>
                            <textarea
                                {...register('adminNote', { required: 'السبب مطلوب' })}
                                className="w-full px-4 py-3 bg-red-50 rounded-xl outline-none focus:ring-2 focus:ring-red-200 text-sm"
                                placeholder="سبب الرفض..."
                                rows={3}
                            />
                            {errors.adminNote && <span className="text-red-500 text-xs">مطلوب</span>}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors">الغاء</button>
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className={cn("flex-1 py-2.5 text-white font-bold rounded-xl transition-colors disabled:opacity-50",
                                action === 'REJECT' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary-hover'
                            )}
                        >
                            {loading ? 'جاري المعالجة...' : 'تأكيد'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
