import { FastifyInstance } from 'fastify';
import { createHmac } from 'crypto';

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/zerion', async (request, reply) => {
    // Verify webhook signature if secret is configured
    const body = JSON.stringify(request.body);

    // Log webhook receipt
    app.logger.info({ bodyLength: body.length }, 'Zerion webhook received');

    // TODO: Parse webhook payload and enqueue sync jobs

    reply.send({ received: true });
  });
}
