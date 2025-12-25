'use client';

import { useState, useEffect } from 'react';
import { parentApi } from '@/lib/api/parent';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    User, Phone, Mail, MapPin, MessageCircle, Users,
    Edit2, Save, X, Loader2, ChevronLeft
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
        } catch (error) {
            console.error('Failed to load profile', error);
            toast.error('فشل تحميل الملف الشخصي');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await parentApi.updateProfile(formData);
            // Update auth context so sidebar shows new name immediately
            updateUser({ firstName: formData.firstName, lastName: formData.lastName });
            toast.success('تم حفظ التغييرات بنجاح ✓');
            setIsEditing(false);
            await loadProfile();
        } catch (error) {
            console.error('Failed to save profile', error);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-600" />
                            <p className="text-gray-500">جاري التحميل...</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">الملف الشخصي 👤</h1>
                        <p className="text-gray-600 mt-1">معلوماتك الشخصية</p>
                    </div>
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} variant="outline">
                            <Edit2 className="w-4 h-4 ml-2" />
                            تعديل
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 ml-2" />
                                )}
                                {saving ? 'جاري الحفظ...' : 'حفظ'}
                            </Button>
                            <Button onClick={handleCancel} variant="outline" disabled={saving}>
                                <X className="w-4 h-4 ml-2" />
                                إلغاء
                            </Button>
                        </div>
                    )}
                </div>

                {/* Personal Information */}
                <Card className="border-r-4 border-r-primary-600">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-600" />
                            المعلومات الشخصية
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* First Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأول</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData(f => ({ ...f, firstName: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="الاسم الأول"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                                        {profile?.user?.firstName || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم العائلة</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData(f => ({ ...f, lastName: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="اسم العائلة"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                                        {profile?.user?.lastName || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>

                            {/* Phone (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="w-4 h-4 inline ml-1" />
                                    رقم الهاتف
                                </label>
                                <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                                    {profile?.user?.phoneNumber || 'غير محدد'}
                                </div>
                            </div>

                            {/* Email (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail className="w-4 h-4 inline ml-1" />
                                    البريد الإلكتروني
                                </label>
                                <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                                    {profile?.user?.email || 'غير محدد'}
                                </div>
                            </div>

                            {/* WhatsApp */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <MessageCircle className="w-4 h-4 inline ml-1" />
                                    رقم واتساب
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.whatsappNumber}
                                        onChange={(e) => setFormData(f => ({ ...f, whatsappNumber: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="+249..."
                                        dir="ltr"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900" dir="ltr">
                                        {profile?.whatsappNumber || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>

                            {/* Country */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <MapPin className="w-4 h-4 inline ml-1" />
                                    الدولة
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData(f => ({ ...f, country: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="السودان"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                                        {profile?.country || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData(f => ({ ...f, city: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="الخرطوم"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                                        {profile?.city || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Children Summary */}
                <Card className="border-r-4 border-r-success-600">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-success-600" />
                                الأبناء
                            </div>
                            <Link href="/parent/children">
                                <Button variant="outline" size="sm">
                                    إدارة الأبناء
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                </Button>
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profile?.children && profile.children.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-3">
                                {profile.children.map(child => (
                                    <div key={child.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-success-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{child.name}</p>
                                            {child.gradeLevel && (
                                                <p className="text-sm text-gray-500">{child.gradeLevel}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                <p>لم تتم إضافة أبناء بعد</p>
                                <Link href="/parent/children">
                                    <Button variant="outline" size="sm" className="mt-3">
                                        إضافة ابن
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
