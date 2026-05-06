import { FastifyInstance } from 'fastify';
import { SyncService } from './sync.service.js';
import { AppError } from '../../errors/error-handler.js';

export async function syncJobRoutes(app: FastifyInstance) {
  const service = new SyncService();

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = (request as any).userId;
    const job = await service.getJobStatus(userId, id);

    if (!job) {
      throw new AppError('NOT_FOUND', 404, 'Sync job not found');
    }

    reply.send({
      data: job,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });
}
