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
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Get route info for debugging
    const request = context.switchToHttp().getRequest();
    const routePath = request.route?.path || request.url;
    const method = request.method;

    // No permissions required = allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user from request (set by JwtAuthGuard)
    const user = request.user;

    if (!user || !user.userId) {
      this.logger.warn(
        `PermissionsGuard: Auth failed - No user in request. ` +
        `Route: ${method} ${routePath}`,
      );
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
      this.logger.warn(
        `PermissionsGuard: User not found in DB. ` +
        `UserId: ${user.userId}, Route: ${method} ${routePath}`,
      );
      throw new ForbiddenException('User not found');
    }

    if (!fullUser.isActive) {
      this.logger.warn(
        `PermissionsGuard: Account deactivated. ` +
        `UserId: ${fullUser.id}, Role: ${fullUser.role}, Route: ${method} ${routePath}`,
      );
      throw new ForbiddenException('Account is deactivated');
    }

    // Log permission check attempt (debug level for staging diagnostics)
    this.logger.debug(
      `PermissionsGuard: Checking permissions for User ${fullUser.id} (${fullUser.role}). ` +
      `Required: [${requiredPermissions.join(', ')}]. Route: ${method} ${routePath}`,
    );

    // Check if user has ALL required permissions
    const hasAllPermissions = this.permissionService.hasAllPermissions(
      {
        role: fullUser.role,
        permissionOverrides: fullUser.permissionOverrides as any,
      },
      requiredPermissions,
    );

    if (!hasAllPermissions) {
      const effective = this.permissionService.getEffectivePermissions({
        role: fullUser.role,
        permissionOverrides: fullUser.permissionOverrides as any,
      });

      this.logger.warn(
        `PermissionsGuard DENIED: User ${fullUser.id} (role=${fullUser.role}) ` +
        `tried to access ${method} ${routePath}. ` +
        `Required: [${requiredPermissions.join(', ')}]. ` +
        `User's effective permissions: [${effective.join(', ')}]. ` +
        `PermissionOverrides: ${JSON.stringify(fullUser.permissionOverrides)}`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    this.logger.debug(
      `PermissionsGuard ALLOWED: User ${fullUser.id} (${fullUser.role}) ` +
      `accessing ${method} ${routePath}`,
    );

    return true;
  }
}
