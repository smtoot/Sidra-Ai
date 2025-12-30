import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigValidationService implements OnModuleInit {
  private readonly logger = new Logger(ConfigValidationService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Validate critical environment variables on app startup
   * Fail fast if required config is missing
   */
  onModuleInit() {
    this.logger.log('🔍 Validating environment configuration...');

    const errors: string[] = [];

    // CRITICAL: Database
    if (!this.configService.get('DATABASE_URL')) {
      errors.push('DATABASE_URL is required');
    }

    // CRITICAL: JWT Authentication
    if (!this.configService.get('JWT_SECRET')) {
      errors.push('JWT_SECRET is required');
    }

    // OPTIONAL (with warnings): AWS S3
    if (
      !this.configService.get('AWS_ACCESS_KEY_ID') ||
      !this.configService.get('AWS_SECRET_ACCESS_KEY')
    ) {
      this.logger.warn(
        '⚠️  AWS credentials not configured - file upload will be disabled',
      );
    } else {
      this.logger.log('✅ AWS S3 configured');
    }

    // OPTIONAL (with warnings): SendGrid
    if (!this.configService.get('SENDGRID_API_KEY')) {
      this.logger.warn(
        '⚠️  SENDGRID_API_KEY not configured - email will be logged only (phone-first: this is acceptable)',
      );
    } else {
      this.logger.log('✅ SendGrid configured');
    }

    // PHONE-FIRST: No phone auth config required for MVP (manual password reset via admin)

    // Fatal errors block startup
    if (errors.length > 0) {
      this.logger.error('❌ Critical configuration missing:');
      errors.forEach((err) => this.logger.error(`   - ${err}`));
      throw new Error(
        `Application startup failed: Missing critical environment variables`,
      );
    }

    this.logger.log('✅ Environment configuration validated successfully');
  }
}
