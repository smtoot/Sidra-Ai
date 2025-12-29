/**
 * Permission System Constants
 * 
 * SECURITY: All permissions must be defined here.
 * Wildcards are namespace-scoped (e.g., "users.*" only expands to users.* permissions)
 * "*" (full wildcard) is ONLY for SUPER_ADMIN and handled via logic, not expansion
 */

export const PERMISSIONS = {
    // User Management
    USERS_VIEW: 'users.view',
    USERS_BAN: 'users.ban',

    // Teacher Management
    TEACHERS_VIEW: 'teachers.view',
    TEACHERS_APPROVE: 'teachers.approve',

    // Disputes
    DISPUTES_VIEW: 'disputes.view',
    DISPUTES_RESOLVE: 'disputes.resolve',

    // Bookings
    BOOKINGS_VIEW: 'bookings.view',
    BOOKINGS_CANCEL: 'bookings.cancel',

    // CMS (Content Management)
    CMS_MANAGE: 'cms.manage',

    // Finance
    FINANCE_VIEW: 'finance.view',
    FINANCE_APPROVE: 'finance.approve',

    // System Settings
    SETTINGS_UPDATE: 'settings.update',

    // Admin Management
    ADMINS_CREATE: 'admins.create',
    ADMINS_VIEW: 'admins.view',

    // Support Tickets
    TICKETS_VIEW: 'tickets.view',
    TICKETS_ASSIGN: 'tickets.assign',
    TICKETS_RESOLVE: 'tickets.resolve',
    TICKETS_ESCALATE: 'tickets.escalate',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type Permission = typeof PERMISSIONS[PermissionKey];

/**
 * All valid permission values.
 * Used for validation of permission overrides.
 */
export const ALL_PERMISSIONS: string[] = Object.values(PERMISSIONS);

/**
 * Namespace map for wildcard expansion.
 * Each namespace expands to specific permissions.
 */
export const PERMISSION_NAMESPACES: Record<string, string[]> = {
    'users': [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_BAN],
    'teachers': [PERMISSIONS.TEACHERS_VIEW, PERMISSIONS.TEACHERS_APPROVE],
    'disputes': [PERMISSIONS.DISPUTES_VIEW, PERMISSIONS.DISPUTES_RESOLVE],
    'bookings': [PERMISSIONS.BOOKINGS_VIEW, PERMISSIONS.BOOKINGS_CANCEL],
    'cms': [PERMISSIONS.CMS_MANAGE],
    'finance': [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_APPROVE],
    'settings': [PERMISSIONS.SETTINGS_UPDATE],
    'admins': [PERMISSIONS.ADMINS_CREATE, PERMISSIONS.ADMINS_VIEW],
    'tickets': [PERMISSIONS.TICKETS_VIEW, PERMISSIONS.TICKETS_ASSIGN, PERMISSIONS.TICKETS_RESOLVE, PERMISSIONS.TICKETS_ESCALATE],
};

/**
 * Default permissions per role.
 * 
 * SECURITY:
 * - SUPER_ADMIN uses '*' which is handled via bypass logic (always returns true)
 * - Other wildcards like 'users.*' are expanded to specific permissions
 * - Non-admin roles (PARENT, STUDENT, TEACHER) have no admin permissions
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
    // SUPER_ADMIN: Full access (handled via code bypass, not expansion)
    SUPER_ADMIN: ['*'],

    // ADMIN: Everything except creating other admins
    ADMIN: [
        'users.*',
        'teachers.*',
        'disputes.*',
        'bookings.*',
        'cms.*',
        'finance.*',
        'settings.*',
        'tickets.*',
        'admins.view'
    ],

    // MODERATOR: Teacher reviews, disputes, bookings, tickets
    MODERATOR: [
        'users.view',
        'teachers.*',
        'disputes.*',
        'bookings.*',
        'tickets.*'
    ],

    // CONTENT_ADMIN: CMS only
    CONTENT_ADMIN: ['cms.*'],

    // FINANCE: Financial operations only
    FINANCE: ['finance.*'],

    // SUPPORT: Tickets management + read-only access to other areas
    SUPPORT: [
        'users.view',
        'teachers.view',
        'disputes.view',
        'bookings.view',
        'finance.view',
        'tickets.*'
    ],

    // Non-admin roles have no admin permissions
    PARENT: [],
    STUDENT: [],
    TEACHER: [],
};

/**
 * Permission override structure for User.permissionOverrides JSON field
 */
export interface PermissionOverrides {
    add?: string[];
    remove?: string[];
}

/**
 * Admin roles that can access the admin dashboard
 */
export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE', 'SUPPORT'] as const;

/**
 * Roles that can be created via the admin team management API
 * SECURITY: PARENT, STUDENT, TEACHER cannot be created via admin API
 */
export const CREATABLE_ADMIN_ROLES = ['ADMIN', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE', 'SUPPORT'] as const;
