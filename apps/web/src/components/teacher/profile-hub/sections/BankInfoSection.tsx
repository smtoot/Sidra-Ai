'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { walletApi, UpsertBankInfoDto } from '@/lib/api/wallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, Loader2, Check } from 'lucide-react';

interface BankInfoSectionProps {
    isReadOnly?: boolean;
}

export function BankInfoSection({ isReadOnly = false }: BankInfoSectionProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasBankInfo, setHasBankInfo] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<UpsertBankInfoDto>();

    useEffect(() => {
        loadBankInfo();
    }, []);

    const loadBankInfo = async () => {
        setLoading(true);
        try {
            const wallet = await walletApi.getMyBalance();
            if (wallet.bankInfo) {
                setHasBankInfo(true);
                reset({
                    bankName: wallet.bankInfo.bankName,
                    accountHolderName: wallet.bankInfo.accountHolder || '',
                    accountNumber: wallet.bankInfo.accountNumberMasked || '',
                    iban: wallet.bankInfo.ibanMasked || '',
                });
            }
        } catch (error) {
            console.error('Failed to load bank info:', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: UpsertBankInfoDto) => {
        setSaving(true);
        try {
            await walletApi.upsertBankInfo(data);
            setHasBankInfo(true);
            toast.success('تم حفظ بيانات الحساب البنكي بنجاح');
        } catch (error: any) {
            console.error('Failed to save bank info:', error);
            toast.error(error?.response?.data?.message || 'فشل حفظ البيانات');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with status */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Building2 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold">بيانات الحساب البنكي</h3>
                    <p className="text-sm text-gray-500">
                        {hasBankInfo
                            ? 'بيانات حسابك البنكي مسجلة ✓'
                            : 'أضف بيانات حسابك البنكي لتتمكن من سحب أرباحك'}
                    </p>
                </div>
                {hasBankInfo && (
                    <div className="mr-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        مكتمل
                    </div>
                )}
            </div>

            {/* Bank Info Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>اسم البنك *</Label>
                        <Input
                            {...register('bankName', { required: 'اسم البنك مطلوب' })}
                            placeholder="مثال: بنك الخرطوم"
                            disabled={isReadOnly}
                        />
                        {errors.bankName && (
                            <p className="text-red-500 text-xs">{errors.bankName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>اسم صاحب الحساب *</Label>
                        <Input
                            {...register('accountHolderName', { required: 'اسم صاحب الحساب مطلوب' })}
                            placeholder="كما هو مسجل في البنك"
                            disabled={isReadOnly}
                        />
                        {errors.accountHolderName && (
                            <p className="text-red-500 text-xs">{errors.accountHolderName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>رقم الحساب *</Label>
                        <Input
                            {...register('accountNumber', { required: 'رقم الحساب مطلوب' })}
                            placeholder="رقم الحساب البنكي"
                            disabled={isReadOnly}
                            dir="ltr"
                            className="text-left"
                        />
                        {errors.accountNumber && (
                            <p className="text-red-500 text-xs">{errors.accountNumber.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>رقم الآيبان (اختياري)</Label>
                        <Input
                            {...register('iban')}
                            placeholder="SD..."
                            disabled={isReadOnly}
                            dir="ltr"
                            className="text-left"
                        />
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="flex justify-start pt-4">
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                'حفظ بيانات الحساب'
                            )}
                        </Button>
                    </div>
                )}
            </form>

            {/* Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <strong>ملاحظة:</strong> تأكد من صحة البيانات. سيتم تحويل أرباحك إلى هذا الحساب.
            </div>
        </div>
    );
}
