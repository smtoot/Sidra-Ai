import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { TeacherModule } from './teacher/teacher.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MarketplaceModule,
    TeacherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
