import type { Ecosystem } from '../contracts/index.js';

export function canonicalizeAddress(ecosystem: Ecosystem, address: string): string {
  switch (ecosystem) {
    case 'evm':
      return address.toLowerCase();
    case 'solana':
      return address; // base58, no lowercasing
    case 'sui':
      return address.startsWith('0x') ? address.toLowerCase() : `0x${address}`.toLowerCase();
    default:
      throw new Error(`Unknown ecosystem: ${ecosystem}`);
  }
}

export function canonicalizeAsset(input: {
  ecosystem: Ecosystem;
  chainRef: string;
  contractRef?: string | null;
  mint?: string | null;
  coinType?: string | null;
  isNative?: boolean;
}): string {
  if (input.ecosystem === 'evm') {
    return input.isNative
      ? `evm:${input.chainRef}:native`
      : `evm:${input.chainRef}:${(input.contractRef ?? '').toLowerCase()}`;
  }
  if (input.ecosystem === 'solana') {
    return `solana:mint:${input.mint}`;
  }
  return `sui:coin:${input.coinType}`;
}
