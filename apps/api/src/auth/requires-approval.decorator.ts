import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark routes that require the teacher to be approved.
 * Use with ApprovalGuard to enforce application status check.
 */
export const REQUIRES_APPROVAL_KEY = 'requiresApproval';
export const RequiresApproval = () => SetMetadata(REQUIRES_APPROVAL_KEY, true);
