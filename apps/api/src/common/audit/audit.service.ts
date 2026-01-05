import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log an admin or system action
   * Safely handles payload sanitization
   */
  async logAction(context: {
    action: AuditAction;
    actorId: string;
    targetId?: string;
    payload?: any;
  }) {
    try {
      const sanitizedPayload = this.sanitizePayload(context.payload);

      await this.prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          action: context.action,
          actorId: context.actorId,
          targetId: context.targetId,
          payload: sanitizedPayload as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      // Audit logging should essentially never fail the main request,
      // but we must log the failure to stderr
      this.logger.error(
        `Failed to create audit log for ${context.action}`,
        error,
      );
    }
  }

  /**
   * Strip sensitive fields from payload
   */
  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload;

    const SENSITIVE_KEYS = [
      'password',
      'passwordHash',
      'token',
      'secret',
      'auth',
      'authorization',
      'cvv',
      'creditCard',
      'apiKey',
      'accessToken',
      'refreshToken',
    ];

    // Deep copy to avoid mutating original
    const clean: any = Array.isArray(payload) ? [] : {};

    for (const key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        // Check if key is sensitive
        if (
          SENSITIVE_KEYS.some((k) =>
            key.toLowerCase().includes(k.toLowerCase()),
          )
        ) {
          clean[key] = '[REDACTED]';
        } else if (typeof payload[key] === 'object' && payload[key] !== null) {
          // Recurse
          clean[key] = this.sanitizePayload(payload[key]);
        } else {
          clean[key] = payload[key];
        }
      }
    }

    return clean;
  }

  /**
   * Get paginated logs for Admin UI
   */
  async getLogs(params: {
    page?: number;
    limit?: number;
    action?: AuditAction;
    actorId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.audit_logsWhereInput = {
      ...(params.action && { action: params.action }),
      ...(params.actorId && { actorId: params.actorId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.audit_logs.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: { email: true, role: true },
          },
        },
      }),
      this.prisma.audit_logs.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
