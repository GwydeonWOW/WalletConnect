export interface ZerionConfig {
  apiKey: string;
  baseUrl: string;
}

export class ZerionClient {
  private headers: Record<string, string>;

  constructor(private config: ZerionConfig) {
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: config.apiKey ? `Bearer ${config.apiKey}` : '',
    };
  }

  async getPortfolioSnapshot(params: {
    address: string;
    chainRef: string;
    freshness?: string;
  }): Promise<any> {
    const url = `${this.config.baseUrl}/wallets/${params.address}/positions/`;
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      const error: any = new Error(`Zerion API error: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return {
      positions: (data.data || []).map((p: any) => ({
        contractRef: p.attributes?.fungible_info?.implementations?.[0]?.address || null,
        isNative: !p.attributes?.fungible_info?.implementations?.[0]?.address,
        symbol: p.attributes?.fungible_info?.symbol || null,
        name: p.attributes?.fungible_info?.name || null,
        decimals: p.attributes?.fungible_info?.decimals || null,
        quantity: p.attributes?.quantity?.numeric || '0',
        priceUsd: p.attributes?.price || null,
        valueUsd: p.attributes?.value || null,
      })),
      asOf: new Date().toISOString(),
    };
  }

  async getActivity(params: {
    address: string;
    chainRef: string;
    from: string;
    to: string;
  }): Promise<any> {
    const url = `${this.config.baseUrl}/wallets/${params.address}/transactions/`;
    const response = await fetch(url, {
      headers: this.headers,
    });

    if (!response.ok) {
      const error: any = new Error(`Zerion API error: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  async getHistory(params: {
    address: string;
    chainRef: string;
    from: string;
    to: string;
  }): Promise<any> {
    const url = `${this.config.baseUrl}/wallets/${params.address}/portfolio/`;
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      const error: any = new Error(`Zerion API error: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }
}
