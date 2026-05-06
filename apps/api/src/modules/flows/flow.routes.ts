import { FastifyInstance } from 'fastify';
import { reclassifyFlowSchema } from '@wallet-connect/domain';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function flowRoutes(app: FastifyInstance) {
  app.post('/:id/reclassify', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = reclassifyFlowSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.message, requestId: request.id },
      });
      return;
    }

    const userId = (request as any).userId;

    const event = await prisma.flowEvent.findFirst({
      where: { id, userId },
    });

    if (!event) {
      reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Flow event not found', requestId: request.id },
      });
      return;
    }

    const updated = await prisma.flowEvent.update({
      where: { id },
      data: {
        flowClass: parsed.data.flowClass,
        metadata: {
          ...(event.metadata as any || {}),
          reclassifiedAt: new Date().toISOString(),
          reclassifyReason: parsed.data.reason,
          previousClass: event.flowClass,
        },
      },
    });

    reply.send({
      data: updated,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });
}
