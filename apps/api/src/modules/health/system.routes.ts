import { FastifyInstance } from 'fastify';

export async function systemRoutes(app: FastifyInstance) {
  app.get('/providers', async (_request, reply) => {
    const env = app.env;
    reply.send({
      data: {
        providers: [
          {
            name: 'coingecko',
            configured: !!env.COINGECKO_API_KEY,
            baseUrl: env.COINGECKO_BASE_URL,
          },
          {
            name: 'zerion',
            configured: !!env.ZERION_API_KEY,
            baseUrl: env.ZERION_BASE_URL,
          },
          {
            name: 'solana-rpc',
            configured: true,
            baseUrl: env.SOLANA_RPC_URL,
          },
          {
            name: 'sui-rpc',
            configured: true,
            baseUrl: env.SUI_RPC_URL,
          },
        ],
      },
      meta: {
        requestId: _request.id,
        servedAt: new Date().toISOString(),
      },
    });
  });
}
