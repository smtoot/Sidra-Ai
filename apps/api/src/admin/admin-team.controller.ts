import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PERMISSIONS, ALL_PERMISSIONS, CREATABLE_ADMIN_ROLES, ROLE_PERMISSIONS } from '../auth/permissions.constants';
import { AdminTeamService } from './admin-team.service';
import { PermissionService } from '../auth/permission.service';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsEmail, IsOptional, IsIn, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// DTOs
class CreateAdminUserDto {
    @IsEmail()
    email: string;

    @IsString()
    phoneNumber: string;

    @IsString()
    password: string;

    @IsString()
    @IsIn(CREATABLE_ADMIN_ROLES as unknown as string[])
    role: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    permissionOverrides?: { add?: string[]; remove?: string[] };
}

class UpdatePermissionsDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    add?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    remove?: string[];
}

/**
 * AdminTeamController
 * 
 * Endpoints for managing admin/moderator users.
 * All endpoints require admins.view or admins.create permissions.
 */
@Controller('admin/team')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminTeamController {
    constructor(
        private adminTeamService: AdminTeamService,
        private permissionService: PermissionService,
        private prisma: PrismaService,
    ) { }

    /**
     * List all admin users
     */
    @Get()
    @RequirePermissions(PERMISSIONS.ADMINS_VIEW)
    async listAdminUsers() {
        return this.adminTeamService.listAdminUsers();
    }

    /**
     * Get available roles and permissions for UI
     */
    @Get('config')
    @RequirePermissions(PERMISSIONS.ADMINS_VIEW)
    async getConfig() {
        return {
            creatableRoles: CREATABLE_ADMIN_ROLES,
            allPermissions: ALL_PERMISSIONS,
            rolePermissions: ROLE_PERMISSIONS,
        };
    }

    /**
     * Get a single admin user
     */
    @Get(':id')
    @RequirePermissions(PERMISSIONS.ADMINS_VIEW)
    async getAdminUser(@Param('id') id: string) {
        return this.adminTeamService.getAdminUser(id);
    }

    /**
     * Create a new admin user
     */
    @Post()
    @RequirePermissions(PERMISSIONS.ADMINS_CREATE)
    async createAdminUser(@Req() req: any, @Body() dto: CreateAdminUserDto) {
        const actorId = req.user.userId;

        // Get actor role from DB (security: don't trust JWT)
        const actor = await this.prisma.user.findUnique({
            where: { id: actorId },
            select: { role: true }
        });

        if (!actor) {
            throw new Error('Actor not found');
        }

        return this.adminTeamService.createAdminUser(
            actorId,
            actor.role,
            dto
        );
    }

    /**
     * Update permission overrides for an admin user
     */
    @Patch(':id/permissions')
    @RequirePermissions(PERMISSIONS.ADMINS_CREATE)
    async updatePermissions(
        @Req() req: any,
        @Param('id') targetId: string,
        @Body() dto: UpdatePermissionsDto
    ) {
        const actorId = req.user.userId;

        // Get actor role from DB (security: don't trust JWT)
        const actor = await this.prisma.user.findUnique({
            where: { id: actorId },
            select: { role: true }
        });

        if (!actor) {
            throw new Error('Actor not found');
        }

        return this.adminTeamService.updatePermissionOverrides(
            actorId,
            actor.role,
            targetId,
            dto
        );
    }

    /**
     * Deactivate an admin user
     */
    @Delete(':id')
    @RequirePermissions(PERMISSIONS.ADMINS_CREATE)
    async deactivateAdminUser(@Req() req: any, @Param('id') targetId: string) {
        const actorId = req.user.userId;

        // Get actor role from DB (security: don't trust JWT)
        const actor = await this.prisma.user.findUnique({
            where: { id: actorId },
            select: { role: true }
        });

        if (!actor) {
            throw new Error('Actor not found');
        }

        return this.adminTeamService.deactivateAdminUser(
            actorId,
            actor.role,
            targetId
        );
    }

    /**
     * Get current user's effective permissions
     * Useful for frontend to know what to show
     */
    @Get('me/permissions')
    @RequirePermissions(PERMISSIONS.ADMINS_VIEW)
    async getMyPermissions(@Req() req: any) {
        const userId = req.user.userId;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, permissionOverrides: true }
        });

        if (!user) {
            throw new Error('User not found');
        }

        return {
            role: user.role,
            effectivePermissions: this.permissionService.getEffectivePermissions({
                role: user.role,
                permissionOverrides: user.permissionOverrides as any
            })
        };
    }
}
