'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { walletApi } from '@/lib/api/wallet';
import { Upload, X, Copy, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// TEMP: Bank account config (TODO: Move to SystemSettings or env)
const BANK_CONFIG = {
    bankName: 'بنك الخرطوم',
    bankNameEn: 'Bank of Khartoum',
    accountHolderName: 'شركة سدرة التعليمية',
    accountNumber: '1234567890',
    iban: 'SD1812345678901234567890',
    // QR code placeholder - replace with actual QR image URL or generate dynamically
    qrImageUrl: '/assets/bank-qr-placeholder.png' // TODO: Add actual QR code image
};

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
    const [amount, setAmount] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ amount?: string; receipt?: string }>({});
    const [copiedField, setCopiedField] = useState<string | null>(null);

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
        if (!validateForm()) {
            return;
        }

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

            // Reset form
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-tajawal" dir="rtl">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-surface flex justify-between items-center p-6 border-b border-gray-200 rounded-t-2xl">
                    <h3 className="font-bold text-2xl text-primary">إيداع رصيد</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                        <h4 className="font-bold text-primary flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            طريقة الإيداع:
                        </h4>
                        <ol className="text-sm text-gray-700 space-y-1 mr-6">
                            <li>1) قم بالتحويل البنكي باستخدام الكود أدناه</li>
                            <li>2) ارفع صورة إشعار التحويل</li>
                            <li>3) سيتم مراجعة الطلب خلال 24–48 ساعة</li>
                            <li>4) لن يتم إضافة الرصيد قبل موافقة الإدارة</li>
                        </ol>
                    </div>

                    {/* QR Code Section */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                        <h4 className="font-bold text-primary mb-4 text-center">مسح الكود للتحويل السريع</h4>
                        <div className="flex flex-col items-center">
                            {/* Actual QR Code */}
                            <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center p-2">
                                <Image
                                    src="/assets/bank-qr-code.png"
                                    alt="Bank Account QR Code"
                                    width={192}
                                    height={192}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <p className="text-sm text-text-subtle text-center mt-3">
                                يمكنك مسح الكود مباشرة من تطبيق البنك لإجراء التحويل
                            </p>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                        <h4 className="font-bold text-primary mb-2">معلومات الحساب البنكي</h4>
                        <p className="text-xs text-text-subtle mb-3">في حال لم تتمكن من استخدام الكود، يمكنك التحويل يدوياً</p>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-text-subtle">البنك:</span>
                                <span className="font-bold">{BANK_CONFIG.bankName}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-text-subtle">اسم الحساب:</span>
                                <span className="font-bold">{BANK_CONFIG.accountHolderName}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-text-subtle">رقم الحساب:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold font-mono">{BANK_CONFIG.accountNumber}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(BANK_CONFIG.accountNumber, 'account')}
                                        className="h-8 px-2"
                                    >
                                        {copiedField === 'account' ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-text-subtle">IBAN:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold font-mono text-xs">{BANK_CONFIG.iban}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(BANK_CONFIG.iban, 'iban')}
                                        className="h-8 px-2"
                                    >
                                        {copiedField === 'iban' ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-5">
                        {/* Amount */}
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">
                                المبلغ (SDG) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="number"
                                placeholder="مثال: 5000"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    setErrors(prev => ({ ...prev, amount: undefined }));
                                }}
                                className={errors.amount ? 'border-red-500' : ''}
                                disabled={loading}
                            />
                            {errors.amount && (
                                <p className="text-red-500 text-sm flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.amount}
                                </p>
                            )}
                            <p className="text-xs text-text-subtle">تأكد من أن المبلغ المدخل يطابق المبلغ المحوّل</p>
                        </div>

                        {/* Receipt Upload */}
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">
                                صورة إشعار التحويل <span className="text-red-500">*</span>
                            </Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="receipt-upload"
                                    disabled={loading}
                                />
                                <label
                                    htmlFor="receipt-upload"
                                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                                >
                                    {receiptPreview ? (
                                        <div className="relative w-full">
                                            <img
                                                src={receiptPreview}
                                                alt="Receipt preview"
                                                className="max-h-48 mx-auto rounded-lg"
                                            />
                                            <p className="text-sm text-green-600 text-center mt-2 font-medium">
                                                ✓ {receiptFile?.name}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 text-gray-400" />
                                            <p className="text-gray-600 font-medium">انقر لاختيار صورة</p>
                                            <p className="text-xs text-gray-400">PNG, JPG, JPEG (حد أقصى 5 ميجابايت)</p>
                                        </>
                                    )}
                                </label>
                            </div>
                            {errors.receipt && (
                                <p className="text-red-500 text-sm flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.receipt}
                                </p>
                            )}
                            <p className="text-xs text-text-subtle">يجب أن توضح الصورة المبلغ، التاريخ، وتفاصيل التحويل</p>
                        </div>

                        {/* Transaction ID (Optional) */}
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">
                                رقم العملية <span className="text-xs font-normal text-gray-500">(اختياري)</span>
                            </Label>
                            <Input
                                type="text"
                                placeholder="رقم العملية (إن وجد)"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                disabled={loading}
                            />
                            <p className="text-xs text-text-subtle">يساعدنا رقم العملية في تسريع المراجعة، لكنه غير إلزامي</p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-6 text-lg gap-3"
                    >
                        <Upload className="w-5 h-5" />
                        {loading ? 'جاري الإرسال...' : 'إرسال طلب الإيداع'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
