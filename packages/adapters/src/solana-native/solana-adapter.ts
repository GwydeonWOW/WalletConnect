import type { PortfolioAdapter, NormalizedPosition, NormalizedActivity, ChainRef } from '@wallet-connect/domain';
import { canonicalizeAsset } from '@wallet-connect/domain';
import { SolanaClient } from './solana-client.js';
import { mapUpstreamError } from '../shared/error-mapper.js';

export class SolanaPortfolioAdapter implements PortfolioAdapter {
  supportsHistory = false;
  supportsActivity = true;

  constructor(private readonly client: SolanaClient) {}

  async getCurrentPositions(address: string, chainRef: ChainRef): Promise<NormalizedPosition[]> {
    try {
      const positions: NormalizedPosition[] = [];

      // SOL balance
      const solBalance = await this.client.getBalance(address);
      if (solBalance > 0) {
        positions.push({
          asset: {
            canonicalKey: canonicalizeAsset({ ecosystem: 'solana', chainRef, mint: 'So11111111111111111111111111111111111111112' }),
            ecosystem: 'solana',
            chainRef,
            contractRef: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9,
          },
          quantity: solBalance.toFixed(9),
          priceUsd: null,
          valueUsd: null,
          priceSource: 'none',
          priceAsOf: null,
          warnings: [],
        });
      }

      // SPL token balances
      const tokenAccounts = await this.client.getTokenAccountsByOwner(address);
      for (const account of tokenAccounts) {
        const info = account.account?.data?.parsed?.info;
        if (!info || info.tokenAmount?.uiAmount === 0) continue;

        const mint = info.mint;
        positions.push({
          asset: {
            canonicalKey: canonicalizeAsset({ ecosystem: 'solana', chainRef, mint }),
            ecosystem: 'solana',
            chainRef,
            contractRef: mint,
            symbol: null,
            name: null,
            decimals: info.tokenAmount?.decimals || null,
          },
          quantity: String(info.tokenAmount?.amount || '0'),
          priceUsd: null,
          valueUsd: null,
          priceSource: 'none',
          priceAsOf: null,
          warnings: [],
        });
      }

      return positions;
    } catch (err) {
      throw mapUpstreamError(err, 'solana-native', 'solana');
    }
  }

  async getActivity(address: string, chainRef: ChainRef, from: string, to: string): Promise<NormalizedActivity[]> {
    try {
      const signatures = await this.client.getSignatures(address);
      return signatures.map((sig: any) => ({
        externalId: sig.signature || '',
        occurredAt: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : new Date().toISOString(),
        direction: 'unknown' as const,
        kind: 'unknown' as const,
        txHash: sig.signature || null,
        warnings: [],
      }));
    } catch (err) {
      throw mapUpstreamError(err, 'solana-native', 'solana');
    }
  }

  async getHistoricalNetWorth(): Promise<null> {
    return null;
  }
}
