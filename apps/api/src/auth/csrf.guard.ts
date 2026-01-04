import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * SECURITY FIX: CSRF Guard for state-changing requests
 *
 * This guard validates that POST/PUT/PATCH/DELETE requests include a valid CSRF token.
 * The token is set in a non-httpOnly cookie and must be included in the X-CSRF-Token header.
 *
 * This provides double-submit cookie protection:
 * 1. The csrf_token cookie is set by the server on login/register
 * 2. The frontend reads the cookie and includes it in the X-CSRF-Token header
 * 3. This guard validates that cookie value === header value
 *
 * Attackers cannot read the cookie from another domain (SameSite + CORS),
 * so they cannot include the correct header in cross-site requests.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Only validate on state-changing methods
    const method = request.method?.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return true;
    }

    // Skip CSRF validation for public endpoints (login, register, etc.)
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }

    // Skip if no cookies (using header-based auth - backwards compatibility)
    if (!request.cookies?.csrf_token) {
      // If using Authorization header only (old clients), skip CSRF
      // This allows gradual migration to cookie-based auth
      const hasAuthHeader =
        request.headers?.authorization?.startsWith('Bearer ');
      if (hasAuthHeader && !request.cookies?.access_token) {
        return true;
      }
    }

    // Validate CSRF token
    const cookieToken = request.cookies?.csrf_token;
    const headerToken = request.headers?.['x-csrf-token'];

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF token invalid');
    }

    return true;
  }
}
