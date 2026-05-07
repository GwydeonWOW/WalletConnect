import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public retryable = false,
    public retryAfterSec?: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const requestId = request.id;

  if (error instanceof ZodError) {
    reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        requestId,
      },
    });
    return;
  }

  if (error instanceof AppError) {
    const response: any = {
      code: error.code,
      message: error.message,
      requestId,
    };
    if (error.retryAfterSec) {
      response.retryAfterSec = error.retryAfterSec;
    }
    reply.status(error.statusCode).send({ error: response });
    return;
  }

  request.log.error({ err: error }, 'Unhandled error');
  console.error('Unhandled error:', error);
  reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      requestId,
    },
  });
}
