import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRES_APPROVAL_KEY } from './requires-approval.decorator';

/**
 * Guard that checks if a teacher is approved before allowing access to operational routes.
 * Use with @RequiresApproval() decorator.
 *
 * Only applies to users with role TEACHER.
 * Non-teacher users (ADMIN, PARENT, STUDENT) bypass this check.
 */
@Injectable()
export class ApprovalGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route requires approval
    const requiresApproval = this.reflector.get<boolean>(
      REQUIRES_APPROVAL_KEY,
      context.getHandler(),
    );

    if (!requiresApproval) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user (shouldn't happen with JwtAuthGuard), deny
    if (!user) {
      throw new ForbiddenException('مطلوب تسجيل الدخول');
    }

    // Only check approval for teachers
    if (user.role !== 'TEACHER') {
      return true;
    }

    // Check teacher's application status
    const profile = await this.prisma.teacher_profiles.findUnique({
      where: { userId: user.userId },
      select: { applicationStatus: true },
    });

    if (!profile) {
      throw new ForbiddenException('لم يتم العثور على ملف المعلم');
    }

    if (profile.applicationStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'يجب أن يتم قبول طلبك قبل استخدام هذه الميزة',
      );
    }

    return true;
  }
}
