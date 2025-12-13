import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { TeacherModule } from './teacher/teacher.module';
import { WalletModule } from './wallet/wallet.module';
import { BookingModule } from './booking/booking.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 10, // 10 requests per minute (global default)
    }]),
    PrismaModule,
    AuthModule,
    TeacherModule,
    MarketplaceModule,
    WalletModule,
    BookingModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
