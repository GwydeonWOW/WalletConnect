import Redis from 'ioredis';
import { loadEnv } from '@wallet-connect/config';

const env = loadEnv();

export function createRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}
