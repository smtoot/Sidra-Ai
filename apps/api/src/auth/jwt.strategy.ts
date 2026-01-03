import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * SECURITY FIX: Custom extractor that reads JWT from httpOnly cookie first,
 * then falls back to Authorization header for backwards compatibility
 */
const cookieOrHeaderExtractor = (req: Request): string | null => {
  // First try httpOnly cookie (more secure)
  if (req?.cookies?.access_token) {
    return req.cookies.access_token;
  }
  // Fallback to Authorization header for backwards compatibility
  const authHeader = req?.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');

    // SECURITY: Fail fast if JWT_SECRET not set
    if (!secret) {
      throw new Error(
        'CRITICAL: JWT_SECRET environment variable is not set. ' +
          'Generate a strong secret with: openssl rand -base64 64',
      );
    }

    super({
      // SECURITY FIX: Use custom extractor for cookie-based auth
      jwtFromRequest: cookieOrHeaderExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
