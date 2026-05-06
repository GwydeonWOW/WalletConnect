import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function meRoutes(app: FastifyInstance) {
  app.get('/me', async (request, reply) => {
    const userId = (request as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        locale: true,
        timezone: true,
        createdAt: true,
      },
    });

    if (!user) {
      reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          requestId: request.id,
        },
      });
      return;
    }

    reply.send({
      data: user,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });
}
