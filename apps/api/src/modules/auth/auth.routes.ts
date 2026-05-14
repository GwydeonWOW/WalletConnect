import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { AppError } from '../../errors/error-handler.js';

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app.env);

  const emailSchema = z.object({ email: z.string().email() });
  const emailCodeSchema = z.object({ email: z.string().email(), code: z.string().length(6) });

  app.post('/register/start', async (request, reply) => {
    const parsed = emailSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.message);
    }

    try {
      const result = await authService.registerStart(parsed.data.email);
      reply.send({
        data: result,
        meta: { requestId: request.id, servedAt: new Date().toISOString() },
      });
    } catch (err: any) {
      request.log.error({ err }, 'Failed to start registration');
      throw new AppError('INTERNAL_ERROR', 500, err.message);
    }
  });

  app.post('/register/verify', async (request, reply) => {
    const parsed = emailCodeSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.message);
    }

    try {
      const result = await authService.registerVerify(parsed.data.email, parsed.data.code);

      const sessionData = Buffer.from(
        JSON.stringify({ userId: result.userId }),
      ).toString('base64url');

      reply.setCookie('session', sessionData, {
        httpOnly: true,
        secure: app.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      reply.send({
        data: result,
        meta: { requestId: request.id, servedAt: new Date().toISOString() },
      });
    } catch (err: any) {
      throw new AppError('UNAUTHORIZED', 401, err.message);
    }
  });

  app.post('/login/start', async (request, reply) => {
    const parsed = emailSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.message);
    }

    try {
      const result = await authService.loginStart(parsed.data.email);
      reply.send({
        data: result,
        meta: { requestId: request.id, servedAt: new Date().toISOString() },
      });
    } catch (err: any) {
      throw new AppError('UNAUTHORIZED', 401, err.message);
    }
  });

  app.post('/login/verify', async (request, reply) => {
    const parsed = emailCodeSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.message);
    }

    try {
      const result = await authService.loginVerify(parsed.data.email, parsed.data.code);

      const sessionData = Buffer.from(
        JSON.stringify({ userId: result.userId }),
      ).toString('base64url');

      reply.setCookie('session', sessionData, {
        httpOnly: true,
        secure: app.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      reply.send({
        data: result,
        meta: { requestId: request.id, servedAt: new Date().toISOString() },
      });
    } catch (err: any) {
      throw new AppError('UNAUTHORIZED', 401, err.message);
    }
  });
}
