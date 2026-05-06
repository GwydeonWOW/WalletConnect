import { describe, it, expect } from 'vitest';
import { canonicalizeAddress, canonicalizeAsset } from '../../src/value-objects/canonicalize.js';

describe('canonicalizeAddress', () => {
  it('lowercases EVM addresses', () => {
    expect(canonicalizeAddress('evm', '0xABC123DEF456')).toBe('0xabc123def456');
  });

  it('does not modify Solana addresses', () => {
    const addr = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
    expect(canonicalizeAddress('solana', addr)).toBe(addr);
  });

  it('normalizes Sui addresses with 0x prefix and lowercase', () => {
    expect(canonicalizeAddress('sui', '0xABC123')).toBe('0xabc123');
    expect(canonicalizeAddress('sui', 'abc123')).toBe('0xabc123');
  });
});

describe('canonicalizeAsset', () => {
  it('canonicalizes native EVM asset', () => {
    expect(canonicalizeAsset({ ecosystem: 'evm', chainRef: 'eip155:1', isNative: true }))
      .toBe('evm:eip155:1:native');
  });

  it('canonicalizes ERC-20 token', () => {
    expect(canonicalizeAsset({
      ecosystem: 'evm',
      chainRef: 'eip155:1',
      contractRef: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    })).toBe('evm:eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
  });

  it('canonicalizes Solana token', () => {
    expect(canonicalizeAsset({
      ecosystem: 'solana',
      chainRef: 'solana:mainnet',
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    })).toBe('solana:mint:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  });

  it('canonicalizes Sui coin', () => {
    expect(canonicalizeAsset({
      ecosystem: 'sui',
      chainRef: 'sui:mainnet',
      coinType: '0x2::sui::SUI'
    })).toBe('sui:coin:0x2::sui::SUI');
  });
});
