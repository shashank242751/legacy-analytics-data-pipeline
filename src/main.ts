/**
 * MAIN.TS — Application Entry Point
 * ====================================
 * Bootstraps the NestJS ETL middleware server.
 * Responsibilities:
 *  - CORS setup
 *  - Global validation pipe
 *  - Server startup logs with all available routes
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // ─── Create App ───────────────────────────────────────────────────────────
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  // ─── CORS ─────────────────────────────────────────────────────────────────
  // Allows frontend (127.0.0.1 / localhost) to call this API directly
  app.enableCors();

  // ─── Global Validation Pipe ───────────────────────────────────────────────
  // Strips unknown fields & auto-transforms query params to correct types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Start Server ─────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  // ─── Startup Route Map ────────────────────────────────────────────────────
  logger.log(`🚀 ETL Middleware running → http://localhost:${port}`);
  logger.log(`──────────────────────────────────────────────`);
  logger.log(`🔵 BigQuery`);
  logger.log(`   GET  /bigquery/health               → BigQuery connection check`);
  logger.log(`   GET  /bigquery/records?year=&month= → Preview raw BigQuery rows`);
  logger.log(`──────────────────────────────────────────────`);
  logger.log(`🟢 PostgreSQL`);
  logger.log(`   GET  /postgres/health               → PostgreSQL connection check`);
  logger.log(`   GET  /postgres/records?limit=       → Inspect legacy table rows`);
  logger.log(`   POST /postgres/sync?year=&month=    → Trigger ETL sync manually`);
  logger.log(`──────────────────────────────────────────────`);
}

void bootstrap();

