import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PermissionService } from './permission.service';
import { PermissionsGuard } from './permissions.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');

        // SECURITY: Fail fast if JWT_SECRET not set - never use fallback
        if (!secret) {
          throw new Error(
            'CRITICAL: JWT_SECRET environment variable is not set. ' +
              'Generate a strong secret with: openssl rand -base64 64',
          );
        }

        // SECURITY: Warn if using weak development secret
        if (
          secret === 'test-secret-key-for-development' ||
          secret === 'dev_secret'
        ) {
          console.warn(
            '⚠️  WARNING: Using development JWT_SECRET in production is INSECURE! ' +
              'Generate a strong secret with: openssl rand -base64 64',
          );
        }

        return {
          secret,
          signOptions: { expiresIn: '60m' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PermissionService, PermissionsGuard],
  exports: [AuthService, PermissionService, PermissionsGuard],
})
export class AuthModule {}
