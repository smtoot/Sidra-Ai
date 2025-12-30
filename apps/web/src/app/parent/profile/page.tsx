'use client';

import { useState, useEffect } from 'react';
import { parentApi } from '@/lib/api/parent';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    User, Phone, Mail, MapPin, MessageCircle, Users,
    Edit2, Save, X, Loader2, ChevronLeft, AlertCircle, Shield, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ParentProfile {
    id: string;
    userId: string;
    whatsappNumber?: string;
    city?: string;
    country?: string;
    user: {
        id: string;
        email?: string;
        phoneNumber?: string;
        firstName?: string;
        lastName?: string;
    };
    children: Array<{
        id: string;
        name: string;
        gradeLevel?: string;
    }>;
}

export default function ParentProfilePage() {
    const { updateUser } = useAuth();
    const [profile, setProfile] = useState<ParentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        whatsappNumber: '',
        country: '',
        city: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await parentApi.getProfile();
            setProfile(data);
            setFormData({
                firstName: data.user?.firstName || '',
                lastName: data.user?.lastName || '',
                whatsappNumber: data.whatsappNumber || '',
                country: data.country || '',
                city: data.city || '',
            });
        } catch (err) {
            console.error('Failed to load profile', err);
            setError(true);
            toast.error('فشل تحميل الملف الشخصي');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await parentApi.updateProfile(formData);
            updateUser({ firstName: formData.firstName, lastName: formData.lastName });
            toast.success('تم حفظ التغييرات بنجاح');
            setIsEditing(false);
            await loadProfile();
        } catch (err) {
            console.error('Failed to save profile', err);
            toast.error('فشل حفظ التغييرات');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setFormData({
                firstName: profile.user?.firstName || '',
                lastName: profile.user?.lastName || '',
                whatsappNumber: profile.whatsappNumber || '',
                country: profile.country || '',
                city: profile.city || '',
            });
        }
        setIsEditing(false);
    };

    // Calculate profile completeness
    const calculateCompleteness = () => {
        if (!profile) return 0;
        const fields = [
            profile.user?.firstName,
            profile.user?.lastName,
            profile.whatsappNumber,
            profile.country,
            profile.city,
            profile.children?.length > 0,
        ];
        const filled = fields.filter(Boolean).length;
        return Math.round((filled / fields.length) * 100);
    };

    const completeness = calculateCompleteness();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-8" dir="rtl">
                <div className="max-w-4xl mx-auto">
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

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-8" dir="rtl">
                <div className="max-w-4xl mx-auto">
                    <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-red-100 border-r-4 border-r-red-500">
                        <CardContent className="p-8 text-center">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />
                            <p className="text-red-700 font-semibold">حدث خطأ في تحميل الملف الشخصي</p>
                            <Button variant="outline" className="mt-4" onClick={loadProfile}>
                                إعادة المحاولة
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const displayName = `${profile?.user?.firstName || ''} ${profile?.user?.lastName || ''}`.trim() || 'ولي أمر';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <header className="mb-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">الملف الشخصي</h1>
                            </div>
                            <p className="text-gray-600 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                <span>معلوماتك الشخصية</span>
                            </p>
                        </div>
                        {!isEditing ? (
                            <Button onClick={() => setIsEditing(true)} className="gap-2 bg-primary-700 hover:bg-primary-800">
                                <Edit2 className="w-4 h-4" />
                                تعديل الملف
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button onClick={handleSave} disabled={saving} className="gap-2 bg-success-600 hover:bg-success-700">
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </Button>
                                <Button onClick={handleCancel} variant="outline" disabled={saving} className="gap-2">
                                    <X className="w-4 h-4" />
                                    إلغاء
                                </Button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Profile Completeness Card */}
                {!isEditing && completeness < 100 && (
                    <Card className="border-warning-200 bg-gradient-to-br from-warning-50 to-orange-50 border-r-4 border-r-warning-500 shadow-md">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-warning-100 rounded-full flex items-center justify-center">
                                    <Shield className="w-7 h-7 text-warning-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-bold text-warning-800">اكتمال الملف الشخصي</p>
                                        <span className="text-warning-700 font-bold">{completeness}%</span>
                                    </div>
                                    <div className="w-full bg-warning-200 rounded-full h-2.5">
                                        <div
                                            className="bg-warning-500 h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${completeness}%` }}
                                        />
                                    </div>
                                    <p className="text-warning-700 text-sm mt-2">
                                        أكمل ملفك الشخصي لتحصل على تجربة أفضل
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Profile Header Card */}
                <Card className="border-none shadow-md bg-gradient-to-br from-primary-50 to-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-primary-100/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary-100/30 rounded-full translate-x-1/2 translate-y-1/2" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                                    <span className="text-3xl font-bold text-white">
                                        {displayName[0]?.toUpperCase() || 'و'}
                                    </span>
                                </div>
                                {completeness === 100 && (
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="text-center md:text-right flex-1">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{displayName}</h2>
                                <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                                    <Users className="w-4 h-4" />
                                    ولي أمر • {profile?.children?.length || 0} أبناء
                                </div>
                                {profile?.city && profile?.country && (
                                    <p className="text-gray-500 mt-2 flex items-center justify-center md:justify-start gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {profile.city}، {profile.country}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Information */}
                <Card className="border-none shadow-md">
                    <CardHeader className="border-b bg-gray-50/50">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-primary-600" />
                            </div>
                            المعلومات الشخصية
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 gap-5">
                            {/* First Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الأول</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData(f => ({ ...f, firstName: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        placeholder="الاسم الأول"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100">
                                        {profile?.user?.firstName || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">اسم العائلة</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData(f => ({ ...f, lastName: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        placeholder="اسم العائلة"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100">
                                        {profile?.user?.lastName || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>

                            {/* Phone (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    رقم الهاتف
                                </label>
                                <div className="p-3 bg-gray-100 rounded-xl text-gray-600 border border-gray-200">
                                    <span dir="ltr">{profile?.user?.phoneNumber || 'غير محدد'}</span>
                                </div>
                            </div>

                            {/* Email (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    البريد الإلكتروني
                                </label>
                                <div className="p-3 bg-gray-100 rounded-xl text-gray-600 border border-gray-200">
                                    {profile?.user?.email || 'غير محدد'}
                                </div>
                            </div>

                            {/* WhatsApp */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4 text-green-600" />
                                    رقم واتساب
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.whatsappNumber}
                                        onChange={(e) => setFormData(f => ({ ...f, whatsappNumber: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        placeholder="+249..."
                                        dir="ltr"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100" dir="ltr">
                                        {profile?.whatsappNumber || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>

                            {/* Country */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    الدولة
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData(f => ({ ...f, country: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        placeholder="السودان"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100">
                                        {profile?.country || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData(f => ({ ...f, city: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        placeholder="الخرطوم"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100">
                                        {profile?.city || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Children Summary */}
                <Card className="border-none shadow-md">
                    <CardHeader className="border-b bg-gray-50/50">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-lg">
                                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-4 h-4 text-success-600" />
                                </div>
                                الأبناء
                            </div>
                            <Link href="/parent/children">
                                <Button variant="outline" size="sm" className="gap-1">
                                    إدارة الأبناء
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {profile?.children && profile.children.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {profile.children.map(child => (
                                    <div key={child.id} className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all">
                                        <div className="w-12 h-12 bg-gradient-to-br from-success-100 to-success-50 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-success-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{child.name}</p>
                                            {child.gradeLevel && (
                                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <span className="w-1.5 h-1.5 bg-success-500 rounded-full"></span>
                                                    {child.gradeLevel}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 mb-3">لم تتم إضافة أبناء بعد</p>
                                <Link href="/parent/children">
                                    <Button className="gap-2 bg-success-600 hover:bg-success-700">
                                        <Users className="w-4 h-4" />
                                        إضافة ابن
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Save Actions (Mobile) */}
                {isEditing && (
                    <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
                        <div className="flex gap-2">
                            <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2 bg-success-600 hover:bg-success-700">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'جاري الحفظ...' : 'حفظ'}
                            </Button>
                            <Button onClick={handleCancel} variant="outline" disabled={saving} className="gap-2">
                                <X className="w-4 h-4" />
                                إلغاء
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
