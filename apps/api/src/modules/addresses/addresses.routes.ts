import { FastifyInstance } from 'fastify';
import { importAddressSchema, patchAddressSchema } from '@wallet-connect/domain';
import { AddressService } from './addresses.service.js';
import { AppError } from '../../errors/error-handler.js';

export async function addressRoutes(app: FastifyInstance) {
  const service = new AddressService();

  app.post('/import', async (request, reply) => {
    const parsed = importAddressSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.issues.map(i => i.message).join(', '));
    }

    const userId = (request as any).userId;
    const result = await service.importAddress(userId, parsed.data);

    reply.status(201).send({
      data: result,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });

  app.get('/', async (request, reply) => {
    const userId = (request as any).userId;
    const addresses = await service.listAddresses(userId);

    reply.send({
      data: addresses,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });

  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = patchAddressSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.issues.map(i => i.message).join(', '));
    }

    const userId = (request as any).userId;
    const result = await service.patchAddress(userId, id, parsed.data);

    if (!result) {
      throw new AppError('NOT_FOUND', 404, 'Address not found');
    }

    reply.send({
      data: result,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = (request as any).userId;
    const result = await service.deactivateAddress(userId, id);

    if (!result) {
      throw new AppError('NOT_FOUND', 404, 'Address not found');
    }

    reply.send({
      data: { id: result.id, status: result.status },
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });

  app.post('/:id/sync', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = (request as any).userId;
    const result = await service.createSyncJob(userId, id);

    if (!result) {
      throw new AppError('NOT_FOUND', 404, 'Address not found or inactive');
    }

    reply.status(201).send({
      data: result,
      meta: { requestId: request.id, servedAt: new Date().toISOString() },
    });
  });
}
