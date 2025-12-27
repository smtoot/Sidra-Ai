import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { ValidationPipe } from '@nestjs/common';

import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  // SECURITY: Enable global validation for all DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // Strip properties not in DTO
    forbidNonWhitelisted: true,   // Throw error on unknown properties
    transform: true,              // Auto-transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: false  // Require explicit @Type() decorators
    }
  }));

  // SECURITY: Restrict CORS to allowed origins only
  // Default includes common Next.js dev ports (3000, 3001, 3002)
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
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
    credentials: true,  // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // SECURITY: Limit request body size to prevent DoS attacks
  // File uploads are handled separately with their own limits (5MB in upload.service.ts)
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  await app.listen(process.env.PORT ?? 4000);
}
// Trigger restart 2
bootstrap();
