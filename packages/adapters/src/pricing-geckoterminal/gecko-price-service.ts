import type { NormalizedPosition } from '@wallet-connect/domain';
import { multiply } from '@wallet-connect/domain';
import { GeckoTerminalClient } from './geckoterminal-client.js';

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
        // GeckoTerminal failed
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

      result.push({
        ...pos,
        warnings: [...pos.warnings, 'UNPRICED_ASSET'],
      });
    }

    return result;
  }
}
