import { FastifyInstance } from 'fastify';
import { pnlQuerySchema } from '@wallet-connect/domain';
import { PnlService } from './pnl.service.js';

export async function pnlRoutes(app: FastifyInstance) {
  const service = new PnlService();

  app.get('/summary', async (request, reply) => {
    const parsed = pnlQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.message, requestId: request.id },
      });
      return;
    }

    const userId = (request as any).userId;
    const data = await service.getSummary(userId, parsed.data.from, parsed.data.to);

    reply.send({
      data,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });

  app.get('/daily', async (request, reply) => {
    const parsed = pnlQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.message, requestId: request.id },
      });
      return;
    }

    const userId = (request as any).userId;
    const data = await service.getDailyPnl(userId, parsed.data.from, parsed.data.to);

    reply.send({
      data,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });
}
