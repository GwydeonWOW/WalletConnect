import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authGuard: typeof authGuard;
    env: import('@wallet-connect/config').Env;
    logger: import('pino').Logger;
  }
}

export function authGuard(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) {
  const session = request.cookies.session;

  if (!session) {
    reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Session required',
        requestId: request.id,
      },
    });
    return;
  }

  try {
    const decoded = Buffer.from(session, 'base64url').toString('utf-8');
    const userData = JSON.parse(decoded);

    if (!userData.userId) {
      reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid session',
          requestId: request.id,
        },
      });
      return;
    }

    (request as any).userId = userData.userId;
    done();
  } catch {
    reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid session',
        requestId: request.id,
      },
    });
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}
