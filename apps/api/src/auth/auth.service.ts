import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { RegisterDto, LoginDto } from '@sidra/shared';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    // PHONE-FIRST: Check by phone number (primary identifier), not email
    const existingByPhone = dto.phoneNumber ? await this.prisma.user.findFirst({
      where: { phoneNumber: dto.phoneNumber },
    }) : null;

    if (existingByPhone) {
      throw new ConflictException('Phone number already registered');
    }

    // Optional: Also check email if provided
    if (dto.email) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingByEmail) {
        throw new ConflictException('Email already registered');
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
    // PHONE-FIRST: Try phone number first, fallback to email
    let user = null;

    if (dto.phoneNumber) {
      user = await this.prisma.user.findFirst({
        where: { phoneNumber: dto.phoneNumber },
        include: { teacherProfile: true }
      });
    } else if (dto.email) {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        include: { teacherProfile: true }
      });
    }

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email || undefined, user.role, {
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.teacherProfile?.displayName || undefined
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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedException('User not found');

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة');

    // Validate new password length
    if (newPassword.length < 6) {
      throw new UnauthorizedException('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  private async signToken(
    userId: string,
    email: string | undefined,
    role: string,
    profileData?: { firstName?: string | null, lastName?: string | null, displayName?: string | null }
  ) {
    const payload = {
      sub: userId,
      email,
      role,
      firstName: profileData?.firstName || undefined,
      lastName: profileData?.lastName || undefined,
      // If a specific displayName is provided (e.g. from teacher profile), use it.
      // Otherwise frontend can construct it from firstName/lastName.
      displayName: profileData?.displayName || undefined
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
