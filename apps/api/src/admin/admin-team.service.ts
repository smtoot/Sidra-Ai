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
import {
  CREATABLE_ADMIN_ROLES,
  ADMIN_ROLES,
  type PermissionOverrides,
} from '../auth/permissions.constants';
import { UserRole } from '@prisma/client';
import * as crypto from 'crypto';

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
  ) { }

  /**
   * List all admin users (non-regular users)
   */
  async listAdminUsers() {
    // Use typed admin roles from constants
    const adminRoles: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.MODERATOR,
      UserRole.CONTENT_ADMIN,
      UserRole.FINANCE,
      UserRole.SUPPORT,
    ];

    const users = await this.prisma.users.findMany({
      where: {
        role: { in: adminRoles },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add effective permissions for each user
    return users.map((user) => ({
      ...user,
      effectivePermissions: this.permissionService.getEffectivePermissions({
        role: user.role,
        permissionOverrides:
          user.permissionOverrides as PermissionOverrides | null,
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
    const creatableRoles: readonly string[] = CREATABLE_ADMIN_ROLES;
    if (!creatableRoles.includes(data.role)) {
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
      ? await this.prisma.users.findUnique({
        where: { email: data.email },
      })
      : null;

    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingPhone = await this.prisma.users.findFirst({
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
    const user = await this.prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        email: data.email,
        phoneNumber: data.phoneNumber,
        passwordHash,
        role: data.role as UserRole,
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
    await this.prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
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
        permissionOverrides:
          user.permissionOverrides as PermissionOverrides | null,
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
    const targetUser = await this.prisma.users.findUnique({
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

    // Update user - cast to JSON-compatible type for Prisma
    const updatedUser = await this.prisma.users.update({
      where: { id: targetUserId },
      data: { permissionOverrides: JSON.parse(JSON.stringify(overrides)) },
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
    await this.prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
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
        permissionOverrides:
          updatedUser.permissionOverrides as PermissionOverrides | null,
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
    const targetUser = await this.prisma.users.findUnique({
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
    await this.prisma.users.update({
      where: { id: targetUserId },
      data: { isActive: false },
    });

    // Audit log
    await this.prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
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
    const user = await this.prisma.users.findUnique({
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
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify it's an admin role - use ADMIN_ROLES constant
    const adminRolesSet: readonly string[] = ADMIN_ROLES;
    if (!adminRolesSet.includes(user.role)) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      effectivePermissions: this.permissionService.getEffectivePermissions({
        role: user.role,
        permissionOverrides:
          user.permissionOverrides as PermissionOverrides | null,
      }),
    };
  }
}
