import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '@sidra/shared';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.role) {
            console.warn('RolesGuard: No user or role found in request');
            return false;
        }

        const hasRole = requiredRoles.some((role) => String(user.role).trim() === String(role).trim());

        if (!hasRole) {
            console.warn(`RolesGuard Denied: User Role=${user.role} Required=${JSON.stringify(requiredRoles)}`);
        }

        return hasRole;
    }
}
