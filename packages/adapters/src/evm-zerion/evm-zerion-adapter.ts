import type { PortfolioAdapter, NormalizedPosition, NormalizedActivity, ChainRef } from '@wallet-connect/domain';
import { canonicalizeAsset } from '@wallet-connect/domain';
import { ZerionClient } from './zerion-client.js';
import { mapUpstreamError } from '../shared/error-mapper.js';

export class EvmZerionAdapter implements PortfolioAdapter {
  supportsHistory = true;
  supportsActivity = true;

  constructor(private readonly client: ZerionClient) {}

  async getCurrentPositions(address: string, chainRef: ChainRef): Promise<NormalizedPosition[]> {
    try {
      const raw = await this.client.getPortfolioSnapshot({ address, chainRef });

      return raw.positions.map((p: any) => ({
        asset: {
          canonicalKey: canonicalizeAsset({
            ecosystem: 'evm',
            chainRef,
            contractRef: p.contractRef ?? null,
            isNative: p.isNative === true,
          }),
          ecosystem: 'evm',
          chainRef,
          contractRef: p.contractRef ?? null,
          symbol: p.symbol ?? null,
          name: p.name ?? null,
          decimals: p.decimals ?? null,
        },
        quantity: String(p.quantity ?? '0'),
        priceUsd: p.priceUsd != null ? String(p.priceUsd) : null,
        valueUsd: p.valueUsd != null ? String(p.valueUsd) : null,
        priceSource: (p.priceUsd != null ? 'adapter' : 'none') as any,
        priceAsOf: raw.asOf ?? null,
        warnings: [],
      }));
    } catch (err) {
      throw mapUpstreamError(err, 'zerion', 'evm');
    }
  }

  async getActivity(address: string, chainRef: ChainRef, from: string, to: string): Promise<NormalizedActivity[]> {
    try {
      const raw = await this.client.getActivity({ address, chainRef, from, to });
      return (raw.data || []).map(mapEvmActivity);
    } catch (err) {
      throw mapUpstreamError(err, 'zerion', 'evm');
    }
  }

  async getHistoricalNetWorth(address: string, chainRef: ChainRef, from: string, to: string) {
    try {
      const raw = await this.client.getHistory({ address, chainRef, from, to });
      if (!raw?.data?.attributes?.points?.length) return [];
      return raw.data.attributes.points.map((p: any) => ({ at: p[0], valueUsd: String(p[1]) }));
    } catch (err) {
      const mapped = mapUpstreamError(err, 'zerion', 'evm');
      if (mapped.code === 'UPSTREAM_NOT_SUPPORTED') return null;
      throw mapped;
    }
  }
}

function mapEvmActivity(tx: any): NormalizedActivity {
  const attrs = tx.attributes || {};
  return {
    externalId: tx.id || attrs.hash || '',
    occurredAt: attrs.mined_at || new Date().toISOString(),
    direction: mapDirection(attrs.direction),
    kind: mapKind(attrs.operation_type),
    assetIn: attrs.quantity ? { assetKey: attrs.fungible_info?.symbol || 'unknown', quantity: String(attrs.quantity.numeric || '0') } : undefined,
    feeUsd: attrs.fee?.value ? String(attrs.fee.value) : null,
    txHash: attrs.hash || null,
    fromAddress: attrs.sender || null,
    toAddress: attrs.receiver || null,
  };
}

function mapDirection(d: string): 'in' | 'out' | 'self' | 'unknown' {
  if (d === 'incoming') return 'in';
  if (d === 'outgoing') return 'out';
  if (d === 'self') return 'self';
  return 'unknown';
}

function mapKind(type: string): NormalizedActivity['kind'] {
  const map: Record<string, NormalizedActivity['kind']> = {
    send: 'transfer', receive: 'transfer', swap: 'swap',
    bridge: 'bridge', approve: 'fee', stake: 'stake',
    unstake: 'unstake', reward: 'reward', airdrop: 'airdrop',
  };
  return map[type] || 'unknown';
}
