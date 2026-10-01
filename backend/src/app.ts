import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { requestIdMiddleware } from './shared/middleware/request-id.middleware.js';
import { notFoundMiddleware } from './shared/middleware/not-found.middleware.js';
import { errorHandlerMiddleware } from './shared/middleware/error-handler.middleware.js';

import { revenueEventRoutes } from './modules/revenue-events/revenue-event.routes.js';
import { recoveryCaseRoutes } from './modules/recovery/recovery.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { demoRoutes } from './modules/demo/demo.routes.js';
import { activityRoutes } from './modules/activity/activity.routes.js';
import { policySettingsRoutes } from './modules/settings/policy-settings.routes.js';

export function createApp(): Express {
  const app = express();

  // Security & standard middlewares
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
        },
      },
    })
  );

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((s) => s.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        // Allow any localhost / 127.0.0.1 port in development or configured origins
        if (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('https://localhost:') ||
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes('*')
        ) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);

  // Health Check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Raw JSON endpoints for OpenAPI schema (mounted before UI handler)
  app.get('/api-docs/json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });
  app.get('/docs/json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });
  app.get('/api/v1/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });

  // Swagger UI & OpenAPI Documentation
  const swaggerUiOptions = {
    customSiteTitle: 'AI Revenue Recovery API Documentation',
    customCss: '.swagger-ui .topbar { display: flex; } .swagger-ui .topbar-wrapper .link { display: flex; align-items: center; }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      displayRequestDuration: true,
    },
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // API v1 Routes
  app.use('/api/v1/revenue-events', revenueEventRoutes);
  app.use('/api/v1/recovery-cases', recoveryCaseRoutes);
  app.use('/api/v1/recovery/dashboard', dashboardRoutes);
  app.use('/api/v1/demo', demoRoutes);
  app.use('/api/v1/activity', activityRoutes);
  app.use('/api/v1/settings/policies', policySettingsRoutes);

  // Error Handlers
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
