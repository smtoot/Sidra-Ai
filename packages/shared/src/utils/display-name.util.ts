/**
 * Display Name Utility
 * 
 * Provides consistent user name display across all roles.
 * Priority:
 * - Teacher: displayName → fullName → "معلم"
 * - Parent: firstName → "ولي أمر"  
 * - Student: firstName → "طالب"
 * 
 * NEVER uses email or phone number as display name.
 */

export interface DisplayNameUser {
    role: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    teacherProfile?: {
        displayName?: string | null;
        fullName?: string | null;
    } | null;
}

const ROLE_FALLBACKS: Record<string, string> = {
    PARENT: 'ولي أمر',
    STUDENT: 'طالب',
    TEACHER: 'معلم',
    ADMIN: 'مسؤول'
};

/**
 * Get the display name for a user based on their role.
 * Never returns email or phone number.
 */
export function getDisplayName(user: DisplayNameUser): string {
    // Teacher: use displayName or fullName from profile
    if (user.role === 'TEACHER' && user.teacherProfile) {
        if (user.teacherProfile.displayName) {
            return user.teacherProfile.displayName;
        }
        if (user.teacherProfile.fullName) {
            return user.teacherProfile.fullName;
        }
        // Fall through to firstName if no profile name
    }

    // All roles: use firstName if available
    if (user.firstName) {
        const lastName = user.lastName ? ` ${user.lastName}` : '';
        return `${user.firstName}${lastName}`.trim();
    }

    // Role-based fallback (NEVER email/phone)
    return ROLE_FALLBACKS[user.role] || 'مستخدم';
}

/**
 * Get first name only (for compact displays)
 */
export function getFirstName(user: DisplayNameUser): string {
    if (user.role === 'TEACHER' && user.teacherProfile?.displayName) {
        // Return just first word of display name for teacher
        return user.teacherProfile.displayName.split(' ')[0];
    }

    if (user.firstName) {
        return user.firstName;
    }

    return ROLE_FALLBACKS[user.role] || 'مستخدم';
}

/**
 * Check if user needs to complete their profile name
 */
export function needsProfileName(user: DisplayNameUser): boolean {
    if (user.role === 'TEACHER') {
        // Teachers use teacherProfile.displayName
        return !user.teacherProfile?.displayName && !user.teacherProfile?.fullName;
    }
    // Parents/Students need firstName
    return !user.firstName;
}
