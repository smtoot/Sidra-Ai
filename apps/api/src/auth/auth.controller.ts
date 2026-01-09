import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@sidra/shared';
import { Public } from './public.decorator';

/**
 * Authenticated request interface for JWT-protected endpoints
 */
interface AuthRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
  cookies?: {
    access_token?: string;
    refresh_token?: string;
    csrf_token?: string;
  };
}

/**
 * SECURITY FIX: Cookie configuration for httpOnly tokens
 * - httpOnly: Prevents XSS attacks from accessing tokens via JavaScript
 * - secure: Only send over HTTPS in production
 * - sameSite: Prevents CSRF attacks by not sending cookies with cross-site requests
 * - path: Restrict cookie scope
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // 'lax' allows top-level navigation, 'strict' for max security
  path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * SECURITY FIX: Helper to set auth cookies
   */
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    csrfToken: string,
  ) {
    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
    // CSRF token is NOT httpOnly - frontend needs to read it to include in headers
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
  }

  /**
   * SECURITY FIX: Helper to clear auth cookies
   */
  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    res.clearCookie('csrf_token', { path: '/' });
  }

  @Public() // SECURITY: Public endpoint - no JWT required
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute - prevents mass account creation
  async register(
    @Body() createAuthDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(createAuthDto);
    this.setAuthCookies(
      res,
      tokens.access_token,
      tokens.refresh_token,
      tokens.csrf_token,
    );
    // Still return tokens in body for backwards compatibility during transition
    return tokens;
  }

  @Public() // SECURITY: Public endpoint - no JWT required
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute - prevents credential stuffing
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(loginDto);
    this.setAuthCookies(
      res,
      tokens.access_token,
      tokens.refresh_token,
      tokens.csrf_token,
    );
    // Still return tokens in body for backwards compatibility during transition
    return tokens;
  }

  // SECURITY: Protected by global JwtAuthGuard - requires JWT token
  @Get('profile')
  getProfile(@Req() req: AuthRequest) {
    return this.authService.getProfile(req.user.userId);
  }

  // SECURITY: Protected by global JwtAuthGuard - requires JWT token
  @Post('change-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  changePassword(
    @Req() req: AuthRequest,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // higher limit for auto-refresh
  async refreshToken(
    @Body() body: { refresh_token?: string },
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || 'Unknown';
    const deviceInfo = `${userAgent} (${ip})`;

    // SECURITY FIX: Read refresh token from cookie if not in body
    const refreshToken = body.refresh_token || req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokens = await this.authService.refreshToken(
      refreshToken,
      deviceInfo,
    );
    this.setAuthCookies(
      res,
      tokens.access_token,
      tokens.refresh_token,
      tokens.csrf_token,
    );
    return tokens;
  }

  @Post('logout')
  async logout(
    @Body() body: { refresh_token?: string },
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // SECURITY FIX: Read refresh token from cookie if not in body
    const refreshToken = body.refresh_token || req.cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    this.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 2, ttl: 300000 } }) // 2 attempts per 5 minutes - prevents email enumeration
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute - token is single-use anyway
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
