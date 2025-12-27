'use client';

import { useMemo } from 'react';
import { useTeacherApplicationStatus } from './useTeacherApplicationStatus';

interface ProfileData {
    displayName?: string;
    bio?: string;
    profilePhotoUrl?: string;
    introVideoUrl?: string;
    education?: string;
    yearsOfExperience?: number;
    gender?: string;
    subjects?: any[];
    documents?: any[];
    bankInfo?: any;
    meetingLink?: string;
    encryptedMeetingLink?: string;  // Backend stores meeting link encrypted
    availability?: any[];
    // Personal/Contact info fields
    fullName?: string;
    whatsappNumber?: string;
    city?: string;
    country?: string;
    dateOfBirth?: string;
    teachingStyle?: string;
    teachingTags?: any[];
    // ID Verification fields
    idType?: string;
    idNumber?: string;
    idImageUrl?: string;
}

interface CompletionItem {
    id: string;
    nameAr: string;
    nameEn: string;
    isComplete: boolean;
    isLocked: boolean;
    weight: number;
}

interface ProfileCompletionResult {
    percentage: number;
    items: CompletionItem[];
    isFullyComplete: boolean;
}

interface WalletData {
    hasBankInfo?: boolean;
}

/**
 * Hook to calculate profile completion percentage and status of each section.
 * Some sections are only counted after admin approval.
 */
export function useProfileCompletion(
    profile: ProfileData | null,
    walletData?: WalletData
): ProfileCompletionResult {
    const { isApproved } = useTeacherApplicationStatus();

    const items = useMemo(() => {
        // Always show section structure, even if profile is null
        // This ensures sidebar navigation is visible during loading or auth errors
        const p = profile || {};

        const wordCount = (text?: string) => (text?.trim().split(/\s+/).filter(Boolean).length || 0);

        // Pre-Approval items (always counted)
        const preApprovalItems: CompletionItem[] = [
            {
                id: 'profile',
                nameAr: 'البروفايل',
                nameEn: 'Profile',
                // Profile complete if: displayName + photo + bio (10+ words minimum)
                isComplete: Boolean(p.displayName && p.profilePhotoUrl && wordCount(p.bio) >= 10),
                isLocked: false,
                weight: 25,  // Reduced since we added personal info section
            },
            {
                id: 'personal-info',
                nameAr: 'المعلومات الشخصية',
                nameEn: 'Personal Info',
                // Complete if: fullName is provided
                isComplete: Boolean(p.fullName),
                isLocked: false,
                weight: 10,
            },
            {
                id: 'qualifications',
                nameAr: 'المؤهلات والخبرات',
                nameEn: 'Qualifications',
                // yearsOfExperience can be 0, so check for undefined/null explicitly
                isComplete: Boolean(
                    p.education &&
                    p.yearsOfExperience !== undefined &&
                    p.yearsOfExperience !== null &&
                    p.gender
                ),
                isLocked: false,
                weight: 15,
            },
            {
                id: 'teaching-approach',
                nameAr: 'أسلوب التدريس',
                nameEn: 'Teaching Approach',
                isComplete: Boolean(p.teachingStyle || (p.teachingTags && p.teachingTags.length > 0)),
                isLocked: false,
                weight: 5,
            },
            {
                id: 'subjects',
                nameAr: 'المواد والتسعيرة',
                nameEn: 'Subjects & Pricing',
                isComplete: (p.subjects?.length || 0) > 0,
                isLocked: false,
                weight: 20,
            },
            {
                id: 'documents',
                nameAr: 'تأكيد الهوية',
                nameEn: 'Identity Verification',
                // ID verification is complete if idType, idNumber, and idImageUrl are all provided
                isComplete: Boolean(p.idType && p.idNumber && p.idImageUrl),
                isLocked: false,
                weight: 15,
            },
        ];

        // Post-Approval items (only counted and unlocked after approval)
        // Note: Bank info removed from Profile Hub - managed in Wallet page only
        const postApprovalItems: CompletionItem[] = [
            {
                id: 'availability',
                nameAr: 'الأوقات المتاحة',
                nameEn: 'Availability',
                isComplete: isApproved && (p.availability?.length || 0) > 0,
                isLocked: !isApproved,
                weight: 10,  // Increased from 5% to 10%
            },
            {
                id: 'policies',
                nameAr: 'خيارات التدريس',
                nameEn: 'Teaching Options',
                // Teaching options section is considered complete when unlocked (after approval)
                // Teachers can configure demo settings, packages - these are preferences, not legal policies
                isComplete: isApproved,
                isLocked: !isApproved,
                weight: 5,
            },
        ];

        return [...preApprovalItems, ...postApprovalItems];
    }, [profile, isApproved, walletData]);

    const percentage = useMemo(() => {
        if (items.length === 0) return 0;

        const earnedWeight = items
            .filter(item => item.isComplete)
            .reduce((sum, item) => sum + item.weight, 0);

        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

        return Math.round((earnedWeight / totalWeight) * 100);
    }, [items]);

    const isFullyComplete = useMemo(() => {
        return items.every(item => item.isComplete || item.isLocked);
    }, [items]);

    return {
        percentage,
        items,
        isFullyComplete,
    };
}
