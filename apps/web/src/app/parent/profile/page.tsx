'use client';

import { useState, useEffect } from 'react';
import { parentApi } from '@/lib/api/parent';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    User, Phone, Mail, MapPin, MessageCircle, Users,
    Edit2, Save, X, Loader2, ChevronLeft, AlertCircle, Shield, CheckCircle, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    const displayName = `${profile?.user?.firstName || ''} ${profile?.user?.lastName || ''}`.trim() || 'ولي أمر';
    const initials = displayName[0]?.toUpperCase() || 'و';

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-4 pt-20 flex items-center justify-center font-sans" dir="rtl">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-4 pt-20 flex items-center justify-center font-sans" dir="rtl">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">فشل في تحميل البيانات</p>
                    <Button onClick={loadProfile} variant="outline">إعادة المحاولة</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans" dir="rtl">
            <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-4 md:space-y-6 pb-24 md:pb-8">

                {/* 1. Page Title */}
                <div className="mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">الملف الشخصي</h1>
                    <p className="text-gray-500 text-sm">إدارة معلوماتك الشخصية وبيانات التواصل</p>
                </div>

                {/* 2. Profile Header (Avatar + Name) */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center text-center gap-4">
                            <div className="relative">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold ring-4 ring-white shadow-sm">
                                    {initials}
                                </div>
                                {completeness === 100 && (
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{displayName}</h2>
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                    {profile?.city && profile?.country ? (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {profile.city}، {profile.country}
                                        </span>
                                    ) : (
                                        <span>لم يتم تحديد الموقع</span>
                                    )}
                                </div>
                            </div>

                            {/* 3. Edit CTA */}
                            {!isEditing && (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    variant="outline"
                                    className="mt-2 w-full md:w-auto min-w-[140px] h-9 text-sm gap-2 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    تعديل الملف
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Profile Completion (Secondary) */}
                {!isEditing && completeness < 100 && (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-sm font-bold text-orange-900">الملف مكتمل بنسبة {completeness}%</p>
                            </div>
                            <div className="w-full bg-orange-200 rounded-full h-1.5 mb-1">
                                <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${completeness}%` }} />
                            </div>
                            <p className="text-xs text-orange-700">أكمل بياناتك لتحصل على تجربة أفضل</p>
                        </div>
                    </div>
                )}

                {/* 5. Personal Information Form */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="border-b border-gray-100 bg-white px-6 py-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                            <User className="w-4 h-4 text-primary-600" />
                            البيانات الشخصية
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">

                        {/* Section: Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">المعلومات الأساسية</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">الاسم الأول</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData(f => ({ ...f, firstName: e.target.value }))}
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all"
                                            placeholder="أدخل الاسم الأول"
                                        />
                                    ) : (
                                        <div className="p-2.5 bg-gray-50 border border-transparent rounded-lg text-sm text-gray-900">
                                            {profile?.user.firstName || <span className="text-gray-400 italic">غير محدد</span>}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">اسم العائلة</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData(f => ({ ...f, lastName: e.target.value }))}
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all"
                                            placeholder="أدخل اسم العائلة"
                                        />
                                    ) : (
                                        <div className="p-2.5 bg-gray-50 border border-transparent rounded-lg text-sm text-gray-900">
                                            {profile?.user.lastName || <span className="text-gray-400 italic">غير محدد</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Section: Contact */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">معلومات التواصل</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        رقم الهاتف
                                    </label>
                                    <div className="p-2.5 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-100 cursor-not-allowed">
                                        <span dir="ltr">{profile?.user?.phoneNumber || 'غير محدد'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        البريد الإلكتروني
                                    </label>
                                    <div className="p-2.5 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-100 cursor-not-allowed">
                                        {profile?.user?.email || 'غير محدد'}
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                        <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                                        رقم الواتساب <span className="text-xs text-gray-400 font-normal">(للتواصل السريع)</span>
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.whatsappNumber}
                                            onChange={(e) => setFormData(f => ({ ...f, whatsappNumber: e.target.value }))}
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all"
                                            placeholder="+966..."
                                            dir="ltr"
                                        />
                                    ) : (
                                        <div className="p-2.5 bg-gray-50 border border-transparent rounded-lg text-sm text-gray-900" dir="ltr">
                                            {profile?.whatsappNumber || <span className="text-gray-400 italic">غير محدد</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Section: Location */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">الموقع</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">الدولة</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData(f => ({ ...f, country: e.target.value }))}
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all"
                                            placeholder="السعودية"
                                        />
                                    ) : (
                                        <div className="p-2.5 bg-gray-50 border border-transparent rounded-lg text-sm text-gray-900">
                                            {profile?.country || <span className="text-gray-400 italic">غير محدد</span>}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">المدينة</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData(f => ({ ...f, city: e.target.value }))}
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all"
                                            placeholder="الرياض"
                                        />
                                    ) : (
                                        <div className="p-2.5 bg-gray-50 border border-transparent rounded-lg text-sm text-gray-900">
                                            {profile?.city || <span className="text-gray-400 italic">غير محدد</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* 6. Children Section (Visual Separation) */}
                <div className="pt-4">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-500" />
                            الأبناء
                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{profile?.children?.length || 0}</span>
                        </h2>
                        <Link href="/parent/children">
                            <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 h-8 text-xs font-bold gap-1">
                                إدارة الأبناء <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>

                    {profile?.children && profile.children.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {profile.children.map(child => (
                                <Link key={child.id} href={`/parent/children/${child.id}`} className="block">
                                    <Card className="border-none shadow-sm hover:shadow-md transition-all hover:bg-gray-50">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold text-lg">
                                                {child.name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-900">{child.name}</div>
                                                <div className="text-xs text-gray-500">{child.gradeLevel || 'غير محدد'}</div>
                                            </div>
                                            <ChevronLeft className="w-4 h-4 text-gray-300" />
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Users className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-500 mb-4">لم تضف أي أبناء بعد</p>
                            <Link href="/parent/children">
                                <Button size="sm" variant="outline">إضافة ابن</Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Sticky Mobile Actions (Save/Cancel) */}
                {isEditing && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-50 md:hidden pb-safe">
                        <div className="flex gap-3">
                            <Button onClick={handleCancel} variant="outline" disabled={saving} className="flex-1 h-11 border-gray-200 text-gray-700">
                                إلغاء
                            </Button>
                            <Button onClick={handleSave} disabled={saving} className="flex-[2] h-11 bg-primary-600 hover:bg-primary-700 text-white shadow-sm font-bold">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
