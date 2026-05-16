export interface EvmRpcConfig {
  rpcUrl: string;
}

interface JsonRpcResponse<T> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

export class EvmRpcClient {
  private id = 0;

  constructor(private config: EvmRpcConfig) {}

  async getNativeBalance(address: string): Promise<bigint> {
    const result = await this.call<string>('eth_getBalance', [address, 'latest']);
    return BigInt(result);
  }

  async getErc20Balance(tokenAddress: string, walletAddress: string): Promise<bigint> {
    const data = `0x70a08231${walletAddress.slice(2).padStart(64, '0')}`;
    const result = await this.call<string>('eth_call', [{ to: tokenAddress, data }, 'latest']);
    if (result === '0x' || result === '0x0') return 0n;
    return BigInt(result);
  }

  async getErc20Decimals(tokenAddress: string): Promise<number> {
    const data = '0x313ce567';
    const result = await this.call<string>('eth_call', [{ to: tokenAddress, data }, 'latest']);
    return Number(BigInt(result));
  }

  private async call<T>(method: string, params: unknown[]): Promise<T> {
    const id = ++this.id;
    const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });

    const res = await fetch(this.config.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!res.ok) {
      const err: any = new Error(`RPC error: ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const json = (await res.json()) as JsonRpcResponse<T>;
    if (json.error) {
      const err: any = new Error(`RPC error: ${json.error.code} ${json.error.message}`);
      err.status = 500;
      throw err;
    }

    return json.result as T;
  }
}
