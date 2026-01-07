import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('tour-completed')
  async markTourCompleted(@Req() req: AuthRequest) {
    await this.userService.markTourCompleted(req.user.userId);
    return { success: true };
  }
}
