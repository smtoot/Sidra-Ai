'use client';

import { useState, useEffect, useCallback } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import { walletApi } from '@/lib/api/wallet';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useTeacherApplicationStatus } from '@/hooks/useTeacherApplicationStatus';
import { ResponsiveSidebar } from '@/components/teacher/profile-hub/ResponsiveSidebar';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { ProfileSection } from '@/components/teacher/profile-hub/ProfileSection';
import { ProfileBasicsSection } from '@/components/teacher/profile-hub/sections/ProfileBasicsSection';
import { QualificationsSection } from '@/components/teacher/profile-hub/sections/QualificationsSection';
import { TeacherDocumentUpload } from '@/components/teacher/TeacherDocumentUpload';
import { IdVerificationSection } from '@/components/teacher/shared';
import { SubjectsManager } from '@/components/teacher/profile-hub/sections/SubjectsManager';
import { TeachingApproachSection } from '@/components/teacher/profile-hub/sections/TeachingApproachSection';
import { TeachingPoliciesSection } from '@/components/teacher/profile-hub/sections/TeachingPoliciesSection';
import { ProfilePreviewPage } from '@/components/teacher/profile-hub/ProfilePreviewModal';
import { PersonalInfoSection } from '@/components/teacher/profile-hub/sections/PersonalInfoSection';
import { NewTeacherWelcomeBanner } from '@/components/teacher/profile-hub/NewTeacherWelcomeBanner';
import { toast } from 'sonner';
import { Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplicationStatusBanner } from '@/components/teacher/ApplicationStatusBanner';

