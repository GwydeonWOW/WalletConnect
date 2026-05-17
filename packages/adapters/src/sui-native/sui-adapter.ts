import type { PortfolioAdapter, NormalizedPosition, NormalizedActivity, ChainRef } from '@wallet-connect/domain';
import { canonicalizeAsset } from '@wallet-connect/domain';
import { SuiDataClient } from './sui-client.js';
import { mapUpstreamError } from '../shared/error-mapper.js';

export class SuiNativeAdapter implements PortfolioAdapter {
  supportsHistory = false;
  supportsActivity = true;

  constructor(private readonly suiClient: SuiDataClient) {}

  async getCurrentPositions(address: string, chainRef: ChainRef): Promise<NormalizedPosition[]> {
    try {
      const balances = await this.suiClient.listBalances(address);
      const positions: NormalizedPosition[] = [];

      for (const b of balances) {
        let symbol: string | null = null;
        let name: string | null = null;
        let decimals: number | null = null;

        if (b.coinType === '0x2::sui::SUI') {
          symbol = 'SUI';
          name = 'Sui';
          decimals = 9;
        } else {
          try {
            const meta = await this.suiClient.getCoinMetadata(b.coinType);
            if (meta) {
              symbol = meta.symbol || null;
              name = meta.name || null;
              decimals = meta.decimals ?? null;
            }
          } catch {}
        }

        const rawBalance = BigInt(b.quantity || '0');
        const dec = decimals ?? 9;
        const quantity = formatBigInt(rawBalance, dec);

        positions.push({
          asset: {
            canonicalKey: canonicalizeAsset({ ecosystem: 'sui', chainRef, coinType: b.coinType }),
            ecosystem: 'sui',
            chainRef,
            contractRef: b.coinType,
            symbol,
            name,
            decimals: dec,
          },
          quantity,
          priceUsd: null,
          valueUsd: null,
          priceSource: 'none',
          priceAsOf: null,
          warnings: [],
        });
      }

      return positions;
    } catch (err) {
      throw mapUpstreamError(err, 'sui-native', 'sui');
    }
  }

  async getActivity(address: string, chainRef: ChainRef, from: string, to: string): Promise<NormalizedActivity[]> {
    try {
      const txs = await this.suiClient.listTransactions({ address, from, to });
      return txs.map(mapSuiActivity);
    } catch (err) {
      throw mapUpstreamError(err, 'sui-native', 'sui');
    }
  }

  async getHistoricalNetWorth(): Promise<null> {
    return null;
  }
}

function formatBigInt(raw: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fractionStr ? `${whole}.${fractionStr}` : whole.toString();
}

function mapSuiActivity(tx: any): NormalizedActivity {
  return {
    externalId: tx.digest || '',
    occurredAt: tx.timestampMs ? new Date(Number(tx.timestampMs)).toISOString() : new Date().toISOString(),
    direction: 'unknown',
    kind: 'unknown',
    txHash: tx.digest || null,
  };
}
