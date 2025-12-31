/**
 * Teacher Status Configuration
 * Centralized configuration for teacher status badges and thresholds
 */

// Threshold for when a teacher is no longer considered "recently joined"
export const RECENTLY_JOINED_REVIEW_THRESHOLD = 3;

// Status labels in Arabic
export const TEACHER_STATUS_LABELS = {
    RECENTLY_JOINED: 'انضم حديثاً',
    VERIFIED: 'معلم موثق',
    ON_VACATION: 'في إجازة',
    QUALIFICATION_VERIFIED: 'موثق',
} as const;

// Helper function to check if teacher is recently joined
export const isRecentlyJoinedTeacher = (totalReviews: number): boolean => {
    return totalReviews < RECENTLY_JOINED_REVIEW_THRESHOLD;
};

// Helper function to check if teacher is verified (approved)
export const isVerifiedTeacher = (applicationStatus: string): boolean => {
    return applicationStatus === 'APPROVED';
};
