'use client';

import { useState, useEffect } from 'react';
import { studentApi, Curriculum } from '@/lib/api/student';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    User, Phone, Mail, MapPin, MessageCircle, BookOpen,
    Edit2, Save, X, Loader2, GraduationCap, FileText, Camera,
    AlertCircle, CheckCircle, Shield, School
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
    schoolName?: string;
    curriculumId?: string;
    curriculum?: Curriculum;
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
        gradeLevel: '',
        bio: '',
        profilePhotoUrl: '',
        schoolName: '',
        curriculumId: '',
    });

    // Curricula list
    const [curricula, setCurricula] = useState<Curriculum[]>([]);

    useEffect(() => {
        loadProfile();
        loadCurricula();
    }, []);

    const loadCurricula = async () => {
        try {
            const data = await studentApi.getCurricula();
            setCurricula(data);
        } catch (err) {
            console.error('Failed to load curricula', err);
        }
    };

    const loadProfile = async () => {
        setLoading(true);
        setError(false);
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
                schoolName: data.schoolName || '',
                curriculumId: data.curriculumId || '',
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
            await studentApi.updateProfile(formData);
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
                gradeLevel: profile.gradeLevel || '',
                bio: profile.bio || '',
                profilePhotoUrl: profile.profilePhotoUrl || '',
                schoolName: profile.schoolName || '',
                curriculumId: profile.curriculumId || '',
            });
        }
        setIsEditing(false);
    };

    const handlePhotoChange = (url: string | null) => {
        setFormData(f => ({ ...f, profilePhotoUrl: url || '' }));
    };

    // Calculate profile completeness
    const calculateCompleteness = () => {
        if (!profile) return 0;
        const fields = [
            profile.user?.firstName,
            profile.user?.lastName,
            profile.profilePhotoUrl,
            profile.gradeLevel,
            profile.whatsappNumber,
            profile.country,
            profile.city,
            profile.bio,
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

    const displayName = `${profile?.user?.firstName || ''} ${profile?.user?.lastName || ''}`.trim() || 'طالب';

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
                                <span>معلوماتك الشخصية والتعليمية</span>
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
                                        أكمل ملفك الشخصي لتحصل على تجربة أفضل مع المعلمين
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Profile Header Card with Photo */}
                <Card className="border-none shadow-md bg-gradient-to-br from-primary-50 to-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-primary-100/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary-100/30 rounded-full translate-x-1/2 translate-y-1/2" />
                    <CardContent className="p-6 relative z-10">
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
                                <div className="relative">
                                    <Avatar
                                        src={profile?.profilePhotoUrl ? getFileUrl(profile.profilePhotoUrl) : undefined}
                                        fallback={displayName[0]?.toUpperCase() || 'ط'}
                                        size="xl"
                                        className="ring-4 ring-white shadow-lg"
                                    />
                                    {profile?.profilePhotoUrl && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="text-center md:text-right flex-1">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{displayName}</h2>
                                {profile?.gradeLevel && (
                                    <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                                        <GraduationCap className="w-4 h-4" />
                                        {profile.gradeLevel}
                                    </div>
                                )}
                                {profile?.city && profile?.country && (
                                    <p className="text-gray-500 mt-2 flex items-center justify-center md:justify-start gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {profile.city}، {profile.country}
                                    </p>
                                )}
                                {!isEditing && !profile?.profilePhotoUrl && (
                                    <p className="text-sm text-gray-400 mt-3 flex items-center justify-center md:justify-start gap-1">
                                        <Camera className="w-4 h-4" />
                                        أضف صورة شخصية لتعريف المعلمين بك
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
                                    <div
                                        className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => setIsEditing(true)}
                                    >
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
                                    <div
                                        className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => setIsEditing(true)}
                                    >
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
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4 text-green-600" />
                                    رقم واتساب
                                </label>
                                {isEditing ? (
                                    <>
                                        <input
                                            type="text"
                                            value={formData.whatsappNumber}
                                            onChange={(e) => setFormData(f => ({ ...f, whatsappNumber: e.target.value }))}
                                            className="w-full md:w-1/2 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                            placeholder="+249..."
                                            dir="ltr"
                                        />
                                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                            <MessageCircle className="w-3 h-3" />
                                            رقم الواتساب مهم جداً للتواصل السريع مع الإدارة والمعلمين
                                        </p>
                                    </>
                                ) : (
                                    <div
                                        className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100 w-full md:w-1/2 cursor-pointer hover:bg-gray-100 transition-colors"
                                        dir="ltr"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        {profile?.whatsappNumber || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>

                            {/* Country of Residence & City - Same Row */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    بلد الإقامة
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
                                    <div
                                        className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => setIsEditing(true)}
                                    >
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
                                    <div
                                        className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        {profile?.city || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Educational Information */}
                <Card className="border-none shadow-md">
                    <CardHeader className="border-b bg-gray-50/50">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-success-600" />
                            </div>
                            المعلومات التعليمية
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                            {/* Grade Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <BookOpen className="w-4 h-4 text-success-600" />
                                    المرحلة الدراسية
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.gradeLevel}
                                        onChange={(e) => setFormData(f => ({ ...f, gradeLevel: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                                        disabled={!formData.curriculumId}
                                    >
                                        <option value="">اختر المرحلة...</option>
                                        {formData.curriculumId && curricula
                                            .find(c => c.id === formData.curriculumId)
                                            ?.stages?.sort((a: any, b: any) => a.sequence - b.sequence)
                                            .map((stage: any) => (
                                                <optgroup key={stage.id} label={stage.nameAr}>
                                                    {stage.grades
                                                        .sort((a: any, b: any) => a.sequence - b.sequence)
                                                        .map((grade: any) => (
                                                            <option key={grade.id} value={grade.nameAr}>
                                                                {grade.nameAr}
                                                            </option>
                                                        ))}
                                                </optgroup>
                                            ))}
                                    </select>
                                ) : (
                                    <div
                                        className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        {profile?.gradeLevel || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>

                            {/* School Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <School className="w-4 h-4 text-success-600" />
                                    اسم المدرسة
                                    <span className="text-gray-400 text-xs">(اختياري)</span>
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.schoolName}
                                        onChange={(e) => setFormData(f => ({ ...f, schoolName: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        placeholder="مثال: مدرسة الخرطوم النموذجية"
                                    />
                                ) : (
                                    <div
                                        className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        {profile?.schoolName || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>

                            {/* Curriculum */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <BookOpen className="w-4 h-4 text-success-600" />
                                    المنهج الدراسي
                                    <span className="text-gray-400 text-xs">(اختياري)</span>
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.curriculumId}
                                        onChange={(e) => setFormData(f => ({ ...f, curriculumId: e.target.value }))}
                                        className="w-full md:w-1/2 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                                    >
                                        <option value="">اختر المنهج...</option>
                                        {curricula.map((c) => (
                                            <option key={c.id} value={c.id}>{c.nameAr}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div
                                        className="p-3 bg-gray-50 rounded-xl text-gray-900 border border-gray-100 w-full md:w-1/2 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        {profile?.curriculum?.nameAr || <span className="text-gray-400">غير محدد</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <FileText className="w-4 h-4 text-gray-500" />
                                نبذة عني
                            </label>
                            {isEditing ? (
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData(f => ({ ...f, bio: e.target.value }))}
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px] resize-none transition-all"
                                    placeholder="اكتب نبذة مختصرة عنك واهتماماتك الدراسية..."
                                    maxLength={500}
                                />
                            ) : (
                                <div
                                    className="p-4 bg-gray-50 rounded-xl text-gray-900 min-h-[80px] border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => setIsEditing(true)}
                                >
                                    {profile?.bio || <span className="text-gray-400">لم تتم إضافة نبذة بعد. أضف نبذة لتعريف المعلمين بك واهتماماتك الدراسية.</span>}
                                </div>
                            )}
                            {isEditing && (
                                <p className="text-xs text-gray-400 mt-1 text-left" dir="ltr">
                                    {formData.bio.length}/500
                                </p>
                            )}
                        </div>
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
