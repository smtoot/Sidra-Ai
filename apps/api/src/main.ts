import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { NestExpressApplication } from '@nestjs/platform-express';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // STABILITY: Enable graceful shutdown hooks
  // This ensures Prisma connections are properly closed on shutdown
  app.enableShutdownHooks();

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

  // SECURITY: Restrict CORS to allowed origins from environment variable only
  // Set ALLOWED_ORIGINS in .env (comma-separated, no spaces)
  // Example: ALLOWED_ORIGINS=https://app.sidra-ai.com,https://admin.sidra-ai.com
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  if (!allowedOriginsEnv) {
    throw new Error(
      'ALLOWED_ORIGINS environment variable is required. Set comma-separated allowed origins.',
    );
  }
  const allowedOrigins = allowedOriginsEnv
    .split(',')
    .map((origin) => origin.trim());

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

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);

  // STABILITY: Handle uncaught exceptions and unhandled rejections
  // These prevent silent crashes and ensure proper logging
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Give time for logs to flush before exit
    setTimeout(() => process.exit(1), 1000);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // STABILITY: Handle termination signals for Railway deployments
  // Railway sends SIGTERM before killing the container
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, () => {
      logger.log(`Received ${signal}, starting graceful shutdown...`);
      app
        .close()
        .then(() => {
          logger.log('Application closed gracefully');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        });
    });
  }
}
bootstrap();
