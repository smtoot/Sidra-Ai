import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '@sidra/shared';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      this.logger.warn('No user or role found in request');
      return false;
    }

    // SUPER_ADMIN bypass: has access to all role-protected endpoints
    if (String(user.role).trim() === 'SUPER_ADMIN') {
      return true;
    }

    const hasRole = requiredRoles.some(
      (role) => String(user.role).trim() === String(role).trim(),
    );

    if (!hasRole) {
      this.logger.warn(
        `Access denied: User Role=${user.role} Required=${JSON.stringify(requiredRoles)}`,
      );
    }

    return hasRole;
  }
}
