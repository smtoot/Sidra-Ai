import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ParentService } from './parent.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@sidra/shared';
import {
  UpdateParentProfileDto,
  CreateChildDto,
  UpdateChildDto,
} from './dto';

/**
 * Authenticated request interface for parent endpoints
 */
interface AuthRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('parent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  /**
   * Get parent dashboard stats including wallet balance, upcoming classes, and children
   * Rate limited to prevent excessive DB load
   */
  @Get('dashboard')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  getDashboardStats(@Request() req: AuthRequest) {
    return this.parentService.getDashboardStats(req.user.userId);
  }

  /**
   * Get parent profile information
   */
  @Get('profile')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  getProfile(@Request() req: AuthRequest) {
    return this.parentService.getProfile(req.user.userId);
  }

  /**
   * Update parent profile
   * Rate limited to prevent spam updates
   */
  @Patch('profile')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 updates per minute
  updateProfile(
    @Request() req: AuthRequest,
    @Body() data: UpdateParentProfileDto,
  ) {
    return this.parentService.updateProfile(req.user.userId, data);
  }

  /**
   * Get all children for the parent
   */
  @Get('children')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  getChildren(@Request() req: AuthRequest) {
    return this.parentService.getChildren(req.user.userId);
  }

  /**
   * Get a specific child's details
   * Uses ParseUUIDPipe to validate the child ID format
   */
  @Get('children/:id')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  getChild(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.parentService.getChild(req.user.userId, id);
  }

  /**
   * Add a new child to the parent's account
   * Rate limited to prevent spam child creation
   */
  @Post('children')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 children per minute (generous limit)
  addChild(@Request() req: AuthRequest, @Body() body: CreateChildDto) {
    return this.parentService.addChild(req.user.userId, body);
  }

  /**
   * Update an existing child's information
   * Uses ParseUUIDPipe to validate the child ID format
   */
  @Patch('children/:id')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 updates per minute
  updateChild(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateChildDto,
  ) {
    return this.parentService.updateChild(req.user.userId, id, body);
  }

  /**
   * Get all available curricula with their educational stages and grade levels
   * Cached on client side, rate limited to prevent abuse
   */
  @Get('curricula')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  getCurricula() {
    return this.parentService.getCurricula();
  }
}
