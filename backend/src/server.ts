import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { seedDatabase } from './scripts/seed.js';
import { logger } from './shared/utils/logger.js';

async function bootstrap() {
  try {
    // 1. Connect to Database
    try {
      await connectDatabase();
      // 2. Seed initial data if DB is empty
      await seedDatabase(false);
    } catch (dbErr) {
      logger.warn(`Database connection warning: ${(dbErr as Error).message}`);
    }

    // 3. Initialize Express App
    const app = createApp();
    const server = http.createServer(app);

    server.listen(env.PORT, () => {
      logger.info(`🚀Server is running on http://localhost:${env.PORT}`);
      logger.info(` AI Revenue Recovery API running on http://localhost:${env.PORT}`);
      logger.info(`📚 Swagger UI Documentation: http://localhost:${env.PORT}/api-docs`);
      logger.info(`⚡ Environment: ${env.NODE_ENV}`);
      logger.info(`🤖 AI Provider: ${env.LLM_PROVIDER}`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();

