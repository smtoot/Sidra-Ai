import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { RegisterDto, LoginDto } from '@sidra/shared';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  /**
   * Validate password requirements
   * Must have: 8+ chars, uppercase, lowercase, number
   */
  private validateStrongPassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل',
      );
    }
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException(
        'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل',
      );
    }
    if (!/[0-9]/.test(password)) {
      throw new BadRequestException(
        'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل',
      );
    }
  }

  async register(dto: RegisterDto) {
    // PHONE-FIRST: Check by phone number (primary identifier), not email
    const existingByPhone = dto.phoneNumber
      ? await this.prisma.user.findFirst({
        where: { phoneNumber: dto.phoneNumber },
      })
      : null;

    // P1-6 FIX: Use generic message to prevent account enumeration
    if (existingByPhone) {
      throw new ConflictException(
        'An account with these credentials already exists',
      );
    }

    // Optional: Also check email if provided
    if (dto.email) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      // P1-6 FIX: Use generic message to prevent account enumeration
      if (existingByEmail) {
        throw new ConflictException(
          'An account with these credentials already exists',
        );
      }
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Create User & Profile
    const user = await this.prisma.user.create({
      data: {
        email: dto.email || null, // Email is optional
        phoneNumber: dto.phoneNumber, // Phone is required
        firstName: dto.firstName || null, // Display name for Parents/Students
        lastName: dto.lastName || null, // Optional family name
        passwordHash: hashedPassword,
        role: dto.role,
        isVerified: false, // Default
        // Create empty profile based on role
        ...(dto.role === 'TEACHER' && {
          teacherProfile: { create: {} },
        }),
        ...(dto.role === 'PARENT' && {
          parentProfile: { create: {} },
        }),
        ...(dto.role === 'STUDENT' && {
          studentProfile: { create: {} },
        }),
      },
    });

    return this.signToken(user.id, user.email || undefined, user.role, {
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }

  async login(dto: LoginDto) {
    // Sanitize inputs
    const phoneNumber = dto.phoneNumber?.trim();
    const email = dto.email?.trim().toLowerCase();

    this.logger.log(`Login attempt for: phone=${phoneNumber ? '***' + phoneNumber.slice(-4) : 'N/A'}, email=${email || 'N/A'}`);

    // PHONE-FIRST: Try phone number first, fallback to email
    let user = null;

    if (phoneNumber) {
      // 1. Try exact match
      user = await this.prisma.user.findFirst({
        where: { phoneNumber },
        include: { teacherProfile: true },
      });

      // 2. If not found, try to normalize (Sudan specific context)
      if (!user && !phoneNumber.startsWith('+')) {
        let cleanNumber = phoneNumber;
        // Remove leading zero if present (e.g. 09123... -> 9123...)
        if (cleanNumber.startsWith('0')) {
          cleanNumber = cleanNumber.substring(1);
        }

        // Try with +249 prefix
        user = await this.prisma.user.findFirst({
          where: { phoneNumber: `+249${cleanNumber}` },
          include: { teacherProfile: true },
        });
      }
    } else if (email) {
      user = await this.prisma.user.findUnique({
        where: { email },
        include: { teacherProfile: true },
      });
    }

    if (!user) {
      this.logger.warn(`Login failed: user not found`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug('User found, verifying password...');
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isMatch) {
      this.logger.warn(`Login failed: password mismatch for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Login successful for user ${user.id}`);
    return this.signToken(user.id, user.email || undefined, user.role, {
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.teacherProfile?.displayName || undefined,
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        parentProfile: {
          include: {
            children: true,
          },
        },
        teacherProfile: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const { passwordHash, ...result } = user;
    return result;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedException('User not found');

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch)
      throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة');

    // P1-5: Validate strong password requirements
    this.validateStrongPassword(newPassword);

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  /**
   * Generates a pair of Access and Refresh tokens
   */
  private async signToken(
    userId: string,
    email: string | undefined, // Keeping email due to existing method signature logic
    role: string,
    profileData?: {
      firstName?: string | null;
      lastName?: string | null;
      displayName?: string | null;
    },
    deviceInfo?: string,
  ) {
    const payload = {
      sub: userId,
      email,
      role,
      firstName: profileData?.firstName || undefined,
      lastName: profileData?.lastName || undefined,
      displayName: profileData?.displayName || undefined,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // Generate Refresh Token
    // 1. Create a random string (the actual token)
    const refreshTokenPlain = crypto.randomUUID();

    // 2. Hash it for storage
    const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);

    // 3. Set expiration (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 4. Store in DB
    const tokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        expiresAt,
        deviceInfo: deviceInfo || 'Unknown Device',
      },
    });

    return {
      access_token: accessToken,
      // Format: {id}:{secret}
      // This allows efficient lookup by ID and secure verification by secret
      refresh_token: `${tokenRecord.id}:${refreshTokenPlain}`,
    };
  }

  // --- REFRESH TOKEN ROTATION ---

  async refreshToken(oldRefreshToken: string, deviceInfo?: string) {
    // 1. Find all tokens for this user that match the hash? 
    // Wait, we can't find by hash because it's bcrypt (salted).
    // We ideally should have sent an ID + Token, OR we have to iterate? 
    // Iterating is bad. 
    // Better strategy for MVP: Send UUID as token? No, if leaked DB is compromised.
    // Correction: We can store a 'tokenFamily' ID in the JWT? No, refresh token is opaque.
    // Standard approach with bcrypt: You can't lookup by plain token.
    // Revised Approach: The 'refresh_token' Sent to client is:  `{id}:{secret}`.
    // We look up by ID, verify secret with bcrypt.

    const [tokenId, tokenSecret] = oldRefreshToken.split(':');

    if (!tokenId || !tokenSecret) {
      throw new UnauthorizedException('Invalid token format');
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
    });

    if (!tokenRecord) {
      // Token not found - possibly deleted or fake
      throw new UnauthorizedException('Token invalid');
    }

    // 2. Check Reuse Detection (The "Token Family" safeguard)
    if (tokenRecord.revoked) {
      // SECURITY ALARM: Attempt to use a revoked token!
      // This implies the user OR an attacker is retrying an old token.
      // We must REVOKE ALL tokens for this user to be safe.
      await this.prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Security Alert: Token reuse detected. All sessions revoked.');
    }

    // 3. Verify Hash
    const isMatch = await bcrypt.compare(tokenSecret, tokenRecord.tokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Verify Expiry
    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    // 5. ROTATION: Revoke the old token
    // We replace it with a new one. valid usage consumes the token.
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revoked: true, revokedAt: new Date(), replacedByToken: 'ROTATED' }, // Ideally store new ID but we create it next
    });

    // 6. Issue New Pair
    const user = await this.prisma.user.findUnique({ where: { id: tokenRecord.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // Generating new token requires calling signToken, but signToken creates a DB entry.
    // We need to modify signToken to return the formatted `{id}:{secret}` string.

    // Refactored logic inline to avoid cyclic dependency or deep refactor of signToken signature mismatch
    // Actually, let's just call signToken. It works.

    return this.signToken(user.id, user.email || undefined, user.role, {
      firstName: user.firstName,
      lastName: user.lastName,
    }, deviceInfo);
  }

  async logout(refreshToken: string) {
    const [tokenId, tokenSecret] = refreshToken.split(':');
    if (!tokenId) return; // Invalid format, ignore

    // Just revoke it
    try {
      await this.prisma.refreshToken.update({
        where: { id: tokenId },
        data: { revoked: true, revokedAt: new Date() }
      });
    } catch (e) {
      // Token not found or already revoked - log but don't fail logout
      this.logger.debug(`Logout: token ${tokenId.slice(0, 8)}... not found or already revoked`);
    }
    return { message: 'Logged out successfully' };
  }
}
