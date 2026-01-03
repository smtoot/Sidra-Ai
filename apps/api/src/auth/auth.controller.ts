import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from '@sidra/shared';
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
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public() // SECURITY: Public endpoint - no JWT required
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  register(@Body() createAuthDto: RegisterDto) {
    return this.authService.register(createAuthDto);
  }

  @Public() // SECURITY: Public endpoint - no JWT required
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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
  refreshToken(
    @Body() body: { refresh_token: string },
    @Req() req: any, // To get IP/User Agent
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || 'Unknown';
    const deviceInfo = `${userAgent} (${ip})`;
    return this.authService.refreshToken(body.refresh_token, deviceInfo);
  }

  @Post('logout')
  logout(@Body() body: { refresh_token: string }) {
    return this.authService.logout(body.refresh_token);
  }
}
