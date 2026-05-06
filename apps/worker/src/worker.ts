import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { loadEnv } from '@wallet-connect/config';
import pino from 'pino';

const env = loadEnv();
const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

// Queues
export const syncQueue = new Queue('sync-address', { connection });
export const snapshotQueue = new Queue('snapshot-daily', { connection });
export const retryPriceQueue = new Queue('retry-stale-prices', { connection });
export const reclassifyQueue = new Queue('reclassify-flows', { connection });

// Sync worker
const syncWorker = new Worker(
  'sync-address',
  async (job) => {
    const { addressId, userId } = job.data;
    logger.info({ addressId, userId, jobId: job.id }, 'Processing sync-address job');

    // TODO: Import and run adapter sync logic
    // For now, log the job processing
    logger.info({ addressId }, 'Sync job completed (stub)');
    return { addressId, status: 'completed' };
  },
  {
    connection,
    concurrency: 5,
    limiter: { max: 10, duration: 60000 },
  },
);

syncWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Sync job completed');
});

syncWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, 'Sync job failed');
});

// Snapshot worker
const snapshotWorker = new Worker(
  'snapshot-daily',
  async (job) => {
    const { userId } = job.data;
    logger.info({ userId, jobId: job.id }, 'Processing snapshot-daily job');
    // TODO: Implement snapshot logic
    return { userId, status: 'completed' };
  },
  {
    connection,
    concurrency: 1,
  },
);

snapshotWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Snapshot job completed');
});

snapshotWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, 'Snapshot job failed');
});

logger.info('Worker started and listening for jobs...');

// Schedule daily snapshots at 00:10 Europe/Madrid
setInterval(async () => {
  const now = new Date();
  const madridOffset = now.getTimezoneOffset() === -60; // rough check
  const hour = now.getHours();
  const minute = now.getMinutes();

  if (hour === 22 && minute === 10) { // UTC 22:10 = Madrid 00:10 (summer)
    logger.info('Triggering daily snapshot for all active users');
    // TODO: Fetch all active users and enqueue snapshot jobs
  }
}, 60000);

process.on('SIGTERM', async () => {
  logger.info('Shutting down worker...');
  await syncWorker.close();
  await snapshotWorker.close();
  await connection.quit();
  process.exit(0);
});
