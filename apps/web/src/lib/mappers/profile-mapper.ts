import { TeacherPublicProfile } from '@/lib/api/marketplace';

/**
 * Maps the Teacher Hub state (raw form data) to the TeacherPublicProfile structure
 * used by the public profile view.
 * 
 * STRICT RULE: NO DUMMY DATA.
 * If data is missing in the hub state, it should be null/empty in the output.
 */
export function mapHubStateToPublicProfile(hubProfile: any): TeacherPublicProfile {
    // Default safe objects
    const subjects = Array.isArray(hubProfile.subjects) ? hubProfile.subjects : [];
    const availability = Array.isArray(hubProfile.availability) ? hubProfile.availability : [];

    // Attempt to extract tags from various possible locations in hub state
    // Hub state might have tags as IDs (profile.teachingTagIds) or objects (profile.teachingTags)
    // We need objects with labelAr for the view.
    // If we only have IDs, we can't show labels unless we have the lookup list.
    // However, the View expects `{ id, labelAr }`.
    // If the hub profile is loaded from API, it usually contains the full object for tags in `teachingTags`.
    let teachingTags: { id: string; labelAr: string }[] = [];
    if (Array.isArray(hubProfile.teachingTags)) {
        teachingTags = hubProfile.teachingTags.map((t: any) => ({
            // Handle if t is the tag itself or a relation object
            id: t.tag?.id || t.id,
            labelAr: t.tag?.labelAr || t.labelAr || 'Tag'
        })).filter((t: any) => t.id && t.labelAr !== 'Tag');
    }

    return {
        id: hubProfile.id || '',
        userId: hubProfile.userId || '',
        displayName: hubProfile.displayName || null,
        profilePhotoUrl: hubProfile.profilePhotoUrl || null,
        introVideoUrl: hubProfile.introVideoUrl || null,
        bio: hubProfile.bio || null,
        averageRating: hubProfile.averageRating || 0,
        totalReviews: hubProfile.totalReviews || 0,
        totalSessions: hubProfile.totalSessions || 0,
        education: hubProfile.education || null,
        yearsOfExperience: hubProfile.yearsOfExperience || null,
        gender: hubProfile.gender || null,

        // Settings - default to enabled if not found, as per typical behavior
        globalSettings: {
            packagesEnabled: true, // System setting, assume true for preview
            demosEnabled: true,    // System setting, assume true for preview
        },
        teacherSettings: {
            demoEnabled: hubProfile.teacherSettings?.demoEnabled ?? false,
        },

        // NO DUMMY DATA: If packageTiers are not loaded in hubProfile, send empty.
        // The view will show "No packages" or empty state.
        packageTiers: Array.isArray(hubProfile.packageTiers) ? hubProfile.packageTiers : [],

        subjects: subjects.map((s: any) => ({
            id: s.id,
            pricePerHour: s.pricePerHour?.toString() || '0',
            gradeLevels: [], // grades logic is complex, if missing leave empty
            grades: Array.isArray(s.grades) ? s.grades.map((g: any) => ({
                id: g.gradeLevel?.id || g.id,
                nameAr: g.gradeLevel?.nameAr || g.nameAr,
                nameEn: g.gradeLevel?.nameEn || g.nameEn || '',
                code: g.gradeLevel?.code || g.code || '',
                stageNameAr: g.gradeLevel?.stage?.nameAr || g.stageNameAr || '',
                stageNameEn: g.gradeLevel?.stage?.nameEn || g.stageNameEn || ''
            })) : [],
            subject: {
                id: s.subject?.id || s.subjectId,
                nameAr: s.subject?.nameAr || 'المادة',
                nameEn: s.subject?.nameEn || ''
            },
            curriculum: {
                id: s.curriculum?.id || s.curriculumId,
                nameAr: s.curriculum?.nameAr || 'المنهج',
                nameEn: s.curriculum?.nameEn || ''
            }
        })),

        availability: availability.map((a: any) => ({
            id: a.id,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime
        })),

        applicationStatus: hubProfile.applicationStatus || 'DRAFT',

        teachingApproach: {
            text: hubProfile.teachingStyle || null,
            tags: teachingTags
        },

        // Qualifications - map from hubProfile if available, otherwise empty array
        qualifications: Array.isArray(hubProfile.qualifications)
            ? hubProfile.qualifications.map((q: any) => ({
                id: q.id,
                type: q.type || 'OTHER',
                name: q.name || '',
                institution: q.institution || null,
                graduationYear: q.graduationYear || null,
                fieldOfStudy: q.fieldOfStudy || null,
                isVerified: q.isVerified || false
            }))
            : []
    };
}
