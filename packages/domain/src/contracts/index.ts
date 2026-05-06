export type Ecosystem = 'evm' | 'solana' | 'sui';
export type WalletSource = 'zerion' | 'solflare' | 'suiet';
export type ChainRef = `eip155:${number}` | 'solana:mainnet' | 'sui:mainnet';

export interface ConnectedAccount {
  ecosystem: Ecosystem;
  walletSource: WalletSource;
  address: string;
  chainRef: ChainRef;
  labelHint?: string;
}

export type WalletBridgeEvent =
  | { type: 'accountsChanged'; accounts: ConnectedAccount[] }
  | { type: 'disconnect' }
  | { type: 'providerUnavailable' };

export interface ReadOnlyWalletBridge {
  source: WalletSource;
  ecosystem: Ecosystem;
  isInstalled(): boolean;
  connect(): Promise<ConnectedAccount[]>;
  getAccounts(): Promise<ConnectedAccount[]>;
  onEvent(cb: (event: WalletBridgeEvent) => void): () => void;
  disconnect(): Promise<void>;
}

export interface CanonicalAssetRef {
  canonicalKey: string;
  ecosystem: Ecosystem;
  chainRef: ChainRef;
  contractRef: string | null;
  symbol: string | null;
  name: string | null;
  decimals: number | null;
}

export interface NormalizedPosition {
  asset: CanonicalAssetRef;
  quantity: string;
  priceUsd: string | null;
  valueUsd: string | null;
  priceSource: 'coingecko' | 'adapter' | 'last_known_good' | 'none';
  priceAsOf: string | null;
  warnings: string[];
}

export interface NormalizedActivity {
  externalId: string;
  occurredAt: string;
  direction: 'in' | 'out' | 'self' | 'unknown';
  kind: 'transfer' | 'swap' | 'bridge' | 'fee' | 'reward' | 'airdrop' | 'stake' | 'unstake' | 'unknown';
  assetIn?: { assetKey: string; quantity: string };
  assetOut?: { assetKey: string; quantity: string };
  feeUsd?: string | null;
  txHash?: string | null;
  fromAddress?: string | null;
  toAddress?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PortfolioAdapter {
  supportsHistory: boolean;
  supportsActivity: boolean;
  getCurrentPositions(address: string, chainRef: ChainRef): Promise<NormalizedPosition[]>;
  getActivity(address: string, chainRef: ChainRef, from: string, to: string): Promise<NormalizedActivity[]>;
  getHistoricalNetWorth(
    address: string,
    chainRef: ChainRef,
    from: string,
    to: string
  ): Promise<Array<{ at: string; valueUsd: string }> | null>;
}
