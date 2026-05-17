import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { loadEnv } from '@wallet-connect/config';

const env = loadEnv();
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const syncQueue = new Queue('sync-address', { connection });
