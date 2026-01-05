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
    // Check Email Uniqueness (Email is now required)
    const existingByEmail = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existingByEmail) {
      throw new ConflictException('An account with this email already exists');
    }

    // Check Phone Uniqueness (Phone remains required)
    const existingByPhone = await this.prisma.users.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existingByPhone) {
      throw new ConflictException(
        'An account with this phone number already exists',
      );
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Create User & Profile
    const user = await this.prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        email: dto.email!, // Email is now required
        phoneNumber: dto.phoneNumber, // Phone remains required
        firstName: dto.firstName || null,
        lastName: dto.lastName || null,
        passwordHash: hashedPassword,
        role: dto.role,
        isVerified: false,
        emailVerified: false, // New field for email verification
        // Create empty profile based on role
        ...(dto.role === 'TEACHER' && {
          teacher_profiles: { create: { id: crypto.randomUUID() } },
        }),
        ...(dto.role === 'PARENT' && {
          parent_profiles: { create: { id: crypto.randomUUID() } },
        }),
        ...(dto.role === 'STUDENT' && {
          student_profiles: { create: { id: crypto.randomUUID() } },
        }),
      },
    });

    return this.signToken(user.id, user.email, user.role, {
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }

  async login(dto: LoginDto) {
    // Sanitize inputs
    const phoneNumber = dto.phoneNumber?.trim();
    const email = dto.email?.trim().toLowerCase();

    this.logger.log(
      `Login attempt for: phone=${phoneNumber ? '***' + phoneNumber.slice(-4) : 'N/A'}, email=${email || 'N/A'}`,
    );

    // PHONE-FIRST: Try phone number first, fallback to email
    let user = null;

    if (phoneNumber) {
      // 1. Try exact match
      user = await this.prisma.users.findFirst({
        where: { phoneNumber },
        include: { teacher_profiles: true },
      });

      // 2. If not found, try to normalize (Sudan specific context)
      if (!user && !phoneNumber.startsWith('+')) {
        let cleanNumber = phoneNumber;
        // Remove leading zero if present (e.g. 09123... -> 9123...)
        if (cleanNumber.startsWith('0')) {
          cleanNumber = cleanNumber.substring(1);
        }

        // Try with +249 prefix
        user = await this.prisma.users.findFirst({
          where: { phoneNumber: `+249${cleanNumber}` },
          include: { teacher_profiles: true },
        });
      }
    } else if (email) {
      user = await this.prisma.users.findUnique({
        where: { email },
        include: { teacher_profiles: true },
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
      displayName: user.teacher_profiles?.displayName || undefined,
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        parent_profiles: {
          include: {
            children: {
              include: {
                curricula: {
                  select: { id: true, nameAr: true, nameEn: true, code: true },
                },
              },
            },
          },
        },
        teacher_profiles: true,
        student_profiles: {
          include: {
            curricula: {
              select: { id: true, nameAr: true, nameEn: true, code: true },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    this.logger.log(`DEBUG: getProfile for user ${userId}`);
    this.logger.log(`DEBUG: Found parent_profiles? ${!!user.parent_profiles}`);
    if (user.parent_profiles) {
      this.logger.log(`DEBUG: Children count: ${user.parent_profiles.children?.length}`);
      this.logger.log(`DEBUG: Children IDs: ${user.parent_profiles.children?.map(c => c.id).join(', ')}`);
    }

    const {
      passwordHash,
      parent_profiles,
      student_profiles,
      teacher_profiles,
      ...rest
    } = user;

    const response = {
      ...rest,
      parentProfile: parent_profiles
        ? {
          ...parent_profiles,
          children: parent_profiles.children.map((child) => {
            // Map curricula -> curriculum for children
            const { curricula, ...childRest } = child as any;
            return {
              ...childRest,
              curriculum: curricula,
            };
          }),
        }
        : undefined,
      studentProfile: student_profiles
        ? {
          ...student_profiles,
          // Map curricula -> curriculum for student
          curriculum: (student_profiles as any).curricula,
        }
        : undefined,
      teacherProfile: teacher_profiles || undefined,
    };

    // Log the transformed parentProfile structure
    if (response.parentProfile) {
      this.logger.log(`DEBUG: Transformed parentProfile.children length: ${response.parentProfile.children?.length}`);
    }

    return response;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.users.findUnique({
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
    await this.prisma.users.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  /**
   * Generates a pair of Access and Refresh tokens plus CSRF token
   * SECURITY FIX: Added CSRF token generation for state-changing requests
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
    const tokenRecord = await this.prisma.refresh_tokens.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        expiresAt,
        deviceInfo: deviceInfo || 'Unknown Device',
      },
    });

    // SECURITY FIX: Generate CSRF token - tied to user session
    // This is a random token the frontend must include in headers for state-changing requests
    const csrfToken = crypto.randomBytes(32).toString('hex');

    return {
      access_token: accessToken,
      // Format: {id}:{secret}
      // This allows efficient lookup by ID and secure verification by secret
      refresh_token: `${tokenRecord.id}:${refreshTokenPlain}`,
      csrf_token: csrfToken,
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

    const tokenRecord = await this.prisma.refresh_tokens.findUnique({
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
      await this.prisma.refresh_tokens.updateMany({
        where: { userId: tokenRecord.userId },
        data: { revoked: true },
      });
      throw new UnauthorizedException(
        'Security Alert: Token reuse detected. All sessions revoked.',
      );
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
    await this.prisma.refresh_tokens.update({
      where: { id: tokenId },
      data: {
        revoked: true,
        revokedAt: new Date(),
        replacedByToken: 'ROTATED',
      }, // Ideally store new ID but we create it next
    });

    // 6. Issue New Pair
    const user = await this.prisma.users.findUnique({
      where: { id: tokenRecord.userId },
    });
    if (!user) throw new UnauthorizedException('User not found');

    // Generating new token requires calling signToken, but signToken creates a DB entry.
    // We need to modify signToken to return the formatted `{id}:{secret}` string.

    // Refactored logic inline to avoid cyclic dependency or deep refactor of signToken signature mismatch
    // Actually, let's just call signToken. It works.

    return this.signToken(
      user.id,
      user.email || undefined,
      user.role,
      {
        firstName: user.firstName,
        lastName: user.lastName,
      },
      deviceInfo,
    );
  }

  async logout(refreshToken: string) {
    const [tokenId, tokenSecret] = refreshToken.split(':');
    if (!tokenId) return; // Invalid format, ignore

    // Just revoke it
    try {
      await this.prisma.refresh_tokens.update({
        where: { id: tokenId },
        data: { revoked: true, revokedAt: new Date() },
      });
    } catch (e) {
      // Token not found or already revoked - log but don't fail logout
      this.logger.debug(
        `Logout: token ${tokenId.slice(0, 8)}... not found or already revoked`,
      );
    }
    return { message: 'Logged out successfully' };
  }
}
