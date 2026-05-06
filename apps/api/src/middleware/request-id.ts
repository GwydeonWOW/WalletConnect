import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

export async function requestIdMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const requestId = (request.headers['x-request-id'] as string) || randomUUID();
  request.id = requestId;
  reply.header('x-request-id', requestId);
}
