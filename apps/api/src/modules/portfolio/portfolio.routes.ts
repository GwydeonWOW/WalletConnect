import { FastifyInstance } from 'fastify';
import { overviewQuerySchema, timeseriesQuerySchema } from '@wallet-connect/domain';
import { PortfolioService } from './portfolio.service.js';

export async function portfolioRoutes(app: FastifyInstance) {
  const service = new PortfolioService();

  app.get('/overview', async (request, reply) => {
    const parsed = overviewQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.message, requestId: request.id },
      });
      return;
    }

    const userId = (request as any).userId;
    const data = await service.getOverview(userId);

    reply.send({
      data,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });

  app.get('/holdings', async (request, reply) => {
    const userId = (request as any).userId;
    const data = await service.getHoldings(userId);

    reply.send({
      data,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });

  app.get('/timeseries', async (request, reply) => {
    const parsed = timeseriesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.message, requestId: request.id },
      });
      return;
    }

    const userId = (request as any).userId;
    const data = await service.getTimeseries(userId, parsed.data.from, parsed.data.to);

    reply.send({
      data,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });
}
