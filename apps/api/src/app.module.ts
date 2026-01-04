import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CsrfGuard } from './auth/csrf.guard';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { FavoritesModule } from './favorites/favorites.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { TeacherModule } from './teacher/teacher.module';
import { WalletModule } from './wallet/wallet.module';
import { BookingModule } from './booking/booking.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { ParentModule } from './parent/parent.module';
import { StudentModule } from './student/student.module';
import { NotificationModule } from './notification/notification.module';
import { StorageModule } from './common/storage/storage.module';
import { ConfigValidationService } from './common/config/config-validation.service';
import { PackageModule } from './package/package.module';
import { TeachingApproachModule } from './teaching-approach/teaching-approach.module';
import { SupportTicketModule } from './support-ticket/support-ticket.module';
import { PostHogModule } from './common/posthog/posthog.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests per minute (global default)
      },
    ]),
    ScheduleModule.forRoot(), // Enable cron jobs for escrow auto-release
    PrismaModule,
    CommonModule,
    AuthModule,
    TeacherModule,
    MarketplaceModule,
    WalletModule,
    BookingModule,
    UserModule,
    AdminModule,
    ParentModule,
    StudentModule,
    NotificationModule,
    StorageModule,
    PackageModule,
    TeachingApproachModule,
    FavoritesModule,
    SupportTicketModule,
    PostHogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConfigValidationService,
    // SECURITY: Global exception filter - sanitizes all error responses
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // SECURITY: Global authentication guard - all routes require JWT by default
    // Use @Public() decorator to mark routes as public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // SECURITY FIX: Global CSRF guard for state-changing requests
    // Validates X-CSRF-Token header matches csrf_token cookie
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule {}
