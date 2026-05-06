export interface SuiConfig {
  rpcUrl: string;
}

export class SuiDataClient {
  private id = 0;

  constructor(private config: SuiConfig) {}

  private async call(method: string, params: any[]): Promise<any> {
    const response = await fetch(this.config.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++this.id,
        method,
        params,
      }),
    });

    const data = await response.json();
    if (data.error) {
      const err: any = new Error(data.error.message);
      err.status = response.status;
      throw err;
    }
    return data.result;
  }

  async listBalances(address: string): Promise<Array<{ coinType: string; quantity: string }>> {
    const result = await this.call('suix_getAllBalances', [address]);
    return (result || []).map((b: any) => ({
      coinType: b.coinType,
      quantity: b.totalBalance || '0',
    }));
  }

  async listTransactions(params: {
    address: string;
    from?: string;
    to?: string;
  }): Promise<any[]> {
    const result = await this.call('suix_queryTransactionBlocks', [
      { filter: { FromOrToAddress: { addr: params.address } } },
      { limit: 50, descendingOrder: true },
    ]);
    return result?.data || [];
  }

  async getCoinMetadata(coinType: string): Promise<any> {
    try {
      return await this.call('suix_getCoinMetadata', [coinType]);
    } catch {
      return null;
    }
  }
}
