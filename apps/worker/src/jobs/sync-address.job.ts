import { PrismaClient } from '@prisma/client';
import { loadEnv } from '@wallet-connect/config';
import { EvmZerionAdapter, ZerionClient } from '@wallet-connect/adapters';
import { SolanaPortfolioAdapter, SolanaClient } from '@wallet-connect/adapters';
import { SuiNativeAdapter, SuiDataClient } from '@wallet-connect/adapters';
import { CoinGeckoClient, PriceService } from '@wallet-connect/adapters';
import Decimal from 'decimal.js';
import pino from 'pino';

const prisma = new PrismaClient();
const env = loadEnv();
const logger = pino();

export async function syncAddress(addressId: string, userId: string): Promise<void> {
  logger.info({ addressId, userId }, 'Starting address sync');

  const address = await prisma.trackedAddress.findUnique({
    where: { id: addressId },
  });

  if (!address || address.status !== 'active') {
    logger.warn({ addressId }, 'Address not found or inactive');
    return;
  }

  // Update job status
  const job = await prisma.syncJob.findFirst({
    where: { trackedAddressId: addressId, status: 'queued' },
    orderBy: { createdAt: 'desc' },
  });

  if (job) {
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: 'running', startedAt: new Date() },
    });
  }

  try {
    // Get adapter based on ecosystem
    const adapter = getAdapter(address.ecosystem);
    if (!adapter) {
      throw new Error(`No adapter for ecosystem: ${address.ecosystem}`);
    }

    // Fetch positions
    const positions = await adapter.getCurrentPositions(
      address.addressNormalized,
      address.chainRef as any,
    );

    // Enrich with prices
    const priceService = new PriceService(
      new CoinGeckoClient({
        apiKey: env.COINGECKO_API_KEY,
        baseUrl: env.COINGECKO_BASE_URL,
      })
    );

    const enriched = await priceService.enrichMissingPrices(positions);

    // Persist prices and assets
    await priceService.persistPrices(enriched);

    // Upsert positions
    for (const pos of enriched) {
      const asset = await prisma.asset.upsert({
        where: { canonicalKey: pos.asset.canonicalKey },
        update: {
          symbol: pos.asset.symbol,
          name: pos.asset.name,
          decimals: pos.asset.decimals,
        },
        create: {
          canonicalKey: pos.asset.canonicalKey,
          ecosystem: pos.asset.ecosystem,
          chainRef: pos.asset.chainRef,
          contractRef: pos.asset.contractRef,
          symbol: pos.asset.symbol,
          name: pos.asset.name,
          decimals: pos.asset.decimals,
        },
      });

      await prisma.currentPosition.upsert({
        where: {
          trackedAddressId_assetId: {
            trackedAddressId: addressId,
            assetId: asset.id,
          },
        },
        update: {
          quantity: new Decimal(pos.quantity),
          priceUsd: pos.priceUsd ? new Decimal(pos.priceUsd) : null,
          valueUsd: pos.valueUsd ? new Decimal(pos.valueUsd) : null,
          priceSource: pos.priceSource,
          priceAsOf: pos.priceAsOf ? new Date(pos.priceAsOf) : null,
          valuationAsOf: new Date(),
          warnings: pos.warnings,
        },
        create: {
          trackedAddressId: addressId,
          assetId: asset.id,
          quantity: pos.quantity,
          priceUsd: pos.priceUsd,
          valueUsd: pos.valueUsd,
          priceSource: pos.priceSource,
          priceAsOf: pos.priceAsOf ? new Date(pos.priceAsOf) : null,
          valuationAsOf: new Date(),
          warnings: pos.warnings,
        },
      });
    }

    // Update address sync timestamp
    await prisma.trackedAddress.update({
      where: { id: addressId },
      data: { lastSyncedAt: new Date() },
    });

    // Update job status
    if (job) {
      await prisma.syncJob.update({
        where: { id: job.id },
        data: { status: 'succeeded', finishedAt: new Date() },
      });
    }

    logger.info({ addressId, positionCount: enriched.length }, 'Address sync completed');
  } catch (err: any) {
    logger.error({ addressId, error: err.message }, 'Address sync failed');

    if (job) {
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          errorCode: 'SYNC_FAILED',
          errorMessage: err.message?.substring(0, 500),
        },
      });
    }
  }
}

function getAdapter(ecosystem: string) {
  switch (ecosystem) {
    case 'evm':
      return env.ZERION_API_KEY
        ? new EvmZerionAdapter(new ZerionClient({ apiKey: env.ZERION_API_KEY, baseUrl: env.ZERION_BASE_URL }))
        : null;
    case 'solana':
      return new SolanaPortfolioAdapter(new SolanaClient({ rpcUrl: env.SOLANA_RPC_URL }));
    case 'sui':
      return new SuiNativeAdapter(new SuiDataClient({ rpcUrl: env.SUI_RPC_URL }));
    default:
      return null;
  }
}
