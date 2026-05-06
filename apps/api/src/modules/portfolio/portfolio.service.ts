import { PrismaClient } from '@prisma/client';
import { add, formatUsd } from '@wallet-connect/domain';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export class PortfolioService {
  async getOverview(userId: string) {
    const addresses = await prisma.trackedAddress.findMany({
      where: { userId, status: 'active' },
      include: {
        currentPositions: {
          include: { asset: true },
        },
      },
    });

    let netWorth = new Decimal(0);
    let unpricedValue = new Decimal(0);
    let pricedAssetCount = 0;
    let unpricedAssetCount = 0;
    const byEcosystem: Record<string, Decimal> = {};
    const byAddress: Array<{ addressId: string; label: string | null; value: string }> = [];
    const warnings: Array<{ code: string; message: string }> = [];

    for (const addr of addresses) {
      let addrTotal = new Decimal(0);

      for (const pos of addr.currentPositions) {
        if (pos.valueUsd) {
          addrTotal = addrTotal.plus(new Decimal(pos.valueUsd));
          pricedAssetCount++;
        } else {
          unpricedValue = unpricedValue.plus(new Decimal(pos.quantity).mul(pos.priceUsd || 0));
          unpricedAssetCount++;
        }
      }

      netWorth = netWorth.plus(addrTotal);

      const eco = addr.ecosystem;
      byEcosystem[eco] = (byEcosystem[eco] || new Decimal(0)).plus(addrTotal);

      byAddress.push({
        addressId: addr.id,
        label: addr.label,
        value: addrTotal.toFixed(2),
      });
    }

    if (unpricedAssetCount > 0) {
      warnings.push({
        code: 'UNPRICED_ASSETS_PRESENT',
        message: 'Existen activos sin precio y no se incluyen en netWorth',
      });
    }

    const isStale = addresses.some(
      (a) => !a.lastSyncedAt || Date.now() - a.lastSyncedAt.getTime() > 5 * 60 * 1000,
    );

    return {
      quoteCurrency: 'USD',
      asOf: new Date().toISOString(),
      isStale,
      totals: {
        netWorth: formatUsd(netWorth.toFixed(18)),
        unpricedValue: formatUsd(unpricedValue.toFixed(18)),
        pricedAssetCount,
        unpricedAssetCount,
      },
      breakdownByEcosystem: Object.entries(byEcosystem).map(([ecosystem, value]) => ({
        ecosystem,
        value: formatUsd(value.toFixed(18)),
      })),
      breakdownByAddress: byAddress,
      warnings,
    };
  }

  async getHoldings(userId: string) {
    const positions = await prisma.currentPosition.findMany({
      where: {
        trackedAddress: { userId, status: 'active' },
      },
      include: { asset: true, trackedAddress: true },
    });

    // Aggregate by asset
    const aggregated = new Map<string, {
      asset: any;
      totalQuantity: Decimal;
      totalValueUsd: Decimal;
      priceUsd: Decimal | null;
      priceSource: string;
      addresses: string[];
      warnings: string[];
    }>();

    for (const pos of positions) {
      const key = pos.asset.canonicalKey;
      if (!aggregated.has(key)) {
        aggregated.set(key, {
          asset: pos.asset,
          totalQuantity: new Decimal(0),
          totalValueUsd: new Decimal(0),
          priceUsd: pos.priceUsd ? new Decimal(pos.priceUsd) : null,
          priceSource: pos.priceSource,
          addresses: [],
          warnings: (pos.warnings as string[]) || [],
        });
      }

      const entry = aggregated.get(key)!;
      entry.totalQuantity = entry.totalQuantity.plus(new Decimal(pos.quantity));
      if (pos.valueUsd) {
        entry.totalValueUsd = entry.totalValueUsd.plus(new Decimal(pos.valueUsd));
      }
      entry.addresses.push(pos.trackedAddress.addressNormalized);
    }

    return Array.from(aggregated.values()).map((entry) => ({
      asset: {
        canonicalKey: entry.asset.canonicalKey,
        symbol: entry.asset.symbol,
        name: entry.asset.name,
        ecosystem: entry.asset.ecosystem,
      },
      quantity: entry.totalQuantity.toFixed(18),
      valueUsd: formatUsd(entry.totalValueUsd.toFixed(18)),
      priceUsd: entry.priceUsd?.toFixed(2) || null,
      priceSource: entry.priceSource,
      addressCount: entry.addresses.length,
      warnings: entry.warnings,
    }));
  }

  async getTimeseries(userId: string, from: string, to: string) {
    const snapshots = await prisma.portfolioSnapshotDaily.findMany({
      where: {
        userId,
        day: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: { day: 'asc' },
    });

    return {
      metric: 'net_worth',
      bucket: 'day',
      points: snapshots.map((s) => ({
        date: s.day.toISOString().split('T')[0],
        value: new Decimal(s.netWorth).toFixed(2),
        stale: new Decimal(s.unpricedValue).greaterThan(0),
      })),
    };
  }
}
