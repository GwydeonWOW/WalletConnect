import type { PortfolioAdapter, NormalizedPosition, NormalizedActivity, ChainRef } from '@wallet-connect/domain';
import { canonicalizeAsset } from '@wallet-connect/domain';
import { EvmRpcClient } from './evm-rpc-client.js';
import { getTokenList } from './token-list.js';
import { mapUpstreamError } from '../shared/error-mapper.js';

const NATIVE_DECIMALS = 18;

export class EvmRpcAdapter implements PortfolioAdapter {
  supportsHistory = false;
  supportsActivity = false;

  constructor(private readonly client: EvmRpcClient) {}

  async getCurrentPositions(address: string, chainRef: ChainRef): Promise<NormalizedPosition[]> {
    try {
      const positions: NormalizedPosition[] = [];
      const now = new Date().toISOString();

      const nativeWei = await this.client.getNativeBalance(address);
      const nativeQuantity = formatTokenAmount(nativeWei, NATIVE_DECIMALS);

      if (nativeWei > 0n) {
        positions.push({
          asset: {
            canonicalKey: canonicalizeAsset({ ecosystem: 'evm', chainRef, isNative: true }),
            ecosystem: 'evm',
            chainRef,
            contractRef: null,
            symbol: 'ETH',
            name: 'Ether',
            decimals: NATIVE_DECIMALS,
          },
          quantity: nativeQuantity,
          priceUsd: null,
          valueUsd: null,
          priceSource: 'none',
          priceAsOf: now,
          warnings: [],
        });
      }

      const tokens = getTokenList(chainRef);
      const checks = tokens.map(async (token) => {
        const rawBalance = await this.client.getErc20Balance(token.address, address);
        return { token, rawBalance };
      });

      const results = await Promise.allSettled(checks);

      for (const result of results) {
        if (result.status !== 'fulfilled' || result.value.rawBalance <= 0n) continue;
        const { token, rawBalance } = result.value;
        const quantity = formatTokenAmount(rawBalance, token.decimals);

        positions.push({
          asset: {
            canonicalKey: canonicalizeAsset({
              ecosystem: 'evm',
              chainRef,
              contractRef: token.address,
            }),
            ecosystem: 'evm',
            chainRef,
            contractRef: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
          },
          quantity,
          priceUsd: null,
          valueUsd: null,
          priceSource: 'none',
          priceAsOf: now,
          warnings: [],
        });
      }

      return positions;
    } catch (err) {
      throw mapUpstreamError(err, 'evm-rpc', 'evm');
    }
  }

  async getActivity(): Promise<NormalizedActivity[]> {
    return [];
  }

  async getHistoricalNetWorth() {
    return null;
  }
}

function formatTokenAmount(raw: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fractionStr ? `${whole}.${fractionStr}` : whole.toString();
}
