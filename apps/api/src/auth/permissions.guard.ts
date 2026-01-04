import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionService } from './permission.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

/**
 * PermissionsGuard
 *
 * Server-side permission enforcement guard.
 * Fetches fresh user permissions from DB on each request.
 *
 * SECURITY:
 * - Does NOT rely on JWT for permissions (always fetches from DB)
 * - Permission changes take effect immediately
 * - Works with RequirePermissions decorator
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required = allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user from request (set by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.users;

    if (!user || !user.userId) {
      throw new ForbiddenException('Authentication required');
    }

    // Fetch fresh user data from DB (SECURITY: don't rely on JWT)
    const fullUser = await this.prisma.users.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        role: true,
        permissionOverrides: true,
        isActive: true,
      },
    });

    if (!fullUser) {
      throw new ForbiddenException('User not found');
    }

    if (!fullUser.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    // Check if user has ALL required permissions
    const hasAllPermissions = this.permissionService.hasAllPermissions(
      {
        role: fullUser.role,
        permissionOverrides: fullUser.permissionOverrides as any,
      },
      requiredPermissions,
    );

    if (!hasAllPermissions) {
      this.logger.warn(
        `PermissionsGuard Denied: User ${fullUser.id} (${fullUser.role}) ` +
          `lacks permissions: ${requiredPermissions.join(', ')}`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
