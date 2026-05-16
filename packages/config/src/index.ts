import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/walletconnect'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  COINGECKO_API_KEY: z.string().optional(),
  COINGECKO_BASE_URL: z.string().default('https://api.coingecko.com/api/v3'),
  ZERION_API_KEY: z.string().optional(),
  ZERION_BASE_URL: z.string().default('https://api.zerion.io/v1'),
  EVM_RPC_URL: z.string().optional(),
  SOLANA_RPC_URL: z.string().default('https://api.mainnet-beta.solana.com'),
  SUI_RPC_URL: z.string().default('https://fullnode.mainnet.sui.io:443'),
  SESSION_SECRET: z.string().default('change-me-in-production'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  return envSchema.parse(process.env);
}
