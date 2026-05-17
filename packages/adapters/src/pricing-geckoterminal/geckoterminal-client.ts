export interface GeckoTerminalConfig {
  baseUrl?: string;
}

interface TokenData {
  data: {
    attributes: {
      price_usd?: string;
      symbol?: string;
      name?: string;
      decimals?: number;
    };
  };
}

const CHAIN_MAP: Record<string, string> = {
  'eip155:1': 'eth',
  'eip155:56': 'bsc',
  'eip155:137': 'polygon_pos',
  'eip155:42161': 'arbitrum',
  'eip155:10': 'optimism',
  'eip155:8453': 'base',
  'eip155:43114': 'avax',
  'eip155:100': 'xdai',
  'eip155:250': 'fantom',
  'solana:mainnet': 'solana',
};

export class GeckoTerminalClient {
  private baseUrl: string;

  constructor(config?: GeckoTerminalConfig) {
    this.baseUrl = config?.baseUrl ?? 'https://api.geckoterminal.com/api/v2';
  }

  async getTokenPrice(chainRef: string, contractAddress: string): Promise<string | null> {
    const network = CHAIN_MAP[chainRef];
    if (!network) return null;

    const url = `${this.baseUrl}/networks/${network}/tokens/${contractAddress}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (res.status === 429) {
      const err: any = new Error('Rate limited');
      err.status = 429;
      err.retryAfterSec = 30;
      throw err;
    }

    if (!res.ok) return null;

    const json: TokenData = await res.json();
    return json.data?.attributes?.price_usd ?? null;
  }

  async getNativePrice(chainRef: string): Promise<string | null> {
    const network = CHAIN_MAP[chainRef];
    if (!network) return null;

    // For native tokens, use the wrapped version (WETH, WMATIC, etc.)
    const wrappedTokens: Record<string, string> = {
      'eip155:1': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      'eip155:137': '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      'eip155:42161': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      'eip155:10': '0x4200000000000000000000000000000000000006',
      'eip155:8453': '0x4200000000000000000000000000000000000006',
      'eip155:56': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      'solana:mainnet': 'So11111111111111111111111111111111111111112',
    };

    const wrapped = wrappedTokens[chainRef];
    if (!wrapped) return null;

    return this.getTokenPrice(chainRef, wrapped);
  }
}
