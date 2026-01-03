import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Otherwise, use default JWT authentication
    return super.canActivate(context);
  }

  /**
   * Override handleRequest to ensure 401 is thrown instead of 403 on auth failure
   * This addresses an issue where Passport sometimes returns 403 instead of 401
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Log for debugging
    if (err || !user) {
      this.logger.warn('Auth failed', {
        error: err?.message,
        info: info?.message || info,
        hasUser: !!user,
        path: context?.switchToHttp()?.getRequest()?.url,
      });
    }

    // If there's an error or no user, throw UnauthorizedException (401)
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
