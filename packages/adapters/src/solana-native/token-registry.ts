export interface SolanaTokenMeta {
  symbol: string;
  name: string;
  decimals: number;
}

const KNOWN_TOKENS: Record<string, SolanaTokenMeta> = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana', decimals: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': { symbol: 'RAY', name: 'Raydium', decimals: 6 },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk', decimals: 5 },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', name: 'Jupiter', decimals: 6 },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', name: 'Marinade Staked SOL', decimals: 9 },
  'bSo13r4TkiE4KumL71LsHTPp64NeyB1k9KzzJXPjaQ6': { symbol: 'bSOL', name: 'BlazeStake Staked SOL', decimals: 9 },
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': { symbol: 'stSOL', name: 'Lido Staked SOL', decimals: 9 },
  'SRMUApK6qSfRCsxH7NR5N7BNmQvm6QG7SVtPhGVvNQW': { symbol: 'SRM', name: 'Serum', decimals: 6 },
  'MEW1gQWJ3a6xB7Ma2tYfg7CFfMfYL4F5L2WcsaKFDs5': { symbol: 'CAT', name: 'Cat in a Dogs World', decimals: 9 },
  'PRT884ndppe1jRqHy3NnJk4oCxkt6FzGfGr8eh6CUqfi': { symbol: 'POL', name: 'Pollex', decimals: 6 },
  'kinXdEcpDQeHPEuQnqmUgtYykqKGVFg6Aj7iy2CsJyv': { symbol: 'KIN', name: 'Kin', decimals: 9 },
  'DP6oYBrK6Ja63WsDLWwS4ThtD6qXJxxc3KnEz4hbdHTE': { symbol: 'BOME', name: 'Book of Meme', decimals: 9 },
  'GHUsV5WtQ3o312Cu8R7BW5q3AreYVHrrHmD6NBjQ2SqK': { symbol: 'PYTH', name: 'Pyth Network', decimals: 6 },
  'AR1MtL7V3bG5o2PkSExg2vJFjm2GvAbAt8Nq8gVqPpCV': { symbol: 'ORCA', name: 'Orca', decimals: 6 },
  'orcaEiT66vq5HPApCBLtztRzL3VfbMcRTrJddKMBc5eu': { symbol: 'ORCA', name: 'Orca', decimals: 6 },
  'pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn': { symbol: 'PUMP', name: 'Pump.fun', decimals: 6 },
};

export function getSolanaTokenMeta(mint: string): SolanaTokenMeta | null {
  return KNOWN_TOKENS[mint] ?? null;
}
