import { PrismaClient } from '@prisma/client';
import { loadEnv } from '@wallet-connect/config';
import { EvmRpcAdapter, EvmRpcClient, getRpcUrl } from '@wallet-connect/adapters';
import { EvmZerionAdapter, ZerionClient } from '@wallet-connect/adapters';
import { SolanaPortfolioAdapter, SolanaClient } from '@wallet-connect/adapters';
import { SuiNativeAdapter, SuiDataClient } from '@wallet-connect/adapters';
import { GeckoTerminalClient, GeckoPriceService } from '@wallet-connect/adapters';
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
    let adapter = getAdapter(address.ecosystem, address.chainRef);
    if (!adapter) {
      throw new Error(`No adapter for ecosystem: ${address.ecosystem}`);
    }

    // Fetch positions (with fallback from Zerion to free RPC)
    let positions: any[] = [];
    const adapterName = adapter.constructor.name;
    try {
      positions = await adapter.getCurrentPositions(
        address.addressNormalized,
        address.chainRef as any,
      );
      logger.info({ addressId, adapter: adapterName, positionCount: positions.length }, 'Positions fetched');
    } catch (err: any) {
      const errDetail = err instanceof Error ? `${err.message} (status=${(err as any).status})` : JSON.stringify(err);
      logger.error(`Adapter ${adapterName} failed for ${addressId}: ${errDetail}`);
      if (env.ZERION_API_KEY && address.ecosystem === 'evm') {
        logger.warn({ addressId }, 'Falling back to free RPC');
        adapter = new EvmRpcAdapter(new EvmRpcClient({ rpcUrl: getRpcUrl(address.chainRef) }));
        positions = await adapter.getCurrentPositions(
          address.addressNormalized,
          address.chainRef as any,
        );
      } else {
        throw err;
      }
    }

    // Enrich with prices via GeckoTerminal (free, no API key needed)
    const geckoClient = new GeckoTerminalClient();
    const priceService = new GeckoPriceService(geckoClient);

    const enriched = await priceService.enrichMissingPrices(positions);

    // Upsert assets, positions, and persist price history
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

      // Persist price point for history
      if (pos.priceUsd && pos.priceSource !== 'none') {
        await prisma.pricePoint.upsert({
          where: {
            assetId_quoteCurrency_source_quotedAt: {
              assetId: asset.id,
              quoteCurrency: 'USD',
              source: pos.priceSource,
              quotedAt: new Date(pos.priceAsOf || new Date()),
            },
          },
          update: { price: new Decimal(pos.priceUsd) },
          create: {
            assetId: asset.id,
            quoteCurrency: 'USD',
            source: pos.priceSource,
            quotedAt: new Date(pos.priceAsOf || new Date()),
            price: new Decimal(pos.priceUsd),
          },
        }).catch(() => {});
      }

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

function getAdapter(ecosystem: string, chainRef: string) {
  switch (ecosystem) {
    case 'evm':
      if (env.ZERION_API_KEY) {
        try {
          return new EvmZerionAdapter(new ZerionClient({ apiKey: env.ZERION_API_KEY, baseUrl: env.ZERION_BASE_URL }));
        } catch {
          logger.warn('Zerion init failed, falling back to free RPC');
        }
      }
      return new EvmRpcAdapter(new EvmRpcClient({ rpcUrl: getRpcUrl(chainRef) }));
    case 'solana':
      return new SolanaPortfolioAdapter(new SolanaClient({ rpcUrl: env.SOLANA_RPC_URL }));
    case 'sui':
      return new SuiNativeAdapter(new SuiDataClient({ rpcUrl: env.SUI_RPC_URL }));
    default:
      return null;
  }
}
