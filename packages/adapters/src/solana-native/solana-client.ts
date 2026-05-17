export interface SolanaConfig {
  rpcUrl: string;
}

export class SolanaClient {
  private id = 0;

  constructor(private config: SolanaConfig) {}

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

  async getBalance(address: string): Promise<number> {
    const result = await this.call('getBalance', [address]);
    return (result.value || 0) / 1e9;
  }

  async getTokenAccounts(address: string): Promise<any[]> {
    const result = await this.call('getTokenAccountsByWallet', [address]);
    return result?.value || [];
  }

  async getTokenAccountsByOwner(address: string): Promise<any[]> {
    const [classic, token2022] = await Promise.allSettled([
      this.call('getTokenAccountsByOwner', [
        address,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed' },
      ]),
      this.call('getTokenAccountsByOwner', [
        address,
        { programId: 'TokenzQdBNb4qKCdPVT5Buy4R2psNu6DE6FPtGiXY3rQ' },
        { encoding: 'jsonParsed' },
      ]),
    ]);

    const accounts = [
      ...(classic.status === 'fulfilled' ? classic.value?.value || [] : []),
      ...(token2022.status === 'fulfilled' ? token2022.value?.value || [] : []),
    ];
    return accounts;
  }

  async getSignatures(address: string, limit = 50): Promise<any[]> {
    const result = await this.call('getSignaturesForAddress', [
      address,
      { limit },
    ]);
    return result || [];
  }
}
