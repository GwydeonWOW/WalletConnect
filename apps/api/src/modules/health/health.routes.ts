import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function healthRoutes(app: FastifyInstance) {
  app.get('/live', async (_request, reply) => {
    reply.send({ status: 'ok' });
  });

  app.get('/ready', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      reply.send({ status: 'ok', checks: { database: 'ok' } });
    } catch {
      reply.status(503).send({ status: 'degraded', checks: { database: 'fail' } });
    }
  });
}
