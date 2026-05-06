import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { AppError } from '../../errors/error-handler.js';

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app.env);

  app.post('/passkeys/register/options', async (request, reply) => {
    const userId = randomUUID();
    try {
      const options = await authService.generateRegistrationOptions(userId);
      reply.send({
        data: { userId, options },
        meta: { requestId: request.id, servedAt: new Date().toISOString() },
      });
    } catch (err: any) {
      throw new AppError('INTERNAL_ERROR', 500, err.message);
    }
  });

  const registerVerifySchema = z.object({
    userId: z.string(),
    credential: z.any(),
  });

  app.post('/passkeys/register/verify', async (request, reply) => {
    const parsed = registerVerifySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.message);
    }

    try {
      const result = await authService.verifyRegistration(
        parsed.data.userId,
        parsed.data.credential,
      );

      // Set session cookie
      const sessionData = Buffer.from(
        JSON.stringify({ userId: result.userId }),
      ).toString('base64url');

      reply.setCookie('session', sessionData, {
        httpOnly: true,
        secure: app.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      reply.send({
        data: { verified: true, userId: result.userId },
        meta: { requestId: request.id, servedAt: new Date().toISOString() },
      });
    } catch (err: any) {
      throw new AppError('INTERNAL_ERROR', 500, err.message);
    }
  });

  app.post('/passkeys/login/options', async (request, reply) => {
    try {
      const options = await authService.generateLoginOptions();
      reply.send({
        data: { options },
        meta: { requestId: request.id, servedAt: new Date().toISOString() },
      });
    } catch (err: any) {
      throw new AppError('INTERNAL_ERROR', 500, err.message);
    }
  });

  const loginVerifySchema = z.object({
    credential: z.any(),
  });

  app.post('/passkeys/login/verify', async (request, reply) => {
    const parsed = loginVerifySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.message);
    }

    try {
      const result = await authService.verifyLogin(parsed.data.credential);

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
        data: { verified: true, userId: result.userId },
        meta: { requestId: request.id, servedAt: new Date().toISOString() },
      });
    } catch (err: any) {
      throw new AppError('UNAUTHORIZED', 401, err.message);
    }
  });
}
