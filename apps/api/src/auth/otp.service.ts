import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  // OTP Configuration
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_SECRET: string;
  private readonly MAX_OTP_ATTEMPTS = 3;
  private readonly GRACE_PERIOD_SECONDS = 5;
  private readonly PREVIOUS_OTP_GRACE_SECONDS = 30;

  // Rate Limiting Configuration
  private readonly MAX_REQUESTS_PER_EMAIL_PER_HOUR = 5;
  private readonly MAX_REQUESTS_PER_IP_PER_HOUR = 10;
  private readonly RATE_LIMIT_WINDOW_HOURS = 1;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // SECURITY: Fail fast if OTP_SECRET not set
    const otpSecret = this.configService.get<string>('OTP_SECRET');
    if (!otpSecret) {
      throw new Error(
        'CRITICAL: OTP_SECRET environment variable is not set. ' +
          "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
      );
    }

    this.OTP_SECRET = otpSecret;

    // Warn if using weak secret
    if (
      otpSecret.length < 32 ||
      otpSecret === 'CHANGE_ME_IN_PRODUCTION_USE_NODE_CRYPTO'
    ) {
      this.logger.warn(
        '⚠️  WARNING: OTP_SECRET appears weak. Use a strong 32+ byte secret in production.',
      );
    }
  }

  /**
   * SECURITY-CRITICAL: Generate 6-digit OTP
   * Uses crypto.randomInt for cryptographic randomness
   */
  generateOtp(): string {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
  }

  /**
   * SECURITY-CRITICAL: Hash OTP with HMAC-SHA256
   * Stores hash in database, never plain OTP
   */
  hashOtp(otp: string): string {
    return crypto
      .createHmac('sha256', this.OTP_SECRET)
      .update(otp)
      .digest('hex');
  }

  /**
   * SECURITY-CRITICAL: Constant-time OTP verification
   * Prevents timing attacks using crypto.timingSafeEqual
   *
   * @param providedOtp - User-provided OTP string
   * @param storedHash - HMAC-SHA256 hash from database
   * @param expiresAt - Expiry timestamp (with 5-second grace period)
   * @returns boolean - true if OTP is valid
   */
  verifyOtp(providedOtp: string, storedHash: string, expiresAt: Date): boolean {
    // Check expiry with 5-second grace period
    const now = new Date();
    const graceExpiresAt = new Date(
      expiresAt.getTime() + this.GRACE_PERIOD_SECONDS * 1000,
    );

    if (now > graceExpiresAt) {
      return false;
    }

    // Hash provided OTP
    const providedHash = this.hashOtp(providedOtp);

    // SECURITY: Constant-time comparison to prevent timing attacks
    const providedBuffer = Buffer.from(providedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (providedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(providedBuffer, storedBuffer);
  }

  /**
   * Check if OTP is within 30-second grace period after resend
   */
  isWithinPreviousOtpGracePeriod(
    providedOtp: string,
    previousOtpHash: string | null,
    previousOtpExpiresAt: Date | null,
  ): boolean {
    if (!previousOtpHash || !previousOtpExpiresAt) {
      return false;
    }

    const now = new Date();
    const gracePeriodEnd = new Date(
      previousOtpExpiresAt.getTime() + this.PREVIOUS_OTP_GRACE_SECONDS * 1000,
    );

    if (now > gracePeriodEnd) {
      return false;
    }

    const providedHash = this.hashOtp(providedOtp);
    const providedBuffer = Buffer.from(providedHash, 'hex');
    const storedBuffer = Buffer.from(previousOtpHash, 'hex');

    if (providedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(providedBuffer, storedBuffer);
  }

  /**
   * SECURITY: Rate limiting check using database
   * Prevents abuse via email enumeration and DoS
   *
   * @throws BadRequestException if rate limit exceeded
   */
  async checkRateLimit(email: string, ipAddress: string): Promise<void> {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
    );

    // Check email-based rate limit (5 per hour)
    const emailRateLimits = await this.prisma.otp_rate_limits.findMany({
      where: {
        email: email.toLowerCase().trim(),
        windowStartsAt: { gte: windowStart },
      },
    });

    const emailCount = emailRateLimits.reduce(
      (sum, record) => sum + record.attemptCount,
      0,
    );

    if (emailCount >= this.MAX_REQUESTS_PER_EMAIL_PER_HOUR) {
      this.logger.warn(`Rate limit exceeded for email: ${email}`);
      // SECURITY: Generic error message to prevent email enumeration
      throw new BadRequestException(
        'تم تجاوز الحد الأقصى للطلبات. حاول بعد ساعة - Too many requests. Please try again later.',
      );
    }

    // Check IP-based rate limit (10 per hour - soft limit)
    const ipRateLimits = await this.prisma.otp_rate_limits.findMany({
      where: {
        ipAddress,
        windowStartsAt: { gte: windowStart },
      },
    });

    const ipCount = ipRateLimits.reduce(
      (sum, record) => sum + record.attemptCount,
      0,
    );

    if (ipCount >= this.MAX_REQUESTS_PER_IP_PER_HOUR) {
      this.logger.warn(`Rate limit exceeded for IP: ${ipAddress}`);
      throw new BadRequestException(
        'تم تجاوز الحد الأقصى للطلبات من شبكتك - Too many requests from your network. Please try again later.',
      );
    }
  }

  /**
   * Record rate limit attempt
   */
  async recordRateLimitAttempt(
    email: string,
    ipAddress: string,
  ): Promise<void> {
    const now = new Date();

    await this.prisma.otp_rate_limits.upsert({
      where: {
        email_ipAddress: {
          email: email.toLowerCase().trim(),
          ipAddress,
        },
      },
      update: {
        attemptCount: { increment: 1 },
        lastAttemptAt: now,
      },
      create: {
        email: email.toLowerCase().trim(),
        ipAddress,
        attemptCount: 1,
        lastAttemptAt: now,
        windowStartsAt: now,
      },
    });
  }

  /**
   * Calculate OTP expiry timestamp
   */
  calculateOtpExpiry(): Date {
    return new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
  }

  /**
   * Get max OTP attempts
   */
  getMaxOtpAttempts(): number {
    return this.MAX_OTP_ATTEMPTS;
  }
}
