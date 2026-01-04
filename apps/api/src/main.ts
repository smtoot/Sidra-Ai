import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // SECURITY FIX: Enable cookie parsing for httpOnly auth tokens
  app.use(cookieParser());

  // SECURITY: Set standard HTTP security headers (HSTS, X-Frame-Options, etc.)
  // Configure helmet to allow cross-origin resources for API endpoints
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow files to be loaded cross-origin
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Allow popups for OAuth flows
    }),
  );

  // SECURITY: Enable global validation for all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Require explicit @Type() decorators
      },
    }),
  );

  // SECURITY: Restrict CORS to allowed origins only
  // Default includes common Next.js dev ports (3000, 3001, 3002)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://sidra-staging.up.railway.app',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
  ];
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // SECURITY: Limit request body size to prevent DoS attacks
  // File uploads are handled separately with their own limits (5MB in upload.service.ts)
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  await app.listen(process.env.PORT ?? 4000);
}
// Trigger redeploy for CORS fix - 2025-12-30
bootstrap();
