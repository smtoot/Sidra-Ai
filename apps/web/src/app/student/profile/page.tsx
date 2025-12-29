'use client';

import { useState, useEffect } from 'react';
import { studentApi } from '@/lib/api/student';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    User, Phone, Mail, MapPin, MessageCircle, BookOpen,
    Edit2, Save, X, Loader2, GraduationCap, FileText, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { PhotoUploadField } from '@/components/teacher/shared/PhotoUploadField';
import { Avatar } from '@/components/ui/avatar';
import { getFileUrl } from '@/lib/api/upload';

interface StudentProfile {
    id: string;
    userId: string;
    gradeLevel?: string;
    bio?: string;
    whatsappNumber?: string;
    city?: string;
    country?: string;
    profilePhotoUrl?: string;
    user: {
        id: string;
        email?: string;
        phoneNumber?: string;
        firstName?: string;
        lastName?: string;
    };
}

export default function StudentProfilePage() {
    const { updateUser } = useAuth();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
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
        gradeLevel: '',
        bio: '',
        profilePhotoUrl: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await studentApi.getProfile();
            setProfile(data);
            setFormData({
                firstName: data.user?.firstName || '',
                lastName: data.user?.lastName || '',
                whatsappNumber: data.whatsappNumber || '',
                country: data.country || '',
                city: data.city || '',
                gradeLevel: data.gradeLevel || '',
                bio: data.bio || '',
                profilePhotoUrl: data.profilePhotoUrl || '',
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
            await studentApi.updateProfile(formData);
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
                gradeLevel: profile.gradeLevel || '',
                bio: profile.bio || '',
                profilePhotoUrl: profile.profilePhotoUrl || '',
            });
        }
        setIsEditing(false);
    };

    const handlePhotoChange = (url: string | null) => {
        setFormData(f => ({ ...f, profilePhotoUrl: url || '' }));
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

    const displayName = `${profile?.user?.firstName || ''} ${profile?.user?.lastName || ''}`.trim() || 'طالب';

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">الملف الشخصي 👤</h1>
                        <p className="text-gray-600 mt-1">معلوماتك الشخصية والتعليمية</p>
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

                {/* Profile Photo Section */}
                <Card className="border-r-4 border-r-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="w-5 h-5 text-blue-500" />
                            الصورة الشخصية
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {isEditing ? (
                                <PhotoUploadField
                                    value={formData.profilePhotoUrl || null}
                                    onChange={handlePhotoChange}
                                    disabled={saving}
                                    size="lg"
                                    folder="profile-photos"
                                />
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        src={profile?.profilePhotoUrl ? getFileUrl(profile.profilePhotoUrl) : undefined}
                                        fallback={displayName[0]?.toUpperCase() || 'ط'}
                                        size="xl"
                                    />
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{displayName}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {profile?.gradeLevel || 'لم يتم تحديد المرحلة الدراسية'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!isEditing && !profile?.profilePhotoUrl && (
                            <p className="text-sm text-gray-400 mt-4">
                                💡 أضف صورة شخصية لتعريف المعلمين بك
                            </p>
                        )}
                    </CardContent>
                </Card>

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

                {/* Educational Information */}
                <Card className="border-r-4 border-r-success-600">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-success-600" />
                            المعلومات التعليمية
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Grade Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <BookOpen className="w-4 h-4 inline ml-1" />
                                    المرحلة الدراسية
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.gradeLevel}
                                        onChange={(e) => setFormData(f => ({ ...f, gradeLevel: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="">اختر المرحلة...</option>
                                        <option value="ابتدائي 1">ابتدائي 1</option>
                                        <option value="ابتدائي 2">ابتدائي 2</option>
                                        <option value="ابتدائي 3">ابتدائي 3</option>
                                        <option value="ابتدائي 4">ابتدائي 4</option>
                                        <option value="ابتدائي 5">ابتدائي 5</option>
                                        <option value="ابتدائي 6">ابتدائي 6</option>
                                        <option value="متوسط 1">متوسط 1</option>
                                        <option value="متوسط 2">متوسط 2</option>
                                        <option value="متوسط 3">متوسط 3</option>
                                        <option value="ثانوي 1">ثانوي 1</option>
                                        <option value="ثانوي 2">ثانوي 2</option>
                                        <option value="ثانوي 3">ثانوي 3</option>
                                        <option value="جامعي">جامعي</option>
                                        <option value="دراسات عليا">دراسات عليا</option>
                                    </select>
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                                        {profile?.gradeLevel || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FileText className="w-4 h-4 inline ml-1" />
                                نبذة عني
                            </label>
                            {isEditing ? (
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData(f => ({ ...f, bio: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px] resize-none"
                                    placeholder="اكتب نبذة مختصرة عنك..."
                                />
                            ) : (
                                <div className="p-3 bg-gray-50 rounded-lg text-gray-900 min-h-[60px]">
                                    {profile?.bio || <span className="text-gray-400">لم تتم إضافة نبذة بعد</span>}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
