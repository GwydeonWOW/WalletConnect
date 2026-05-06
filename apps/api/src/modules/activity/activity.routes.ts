import { FastifyInstance } from 'fastify';
import { activityQuerySchema } from '@wallet-connect/domain';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function activityRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const parsed = activityQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.message, requestId: request.id },
      });
      return;
    }

    const userId = (request as any).userId;
    const { from, to, ecosystem, addressId, limit, offset } = parsed.data;

    const where: any = { userId };
    if (from) where.occurredAt = { ...where.occurredAt, gte: new Date(from) };
    if (to) where.occurredAt = { ...where.occurredAt, lte: new Date(to) };
    if (addressId) where.trackedAddressId = addressId;

    const [events, total] = await Promise.all([
      prisma.flowEvent.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: limit,
        skip: offset,
        include: { asset: true, trackedAddress: true },
      }),
      prisma.flowEvent.count({ where }),
    ]);

    reply.send({
      data: events,
      meta: {
        requestId: request.id,
        servedAt: new Date().toISOString(),
        pagination: { total, limit, offset },
      },
    });
  });
}
