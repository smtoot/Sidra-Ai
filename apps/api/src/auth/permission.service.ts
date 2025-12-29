import { Injectable } from '@nestjs/common';
import {
    ROLE_PERMISSIONS,
    PERMISSION_NAMESPACES,
    ALL_PERMISSIONS,
    PermissionOverrides
} from './permissions.constants';

/**
 * User type for permission checking
 */
interface UserForPermissionCheck {
    role: string;
    permissionOverrides?: PermissionOverrides | null;
}

/**
 * PermissionService
 * 
 * Core permission checking logic with the following resolution order:
 * 1. SUPER_ADMIN → always true (bypass)
 * 2. Explicit REMOVE override → deny
 * 3. Explicit ADD override → allow
 * 4. Base role permissions → allow/deny
 * 
 * SECURITY:
 * - SUPER_ADMIN bypass is logic-based, not wildcard expansion
 * - Wildcards are namespace-scoped (e.g., "users.*" only expands to users.* permissions)
 * - Permission validation rejects unknown permissions
 */
@Injectable()
export class PermissionService {

    /**
     * Check if user has a specific permission.
     * 
     * Resolution order:
     * 1. SUPER_ADMIN bypass
     * 2. Explicit REMOVE override → deny
     * 3. Explicit ADD override → allow
     * 4. Base role permissions
     */
    hasPermission(user: UserForPermissionCheck, permission: string): boolean {
        // 1. SUPER_ADMIN bypass - always allowed
        if (user.role === 'SUPER_ADMIN') {
            return true;
        }

        // Get overrides (safely parse if needed)
        const overrides = this.parseOverrides(user.permissionOverrides);

        // 2. Explicit REMOVE override → deny
        if (overrides.remove?.includes(permission)) {
            return false;
        }

        // 3. Explicit ADD override → allow
        if (overrides.add?.includes(permission)) {
            return true;
        }

        // 4. Base role permissions
        const rolePerms = ROLE_PERMISSIONS[user.role] || [];
        const expandedPerms = this.expandWildcards(rolePerms);

        return expandedPerms.includes(permission);
    }

    /**
     * Check if user has ALL of the specified permissions.
     */
    hasAllPermissions(user: UserForPermissionCheck, permissions: string[]): boolean {
        return permissions.every(p => this.hasPermission(user, p));
    }

    /**
     * Check if user has ANY of the specified permissions.
     */
    hasAnyPermission(user: UserForPermissionCheck, permissions: string[]): boolean {
        return permissions.some(p => this.hasPermission(user, p));
    }

    /**
     * Get all effective permissions for a user.
     * This is useful for frontend to determine what to show.
     */
    getEffectivePermissions(user: UserForPermissionCheck): string[] {
        // SUPER_ADMIN has all permissions
        if (user.role === 'SUPER_ADMIN') {
            return ALL_PERMISSIONS;
        }

        const overrides = this.parseOverrides(user.permissionOverrides);
        const rolePerms = ROLE_PERMISSIONS[user.role] || [];
        const expandedRolePerms = this.expandWildcards(rolePerms);

        // Start with role permissions
        const effectivePerms = new Set<string>(expandedRolePerms);

        // Add explicit grants
        if (overrides.add) {
            for (const perm of overrides.add) {
                effectivePerms.add(perm);
            }
        }

        // Remove explicit revocations
        if (overrides.remove) {
            for (const perm of overrides.remove) {
                effectivePerms.delete(perm);
            }
        }

        return Array.from(effectivePerms);
    }

    /**
     * Expand wildcards to specific permissions.
     * 
     * SECURITY: Wildcards are namespace-scoped.
     * - "users.*" → ['users.view', 'users.ban']
     * - "*" is NOT expanded here (handled via SUPER_ADMIN bypass)
     */
    expandWildcards(permissions: string[]): string[] {
        const expanded: string[] = [];

        for (const perm of permissions) {
            // Skip full wildcard - should never be in non-SUPER_ADMIN roles
            if (perm === '*') {
                continue;
            }

            // Check for namespace wildcard (e.g., "users.*")
            if (perm.endsWith('.*')) {
                const namespace = perm.slice(0, -2); // Remove ".*"
                const namespacePerms = PERMISSION_NAMESPACES[namespace];
                if (namespacePerms) {
                    expanded.push(...namespacePerms);
                }
            } else {
                // Regular permission
                expanded.push(perm);
            }
        }

        return expanded;
    }

    /**
     * Validate permission overrides structure and values.
     * Returns validation errors if any.
     * 
     * SECURITY: Rejects unknown permissions to prevent escalation via typos.
     */
    validateOverrides(overrides: unknown): string[] {
        const errors: string[] = [];

        if (!overrides || typeof overrides !== 'object') {
            return errors; // null/undefined is valid (no overrides)
        }

        const obj = overrides as Record<string, unknown>;

        // Validate 'add' array
        if (obj.add !== undefined) {
            if (!Array.isArray(obj.add)) {
                errors.push('permissionOverrides.add must be an array');
            } else {
                for (const perm of obj.add) {
                    if (typeof perm !== 'string') {
                        errors.push(`permissionOverrides.add contains non-string value: ${perm}`);
                    } else if (!ALL_PERMISSIONS.includes(perm)) {
                        errors.push(`Unknown permission in add: ${perm}`);
                    }
                }
            }
        }

        // Validate 'remove' array
        if (obj.remove !== undefined) {
            if (!Array.isArray(obj.remove)) {
                errors.push('permissionOverrides.remove must be an array');
            } else {
                for (const perm of obj.remove) {
                    if (typeof perm !== 'string') {
                        errors.push(`permissionOverrides.remove contains non-string value: ${perm}`);
                    } else if (!ALL_PERMISSIONS.includes(perm)) {
                        errors.push(`Unknown permission in remove: ${perm}`);
                    }
                }
            }
        }

        // Check for unexpected keys
        const allowedKeys = ['add', 'remove'];
        for (const key of Object.keys(obj)) {
            if (!allowedKeys.includes(key)) {
                errors.push(`Unexpected key in permissionOverrides: ${key}`);
            }
        }

        return errors;
    }

    /**
     * Check if a role is an admin role (can access admin dashboard)
     */
    isAdminRole(role: string): boolean {
        return ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'CONTENT_ADMIN', 'FINANCE', 'SUPPORT'].includes(role);
    }

    /**
     * Parse permission overrides from user object
     */
    private parseOverrides(overrides: unknown): PermissionOverrides {
        if (!overrides || typeof overrides !== 'object') {
            return {};
        }
        return overrides as PermissionOverrides;
    }
}
