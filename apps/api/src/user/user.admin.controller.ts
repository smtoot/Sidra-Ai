import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Query,
  NotFoundException,
  Logger,
  Body,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@sidra/shared';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserAdminController {
  private readonly logger = new Logger(UserAdminController.name);

  constructor(private readonly userService: UserService) { }

  @Get()
  getUsers(@Query('query') query: string) {
    this.logger.debug('GET /admin/users hit', { query });
    return this.userService.getUsers(query);
  }

  @Patch(':id/ban')
  async toggleBan(@Param('id') id: string) {
    // Since we don't have isBanned yet, we'll act as if we are toggling
    // but since we cannot modify schema mid-flight without migration,
    // we might return a 'Feature not ready' or just return the user for now.
    // Wait, I can add 'isActive' to schema quickly by checking schema again?
    // Schema has `isActive Boolean @default(true)`.
    // So we can toggle `isActive`.
    const user = await this.userService.toggleBan(id);

    // Actually implementing toggleBan properly in service now that I recall schema exists
    return user;
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { email?: string; phoneNumber?: string; firstName?: string; lastName?: string },
  ) {
    this.logger.debug(`PATCH /admin/users/${id} hit`, { body });
    return this.userService.updateUser(id, body);
  }
}
