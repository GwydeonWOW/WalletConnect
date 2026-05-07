import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { loadEnv } from '@wallet-connect/config';
import { authRoutes } from './modules/auth/auth.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { meRoutes } from './modules/auth/me.routes.js';
import { addressRoutes } from './modules/addresses/addresses.routes.js';
import { portfolioRoutes } from './modules/portfolio/portfolio.routes.js';
import { pnlRoutes } from './modules/pnl/pnl.routes.js';
import { activityRoutes } from './modules/activity/activity.routes.js';
import { flowRoutes } from './modules/flows/flow.routes.js';
import { syncJobRoutes } from './modules/sync/sync.routes.js';
import { systemRoutes } from './modules/health/system.routes.js';
import { webhookRoutes } from './modules/webhooks/webhook.routes.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandler } from './errors/error-handler.js';
import { authGuard } from './middleware/auth-guard.js';
import pino from 'pino';

const env = loadEnv();

const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

const app = Fastify({
  logger: false,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
  disableRequestLogging: true,
});

app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", env.FRONTEND_URL],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
});

app.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
});

app.register(cookie, {
  secret: env.SESSION_SECRET,
  parseOptions: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
});

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1'],
});

app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
  if (!body || body === '') {
    done(null, {});
    return;
  }
  try {
    done(null, JSON.parse(body as string));
  } catch (err) {
    done(err as Error);
  }
});

app.addHook('onRequest', requestIdMiddleware);
app.setErrorHandler(errorHandler);

app.decorate('authGuard', authGuard);
app.decorate('env', env);
app.decorate('logger', logger);

// Public routes
app.register(healthRoutes, { prefix: '/health' });
app.register(authRoutes, { prefix: '/api/v1/auth' });
app.register(webhookRoutes, { prefix: '/api/v1/webhooks' });

// Protected routes
app.register(async (protectedApp) => {
  protectedApp.addHook('onRequest', authGuard);
  protectedApp.register(meRoutes, { prefix: '/api/v1' });
  protectedApp.register(addressRoutes, { prefix: '/api/v1/addresses' });
  protectedApp.register(syncJobRoutes, { prefix: '/api/v1/sync-jobs' });
  protectedApp.register(portfolioRoutes, { prefix: '/api/v1/portfolio' });
  protectedApp.register(pnlRoutes, { prefix: '/api/v1/pnl' });
  protectedApp.register(activityRoutes, { prefix: '/api/v1/activity' });
  protectedApp.register(flowRoutes, { prefix: '/api/v1/flows' });
  protectedApp.register(systemRoutes, { prefix: '/api/v1/system' });
});

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`API server listening on port ${env.PORT}`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
};

start();

export { app };
