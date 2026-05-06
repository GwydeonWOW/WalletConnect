import { PrismaClient } from '@prisma/client';
import type { NormalizedPosition } from '@wallet-connect/domain';
import { multiply } from '@wallet-connect/domain';
import { CoinGeckoClient } from './coingecko-client.js';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export class PriceService {
  private coinGeckoMap: Map<string, string> = new Map([
    ['evm:eip155:1:native', 'ethereum'],
    ['evm:eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'usd-coin'],
    ['evm:eip155:1:0xdac17f958d2ee523a2206206994597c13d831ec7', 'tether'],
    ['evm:eip155:1:0x6b175474e89094c44da98b954eedeac495271d0f', 'dai'],
    ['evm:eip155:1:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', 'wrapped-bitcoin'],
    ['evm:eip155:1:0x514910771af9ca656af840dff83e8264ecf986ca', 'chainlink'],
    ['solana:mint:So11111111111111111111111111111111111111112', 'solana'],
    ['solana:mint:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'usd-coin'],
    ['sui:coin:0x2::sui::SUI', 'sui'],
  ]);

  constructor(private readonly coinGecko: CoinGeckoClient) {}

  async enrichMissingPrices(positions: NormalizedPosition[]): Promise<NormalizedPosition[]> {
    const result: NormalizedPosition[] = [];

    // Collect unpriced positions
    const unpriced = positions.filter((p) => !p.priceUsd || !p.valueUsd);

    // Batch fetch prices from CoinGecko
    const coinIds = unpriced
      .map((p) => this.coinGeckoMap.get(p.asset.canonicalKey))
      .filter(Boolean) as string[];

    let prices: Record<string, { priceUsd: string; asOf: string }> = {};
    if (coinIds.length > 0) {
      try {
        prices = await this.coinGecko.getPrices(coinIds);
      } catch {
        // CoinGecko failed, proceed with fallbacks
      }
    }

    for (const pos of positions) {
      if (pos.priceUsd && pos.valueUsd) {
        result.push(pos);
        continue;
      }

      // Try CoinGecko
      const coinId = this.coinGeckoMap.get(pos.asset.canonicalKey);
      if (coinId && prices[coinId]) {
        const price = prices[coinId];
        result.push({
          ...pos,
          priceUsd: price.priceUsd,
          valueUsd: multiply(pos.quantity, price.priceUsd),
          priceSource: 'coingecko',
          priceAsOf: price.asOf,
        });
        continue;
      }

      // Try last known good from DB
      const lkg = await this.getLastKnownGood(pos.asset.canonicalKey);
      if (lkg) {
        result.push({
          ...pos,
          priceUsd: lkg.priceUsd,
          valueUsd: multiply(pos.quantity, lkg.priceUsd),
          priceSource: 'last_known_good',
          priceAsOf: lkg.asOf,
          warnings: [...pos.warnings, 'STALE_PRICE'],
        });
        continue;
      }

      // No price available
      result.push({
        ...pos,
        warnings: [...pos.warnings, 'UNPRICED_ASSET'],
      });
    }

    return result;
  }

  private async getLastKnownGood(canonicalKey: string): Promise<{ priceUsd: string; asOf: string } | null> {
    const asset = await prisma.asset.findUnique({
      where: { canonicalKey },
      include: {
        pricePoints: {
          where: { quoteCurrency: 'USD', price: { not: '0' } },
          orderBy: { quotedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!asset || asset.pricePoints.length === 0) return null;

    const pp = asset.pricePoints[0];
    const ageMs = Date.now() - pp.quotedAt.getTime();
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

    if (ageMs > maxAgeMs) return null;

    return {
      priceUsd: pp.price.toFixed(18),
      asOf: pp.quotedAt.toISOString(),
    };
  }

  async persistPrices(positions: NormalizedPosition[]): Promise<void> {
    for (const pos of positions) {
      if (!pos.priceUsd || pos.priceSource === 'none') continue;

      // Ensure asset exists
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

      // Persist price point
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
      });
    }
  }
}
