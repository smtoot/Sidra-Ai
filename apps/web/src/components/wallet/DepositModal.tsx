'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { walletApi } from '@/lib/api/wallet';
import { Upload, X } from 'lucide-react';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
    const [amount, setAmount] = useState('');
    // Mock image upload for MVP (Text input for URL)
    const [receiptUrl, setReceiptUrl] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!amount || !receiptUrl) return;

        setLoading(true);
        try {
            await walletApi.deposit({
                amount: Number(amount),
                referenceImage: receiptUrl
            });
            alert('تم إرسال طلب الإيداع بنجاح. سيقوم المسؤول بمراجعته قريباً.');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to deposit', error);
            alert('حدث خطأ. الرجاء المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-tajawal rtl">
            <div className="bg-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold text-lg text-primary">إيداع رصيد</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Bank Info */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm space-y-2">
                        <p className="font-bold text-primary">معلومات التحويل البنكي:</p>
                        <div className="flex justify-between">
                            <span className="text-text-subtle">البنك:</span>
                            <span className="font-bold">بنك الخرطوم (Bank of Khartoum)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-subtle">رقم الحساب:</span>
                            <span className="font-bold font-mono">1234567890</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-subtle">اسم الحساب:</span>
                            <span className="font-bold">شركة سدرة التعليمية</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>المبلغ (SDG)</Label>
                            <Input
                                type="number"
                                placeholder="مثال: 5000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>رابط صورة الإيصال</Label>
                            <Input
                                placeholder="https://..."
                                value={receiptUrl}
                                onChange={(e) => setReceiptUrl(e.target.value)}
                            />
                            <p className="text-xs text-text-subtle">لأغراض MVP، يرجى لصق رابط الصورة (مثال: من Imgur)</p>
                        </div>
                    </div>

                    <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2">
                        <Upload className="w-4 h-4" />
                        {loading ? 'جاري الإرسال...' : 'تأكيد عملية التحويل'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
