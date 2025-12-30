import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { PermissionService } from '../auth/permission.service';
import { CREATABLE_ADMIN_ROLES } from '../auth/permissions.constants';
import type { PermissionOverrides } from '../auth/permissions.constants';

/**
 * AdminTeamService
 *
 * Manages admin/moderator users with full security constraints:
 * - SUPER_ADMIN cannot be created via API (bootstrap only)
 * - SUPER_ADMIN cannot be modified
 * - Users cannot modify their own permissions
 * - Permission overrides are validated
 */
@Injectable()
export class AdminTeamService {
  constructor(
    private prisma: PrismaService,
    private permissionService: PermissionService,
  ) {}

  /**
   * List all admin users (non-regular users)
   */
  async listAdminUsers() {
    const adminRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'MODERATOR',
      'CONTENT_ADMIN',
      'FINANCE',
      'SUPPORT',
    ];

    const users = await this.prisma.user.findMany({
      where: {
        role: { in: adminRoles as any },
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        permissionOverrides: true,
        createdByAdminId: true,
        createdByAdmin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add effective permissions for each user
    return users.map((user) => ({
      ...user,
      effectivePermissions: this.permissionService.getEffectivePermissions({
        role: user.role,
        permissionOverrides: user.permissionOverrides as any,
      }),
    }));
  }

  /**
   * Create a new admin user
   *
   * SECURITY:
   * - SUPER_ADMIN cannot be created via this API
   * - Only creatable admin roles allowed
   * - Password hashed before storage
   * - Audit trail via createdByAdminId
   */
  async createAdminUser(
    creatorId: string,
    creatorRole: string,
    data: {
      email: string;
      phoneNumber: string;
      password: string;
      role: string;
      firstName?: string;
      lastName?: string;
      permissionOverrides?: PermissionOverrides;
    },
  ) {
    // SECURITY: Cannot create SUPER_ADMIN via API
    if (data.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('SUPER_ADMIN cannot be created via API');
    }

    // SECURITY: Only allow creatable admin roles
    if (!CREATABLE_ADMIN_ROLES.includes(data.role as any)) {
      throw new BadRequestException(
        `Invalid role: ${data.role}. Allowed roles: ${CREATABLE_ADMIN_ROLES.join(', ')}`,
      );
    }

    // SECURITY: Only SUPER_ADMIN can create ADMINs
    if (data.role === 'ADMIN' && creatorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can create ADMIN users');
    }

    // Check for existing user
    const existingEmail = data.email
      ? await this.prisma.user.findUnique({
          where: { email: data.email },
        })
      : null;

    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingPhone = await this.prisma.user.findFirst({
      where: { phoneNumber: data.phoneNumber },
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already in use');
    }

    // Validate permission overrides if provided
    if (data.permissionOverrides) {
      const errors = this.permissionService.validateOverrides(
        data.permissionOverrides,
      );
      if (errors.length > 0) {
        throw new BadRequestException(
          `Invalid permission overrides: ${errors.join(', ')}`,
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        phoneNumber: data.phoneNumber,
        passwordHash,
        role: data.role as any,
        firstName: data.firstName,
        lastName: data.lastName,
        permissionOverrides: data.permissionOverrides
          ? JSON.parse(JSON.stringify(data.permissionOverrides))
          : undefined,
        createdByAdminId: creatorId,
        isVerified: true, // Admin-created users are verified
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        permissionOverrides: true,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'ADMIN_USER_CREATED',
        actorId: creatorId,
        targetId: user.id,
        payload: { role: data.role, email: data.email },
      },
    });

    return {
      ...user,
      effectivePermissions: this.permissionService.getEffectivePermissions({
        role: user.role,
        permissionOverrides: user.permissionOverrides as any,
      }),
    };
  }

  /**
   * Update permission overrides for a user
   *
   * SECURITY:
   * - SUPER_ADMIN cannot be modified
   * - Users cannot modify their own permissions
   * - Permission overrides are validated
   * - Changes are audit logged
   */
  async updatePermissionOverrides(
    actorId: string,
    actorRole: string,
    targetUserId: string,
    overrides: PermissionOverrides,
  ) {
    // SECURITY: Self-escalation prevention
    if (actorId === targetUserId) {
      throw new ForbiddenException('Cannot modify your own permissions');
    }

    // Get target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, permissionOverrides: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // SECURITY: SUPER_ADMIN cannot be modified
    if (targetUser.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'SUPER_ADMIN permissions cannot be modified',
      );
    }

    // SECURITY: Only SUPER_ADMIN can modify ADMIN permissions
    if (targetUser.role === 'ADMIN' && actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can modify ADMIN permissions',
      );
    }

    // Validate overrides
    const errors = this.permissionService.validateOverrides(overrides);
    if (errors.length > 0) {
      throw new BadRequestException(
        `Invalid permission overrides: ${errors.join(', ')}`,
      );
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { permissionOverrides: overrides as any },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        permissionOverrides: true,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'PERMISSION_OVERRIDE_UPDATE',
        actorId: actorId,
        targetId: targetUserId,
        payload: JSON.parse(JSON.stringify(overrides)),
      },
    });

    return {
      ...updatedUser,
      effectivePermissions: this.permissionService.getEffectivePermissions({
        role: updatedUser.role,
        permissionOverrides: updatedUser.permissionOverrides as any,
      }),
    };
  }

  /**
   * Deactivate an admin user
   *
   * SECURITY:
   * - SUPER_ADMIN cannot be deactivated
   * - Users cannot deactivate themselves
   */
  async deactivateAdminUser(
    actorId: string,
    actorRole: string,
    targetUserId: string,
  ) {
    // SECURITY: Self-deactivation prevention
    if (actorId === targetUserId) {
      throw new ForbiddenException('Cannot deactivate yourself');
    }

    // Get target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // SECURITY: SUPER_ADMIN cannot be deactivated
    if (targetUser.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('SUPER_ADMIN cannot be deactivated');
    }

    // SECURITY: Only SUPER_ADMIN can deactivate ADMIN
    if (targetUser.role === 'ADMIN' && actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can deactivate ADMIN users',
      );
    }

    // Deactivate (soft delete)
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'ADMIN_USER_DEACTIVATED',
        actorId: actorId,
        targetId: targetUserId,
        payload: { role: targetUser.role },
      },
    });

    return { success: true, message: 'User deactivated' };
  }

  /**
   * Get a single admin user by ID
   */
  async getAdminUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        permissionOverrides: true,
        createdByAdminId: true,
        createdByAdmin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify it's an admin role
    const adminRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'MODERATOR',
      'CONTENT_ADMIN',
      'FINANCE',
      'SUPPORT',
    ];
    if (!adminRoles.includes(user.role)) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      effectivePermissions: this.permissionService.getEffectivePermissions({
        role: user.role,
        permissionOverrides: user.permissionOverrides as any,
      }),
    };
  }
}
