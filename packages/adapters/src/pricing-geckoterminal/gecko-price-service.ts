import { PrismaClient } from '@prisma/client';
import type { NormalizedPosition } from '@wallet-connect/domain';
import { multiply } from '@wallet-connect/domain';
import { GeckoTerminalClient } from './geckoterminal-client.js';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

const RATE_LIMIT_MS = 7000;

export class GeckoPriceService {
  private lastCallTime = 0;

  constructor(private readonly client: GeckoTerminalClient) {}

  private async rateLimited<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < RATE_LIMIT_MS) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
    }
    this.lastCallTime = Date.now();
    return fn();
  }

  async enrichMissingPrices(positions: NormalizedPosition[]): Promise<NormalizedPosition[]> {
    const result: NormalizedPosition[] = [];

    for (const pos of positions) {
      if (pos.priceUsd && pos.valueUsd) {
        result.push(pos);
        continue;
      }

      let price: string | null = null;
      const chainRef = pos.asset.chainRef;
      const isNative = !pos.asset.contractRef;

      try {
        price = isNative
          ? await this.rateLimited(() => this.client.getNativePrice(chainRef))
          : await this.rateLimited(() => this.client.getTokenPrice(chainRef, pos.asset.contractRef!));
      } catch {
        // GeckoTerminal failed, try fallback
      }

      if (price) {
        result.push({
          ...pos,
          priceUsd: price,
          valueUsd: multiply(pos.quantity, price),
          priceSource: 'coingecko',
          priceAsOf: new Date().toISOString(),
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
    const maxAgeMs = 24 * 60 * 60 * 60 * 1000;

    if (ageMs > maxAgeMs) return null;

    return {
      priceUsd: pp.price.toFixed(18),
      asOf: pp.quotedAt.toISOString(),
    };
  }

  async persistPrices(positions: NormalizedPosition[]): Promise<void> {
    for (const pos of positions) {
      if (!pos.priceUsd || pos.priceSource === 'none') continue;

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
