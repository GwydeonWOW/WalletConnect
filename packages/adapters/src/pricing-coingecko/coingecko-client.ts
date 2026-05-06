export interface CoinGeckoConfig {
  apiKey?: string;
  baseUrl: string;
}

export interface PriceResult {
  priceUsd: string;
  asOf: string;
}

export class CoinGeckoClient {
  private headers: Record<string, string>;

  constructor(private config: CoinGeckoConfig) {
    this.headers = {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'x-cg-demo-api-key': config.apiKey } : {}),
    };
  }

  async getPrice(coinId: string): Promise<PriceResult | null> {
    try {
      const url = `${this.config.baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd`;
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        if (response.status === 429) {
          const err: any = new Error('Rate limited');
          err.kind = 'RATE_LIMIT';
          throw err;
        }
        return null;
      }

      const data = await response.json();
      const price = data?.[coinId]?.usd;

      if (price == null) return null;

      return {
        priceUsd: String(price),
        asOf: new Date().toISOString(),
      };
    } catch (err: any) {
      if (err.kind === 'RATE_LIMIT') throw err;
      return null;
    }
  }

  async getPrices(coinIds: string[]): Promise<Record<string, PriceResult>> {
    if (coinIds.length === 0) return {};

    try {
      const url = `${this.config.baseUrl}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`;
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        if (response.status === 429) {
          const err: any = new Error('Rate limited');
          err.kind = 'RATE_LIMIT';
          throw err;
        }
        return {};
      }

      const data = await response.json();
      const result: Record<string, PriceResult> = {};
      const now = new Date().toISOString();

      for (const [id, priceData] of Object.entries(data)) {
        const usd = (priceData as any)?.usd;
        if (usd != null) {
          result[id] = { priceUsd: String(usd), asOf: now };
        }
      }

      return result;
    } catch (err: any) {
      if (err.kind === 'RATE_LIMIT') throw err;
      return {};
    }
  }
}
