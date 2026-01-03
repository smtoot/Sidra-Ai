'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { walletApi } from '@/lib/api/wallet';
import { api } from '@/lib/api';
import { Upload, X, Copy, Check, AlertCircle, ChevronLeft, Building2, Smartphone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// SECURITY FIX: Bank config type from API
interface BankConfig {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
}

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
    const [activeTab, setActiveTab] = useState<'qr' | 'transfer'>('qr');
    const [amount, setAmount] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ amount?: string; receipt?: string }>({});
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // SECURITY FIX: Fetch bank config from API instead of hardcoding
    const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchBankConfig();
        }
    }, [isOpen]);

    const fetchBankConfig = async () => {
        try {
            setLoadingConfig(true);
            const { data } = await api.get('/system-settings/deposit-info');
            setBankConfig(data);
        } catch (error) {
            console.error('Failed to fetch bank config:', error);
            toast.error('فشل في تحميل بيانات الحساب البنكي');
        } finally {
            setLoadingConfig(false);
        }
    };

    if (!isOpen) return null;

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success('تم النسخ بنجاح');
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            toast.error('فشل النسخ');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, receipt: 'يجب أن يكون الملف صورة' }));
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, receipt: 'حجم الملف يجب أن لا يتجاوز 5 ميجابايت' }));
            return;
        }

        setReceiptFile(file);
        setErrors(prev => ({ ...prev, receipt: undefined }));

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const validateForm = (): boolean => {
        const newErrors: { amount?: string; receipt?: string } = {};

        if (!amount || Number(amount) <= 0) {
            newErrors.amount = 'يرجى إدخال مبلغ صحيح';
        }

        if (!receiptFile) {
            newErrors.receipt = 'يجب رفع صورة إشعار التحويل';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        if (!receiptFile) {
            toast.error('الرجاء إرفاق صورة الإيصال');
            return;
        }

        setLoading(true);
        try {
            // Upload receipt file to server
            const { uploadFile } = await import('@/lib/api/upload');
            const fileKey = await uploadFile(receiptFile, 'deposits');

            // Submit deposit request with file key
            await walletApi.deposit({
                amount: Number(amount),
                referenceImage: fileKey
            });

            toast.success('تم إرسال طلب الإيداع بنجاح. في انتظار موافقة الإدارة.');
            setAmount('');
            setReceiptFile(null);
            setReceiptPreview(null);
            setTransactionId('');
            setErrors({});
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to deposit', error);
            const message = error?.response?.data?.message || error?.message || 'حدث خطأ. الرجاء المحاولة مرة أخرى.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-tajawal" dir="rtl">
            <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/20">
                {/* Header */}
                <div className="sticky top-0 bg-surface/95 backdrop-blur-md z-10 flex justify-between items-center p-5 border-b border-gray-100">
                    <div>
                        <h3 className="font-bold text-xl text-gray-900">شحن المحفظة</h3>
                        <p className="text-sm text-gray-500">بنك الخرطوم (Bankak)</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} disabled={loading} className="hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </Button>
                </div>

                <div className="p-5 space-y-6">
                    {/* Method Tabs */}
                    <div className="bg-gray-100 p-1 rounded-xl flex">
                        <button
                            onClick={() => setActiveTab('qr')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'qr'
                                ? 'bg-white text-[#C8102E] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span className="text-lg">📱</span>
                            دفع QR (بنكك Pay)
                        </button>
                        <button
                            onClick={() => setActiveTab('transfer')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'transfer'
                                ? 'bg-white text-[#C8102E] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Building2 className="w-4 h-4" />
                            تحويل حساب
                        </button>
                    </div>

                    {/* Content Based on Tab */}
                    <div className="space-y-6">
                        {activeTab === 'qr' ? (
                            // QR Code / Bankak Pay View
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                                {/* Instructions */}
                                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                                    <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs">1</span>
                                        خطوات الدفع
                                    </h4>
                                    <ul className="space-y-2 text-sm text-blue-800 mr-2">
                                        <li className="flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                                            افتح تطبيق بنكك وانترقل لـ <span className="font-bold mx-1">بنكك PAY</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                                            امسح الكود أدناه
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                                            أكمل عملية الدفع وارفع الاشعار في الأسفل
                                        </li>
                                    </ul>
                                </div>

                                {/* QR Code Display */}
                                <div className="flex justify-center">
                                    <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
                                        <Image
                                            src="/assets/bank-qr-code.png"
                                            alt="Bankak QR Code"
                                            width={200}
                                            height={200}
                                            className="rounded-lg"
                                        />
                                        <p className="text-center text-xs font-bold text-gray-400 mt-2 tracking-wider">SCAN ME</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Account Transfer View
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                                {/* Account Details Card */}
                                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-600">تفاصيل الحساب</span>
                                        <span className="text-xs text-[#C8102E] font-bold bg-red-50 px-2 py-1 rounded-full">بنك الخرطوم</span>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {loadingConfig ? (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                            </div>
                                        ) : bankConfig ? (
                                            <>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-500">رقم الحساب</p>
                                                    <div className="flex items-center gap-2 justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors group">
                                                        <span className="font-mono font-bold text-lg text-gray-800">{bankConfig.accountNumber}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleCopy(bankConfig.accountNumber, 'account')}
                                                            className="h-8 px-3 hover:bg-white hover:shadow-sm"
                                                        >
                                                            {copiedField === 'account' ? (
                                                                <span className="text-green-600 font-bold text-xs">تم النسخ</span>
                                                            ) : (
                                                                <span className="text-primary text-xs font-bold">نسخ</span>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-500">اسم الحساب</p>
                                                    <p className="font-bold text-gray-900 text-sm">{bankConfig.accountHolderName}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-red-500 text-sm text-center py-4">فشل في تحميل بيانات الحساب</p>
                                        )}
                                    </div>
                                </div>

                                {/* Manual Instructions */}
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                    <h4 className="font-bold text-amber-900 text-sm mb-2">تعليمات التحويل:</h4>
                                    <ol className="list-decimal text-xs text-amber-800 mr-4 space-y-1">
                                        <li>افتح تطبيق بنكك واختر <b>"تحويل"</b></li>
                                        <li>اختر <b>"تحويل لعميل بنك الخرطوم"</b></li>
                                        <li>الصق رقم الحساب وتأكد من الاسم المطابق</li>
                                        <li>احتفظ بصورة الاشعار لرفعها في الخطوة التالية</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        <div className="w-full h-px bg-gray-100" />

                        {/* Amount & Upload Section (Common) */}
                        <div className="space-y-5">
                            <div className="space-y-3">
                                <Label className="text-gray-900 font-bold text-sm">
                                    المبلغ المحول
                                </Label>
                                <div className="grid grid-cols-4 gap-2 mb-2">
                                    {[5000, 10000, 20000, 50000].map((quickAmount) => (
                                        <button
                                            key={quickAmount}
                                            onClick={() => {
                                                setAmount(quickAmount.toString());
                                                setErrors(prev => ({ ...prev, amount: undefined }));
                                            }}
                                            className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all ${amount === quickAmount.toString()
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {quickAmount.toLocaleString('en-US')}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder="أدخل المبلغ..."
                                        value={amount}
                                        onChange={(e) => {
                                            setAmount(e.target.value);
                                            setErrors(prev => ({ ...prev, amount: undefined }));
                                        }}
                                        className={`h-12 text-lg ${errors.amount ? 'border-red-500 focus-visible:ring-red-200' : ''}`}
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">SDG</span>
                                </div>
                                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                            </div>

                            <div className="space-y-3">
                                <Label className="text-gray-900 font-bold text-sm">
                                    صورة الإشعار
                                </Label>
                                <div className={`border-2 border-dashed rounded-xl p-6 transition-all text-center cursor-pointer relative overflow-hidden group ${errors.receipt ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                                    }`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={loading}
                                    />

                                    {receiptPreview ? (
                                        <div className="relative z-0">
                                            <div className="w-16 h-16 mx-auto mb-2 relative">
                                                <img src={receiptPreview} alt="Preview" className="w-full h-full object-cover rounded-lg shadow-sm" />
                                                <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-md">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 truncate max-w-[200px] mx-auto">{receiptFile?.name}</p>
                                            <p className="text-xs text-green-600 font-bold mt-1">تم اختيار الملف بنجاح</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-700">اضغط لرفع الصورة</p>
                                                <p className="text-xs text-gray-400 mt-1">أو اسحب الملف هنا</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {errors.receipt && <p className="text-red-500 text-xs mt-1">{errors.receipt}</p>}
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary-hover text-white font-bold h-12 rounded-xl text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-4"
                            >
                                {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