export default function ProfileHubPage() {
    const { isApproved, isChangesRequested, loading: loadingStatus } = useTeacherApplicationStatus();
    const [profile, setProfile] = useState<any>(null);
    const [walletData, setWalletData] = useState<{ hasBankInfo: boolean }>({ hasBankInfo: false });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('profile');
    const [showPreview, setShowPreview] = useState(false);
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

    const { percentage, items } = useProfileCompletion(profile, walletData);

    // Allow editing if approved or changes requested
    const isReadOnly = !loadingStatus && !isApproved && !isChangesRequested;

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            const data = await teacherApi.getProfile();
            setProfile(data);

            // Also fetch wallet data for bank info status
            try {
                const wallet = await walletApi.getMyBalance();
                setWalletData({ hasBankInfo: Boolean(wallet.bankInfo) });
            } catch {
                // Wallet fetch might fail for non-approved teachers
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            toast.error('فشل تحميل الملف الشخصي');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // Refresh wallet data when bank section is visited (for real-time updates)
    const refreshWalletData = useCallback(async () => {
        try {
            const wallet = await walletApi.getMyBalance();
            setWalletData({ hasBankInfo: Boolean(wallet.bankInfo) });
        } catch {
            // Ignore
        }
    }, []);

    const handleUpdateProfile = (updates: any) => {
        setProfile((prev: any) => ({ ...prev, ...updates }));
    };

    const handleSaveSection = async (sectionId: string) => {
        // Validation for Documents section
        if (sectionId === 'documents') {
            if (!profile.idType || !profile.idNumber || !profile.idImageUrl) {
                toast.error('الرجاء إكمال جميع حقول الهوية');
                return;
            }
        }

        setSaving(true);



        try {
            // Sanitize slug (remove leading/trailing hyphens)
            const cleanSlug = profile.slug ? profile.slug.replace(/^-+|-+$/g, '') : undefined;

            await teacherApi.updateProfile({
                displayName: profile.displayName,
                slug: cleanSlug,
                bio: profile.bio,
                profilePhotoUrl: profile.profilePhotoUrl,
                introVideoUrl: profile.introVideoUrl,
                // REMOVED: education field - qualifications managed separately
                yearsOfExperience: Number(profile.yearsOfExperience) || 0,
                gender: profile.gender || undefined,

                // Personal Info (Check root first (if edited), then nested user object)
                firstName: profile.firstName ?? profile.user?.firstName,
                lastName: profile.lastName ?? profile.user?.lastName,
                city: profile.city,
                country: profile.country,
                whatsappNumber: profile.whatsappNumber,
                dateOfBirth: profile.dateOfBirth,

                // ID Fields
                idType: profile.idType || undefined,
                idNumber: profile.idNumber || undefined,
                idImageUrl: profile.idImageUrl || undefined,
            });
            toast.success('تم حفظ التغييرات');
        } catch (error) {
            console.error('Failed to save:', error);
            toast.error('فشل حفظ التغييرات');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTeachingApproach = async () => {
        setSaving(true);
        try {
            await teacherApi.updateTeachingApproach({
                teachingStyle: profile.teachingStyle,
                tagIds: profile.teachingTagIds || profile.teachingTags?.map((t: any) => t.tagId) || []
            });
            toast.success('تم حفظ أسلوب التدريس');
        } catch (error) {
            console.error('Failed to save teaching approach:', error);
            toast.error('فشل حفظ أسلوب التدريس');
        } finally {
            setSaving(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-tajawal rtl p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <header className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary mb-2">ملفي الشخصي</h1>
                        <p className="text-text-subtle">أكمل بياناتك لتظهر بأفضل صورة للطلاب وأولياء الأمور</p>
                    </div>
                    {/* Only show preview when profile is at least 35% complete (profile basics done) */}
                    {percentage >= 35 ? (
                        <Button
                            variant="outline"
                            onClick={() => setShowPreview(true)}
                            className="gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            معاينة الملف
                        </Button>
                    ) : (
                        <div className="text-xs text-gray-400 text-left max-w-[200px]">
                            <p className="font-medium text-gray-500">معاينة الملف</p>
                            <p>أكمل البروفايل أولاً لتتمكن من معاينة ملفك</p>
                        </div>
                    )}
                </header>

                {/* Welcome Banner for Newly Approved Teachers */}
                {isApproved && showWelcomeBanner && (
                    <NewTeacherWelcomeBanner
                        displayName={profile?.displayName}
                        hasAvailability={(profile?.availability?.length || 0) > 0}
                        hasBankInfo={walletData.hasBankInfo}
                        hasMeetingLink={Boolean(profile?.meetingLink || profile?.encryptedMeetingLink)}
                        onDismiss={() => setShowWelcomeBanner(false)}
                    />
                )}

                {/* Application Status Banner (for non-approved states) */}
                {!isApproved && (
                    <div className="mb-6">
                        <ApplicationStatusBanner />
                    </div>
                )}

                {/* Main Layout */}
                <div className="flex gap-6 relative">
                    {/* Responsive Sidebar - Hide percentage before approval */}
                    <ResponsiveSidebar
                        percentage={isApproved ? percentage : 0}
                        items={items}
                        activeSection={activeSection}
                        onSectionClick={setActiveSection}
                        showPercentage={isApproved}
                    />

                    {/* Content Area */}
                    <div className="flex-1 space-y-6 pb-24 lg:pb-0">
                        {/* Profile Basics */}
                        {activeSection === 'profile' && (
                            <ProfileSection
                                id="profile"
                                title="البروفايل"
                                isLocked={false}
                                isSaving={saving}
                                onSave={() => handleSaveSection('profile')}
                            >
                                <ProfileBasicsSection
                                    displayName={profile?.displayName || ''}
                                    bio={profile?.bio || ''}
                                    profilePhotoUrl={profile?.profilePhotoUrl}
                                    introVideoUrl={profile?.introVideoUrl}
                                    isReadOnly={isReadOnly}
                                    onUpdate={handleUpdateProfile}
                                />
                            </ProfileSection>
                        )}

                        {/* Personal Information */}
                        {activeSection === 'personal-info' && (
                            <ProfileSection
                                id="personal-info"
                                title="المعلومات الشخصية"
                                isLocked={false}
                                isSaving={saving}
                                onSave={() => handleSaveSection('personal-info')}
                            >
                                <PersonalInfoSection
                                    firstName={profile?.firstName ?? profile?.user?.firstName ?? ''}
                                    lastName={profile?.lastName ?? profile?.user?.lastName ?? ''}
                                    displayName={profile?.displayName || ''}
                                    slug={profile?.slug} // Pass slug
                                    phoneNumber={profile?.user?.phoneNumber} // From user registration
                                    whatsappNumber={profile?.whatsappNumber || ''}
                                    city={profile?.city || ''}
                                    country={profile?.country || ''}
                                    dateOfBirth={profile?.dateOfBirth || ''}
                                    isReadOnly={isReadOnly}
                                    onUpdate={handleUpdateProfile}
                                />
                            </ProfileSection>
                        )}

                        {/* Qualifications */}
                        {activeSection === 'qualifications' && (
                            <ProfileSection
                                id="qualifications"
                                title="المؤهلات والخبرات"
                                isLocked={false}
                                isSaving={saving}
                                onSave={() => handleSaveSection('qualifications')}
                            >
                                <QualificationsSection
                                    yearsOfExperience={profile?.yearsOfExperience || 0}
                                    gender={profile?.gender}
                                    isReadOnly={isReadOnly}
                                    onUpdate={handleUpdateProfile}
                                />
                            </ProfileSection>
                        )}

                        {/* Teaching Approach */}
                        {activeSection === 'teaching-approach' && (
                            <ProfileSection
                                id="teaching-approach"
                                title="أسلوب التدريس"
                                isLocked={false}
                                isSaving={saving}
                                onSave={handleSaveTeachingApproach}
                            >
                                <TeachingApproachSection
                                    teachingStyle={profile?.teachingStyle || ''}
                                    currentTags={profile?.teachingTagIds || profile?.teachingTags?.map((t: any) => t.tagId) || []}
                                    isReadOnly={isReadOnly}
                                    onUpdate={handleUpdateProfile}
                                />
                            </ProfileSection>
                        )}

                        {/* Subjects */}
                        {activeSection === 'subjects' && (
                            <ProfileSection
                                id="subjects"
                                title="المواد والتسعيرة"
                                isLocked={false}
                            >
                                <SubjectsManager isReadOnly={isReadOnly} />
                            </ProfileSection>
                        )}

                        {/* Documents/ID Verification - Read-only after onboarding */}
                        {activeSection === 'documents' && (
                            <ProfileSection
                                id="documents"
                                title="تأكيد الهوية"
                                isLocked={false}
                            >
                                {/* Show info message if ID verification is complete */}
                                {profile?.idType && profile?.idNumber && profile?.idImageUrl && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
                                        <p className="font-medium">✓ تم التحقق من هويتك</p>
                                        <p className="text-green-600 mt-1">
                                            تأكيد الهوية هو إجراء لمرة واحدة. إذا كنت بحاجة لتحديث بياناتك، يرجى التواصل مع الدعم.
                                        </p>
                                    </div>
                                )}
                                <IdVerificationSection
                                    idType={profile?.idType}
                                    idNumber={profile?.idNumber || ''}
                                    idImageUrl={profile?.idImageUrl}
                                    onChange={handleUpdateProfile}
                                    disabled={Boolean(profile?.idType && profile?.idNumber && profile?.idImageUrl)}
                                />
                            </ProfileSection>
                        )}

                        {/* Availability - Links to full page with all features */}
                        {activeSection === 'availability' && (
                            <ProfileSection
                                id="availability"
                                title="الأوقات المتاحة"
                                isLocked={false}
                            >
                                <div className="space-y-4">
                                    <p className="text-gray-600">
                                        إدارة مواعيدك الأسبوعية والأيام المحظورة (الإجازات، المناسبات) من صفحة المواعيد الكاملة.
                                    </p>
                                    <a
                                        href="/teacher/availability"
                                        className="inline-flex items-center gap-2 bg-primary px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors"
                                        style={{ color: 'white' }}
                                    >
                                        <span>إدارة المواعيد</span>
                                        <span>←</span>
                                    </a>
                                </div>
                            </ProfileSection>
                        )}

                        {/* Note: Bank info section removed - managed in Wallet page only */}

                        {/* Teaching Options */}
                        {activeSection === 'policies' && (
                            <ProfileSection
                                id="policies"
                                title="خيارات التدريس"
                                isLocked={false}
                            >
                                <TeachingPoliciesSection isReadOnly={false} />
                            </ProfileSection>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Preview Page */}
            <ProfilePreviewPage
                open={showPreview}
                onClose={() => setShowPreview(false)}
                profile={profile || {}}
            />
        </div>
    );
}
