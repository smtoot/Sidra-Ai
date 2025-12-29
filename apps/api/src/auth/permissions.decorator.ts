import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to specify required permissions for an endpoint.
 * Used with PermissionsGuard.
 * 
 * @example
 * @RequirePermissions(PERMISSIONS.TEACHERS_APPROVE)
 * async approveTeacher() {}
 * 
 * @example Multiple permissions (ALL required)
 * @RequirePermissions(PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_APPROVE)
 * async approveAndViewPayout() {}
 */
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);
