import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';

export interface ServiceHealth {
  status: 'ok' | 'error' | 'degraded';
  latencyMs?: number;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    email: ServiceHealth;
    storage: ServiceHealth;
  };
}

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    const timestamp = new Date().toISOString();
    const version = process.env.npm_package_version || '1.0.0';

    // Check all services in parallel
    const [database, email, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkEmailService(),
      this.checkStorageService(),
    ]);

    // Determine overall status
    const services = { database, email, storage };
    const statuses = Object.values(services).map((s) => s.status);

    let overallStatus: 'ok' | 'error' | 'degraded' = 'ok';
    if (statuses.includes('error')) {
      // Database error = full error, other services = degraded
      overallStatus = database.status === 'error' ? 'error' : 'degraded';
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp,
      version,
      uptime: process.uptime(),
      services,
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        error: 'Database connection failed',
      };
    }
  }

  private async checkEmailService(): Promise<ServiceHealth> {
    // Check if email service is configured
    const resendKey = this.configService.get<string>('RESEND_API_KEY');
    const sendgridKey = this.configService.get<string>('SENDGRID_API_KEY');

    if (!resendKey && !sendgridKey) {
      return {
        status: 'degraded',
        error: 'No email service configured',
      };
    }

    // Check for pending emails stuck in queue (potential issue indicator)
    try {
      const stuckEmails = await this.prisma.email_outbox.count({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: new Date(Date.now() - 30 * 60 * 1000), // Older than 30 minutes
          },
        },
      });

      if (stuckEmails > 10) {
        return {
          status: 'degraded',
          error: `${stuckEmails} emails stuck in queue`,
        };
      }

      return { status: 'ok' };
    } catch {
      return { status: 'ok' }; // Don't fail health check if this query fails
    }
  }

  private async checkStorageService(): Promise<ServiceHealth> {
    // Check if storage is configured
    const r2AccessKey = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const awsAccessKey = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const localPath = this.configService.get<string>('UPLOAD_LOCAL_PATH');

    if (!r2AccessKey && !awsAccessKey && !localPath) {
      return {
        status: 'degraded',
        error: 'No storage service configured',
      };
    }

    return { status: 'ok' };
  }
}
