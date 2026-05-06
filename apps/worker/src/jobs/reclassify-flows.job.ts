import { PrismaClient } from '@prisma/client';
import { withinTolerance } from '@wallet-connect/domain';
import Decimal from 'decimal.js';
import pino from 'pino';

const prisma = new PrismaClient();
const logger = pino();

export async function reclassifyFlows(userId: string): Promise<void> {
  logger.info({ userId }, 'Starting flow reclassification');

  // Get all unclassified or unknown flow events
  const events = await prisma.flowEvent.findMany({
    where: {
      userId,
      flowClass: 'unknown',
    },
    orderBy: { occurredAt: 'asc' },
    include: { trackedAddress: true },
  });

  if (events.length === 0) {
    logger.info({ userId }, 'No unknown flows to reclassify');
    return;
  }

  // Group by candidate key for internal transfer matching
  const groups = new Map<string, typeof events>();

  for (const event of events) {
    // Try to match by txHash first
    if (event.txHash) {
      const key = `tx:${event.txHash}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(event);
    }

    // Also group by asset + amount + time window
    if (event.assetId && event.amount) {
      const amountKey = new Decimal(event.amount).toFixed(4);
      const timeKey = event.occurredAt.toISOString().split('T')[0];
      const key = `asset:${event.assetId}:${amountKey}:${timeKey}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(event);
    }
  }

  let reclassified = 0;

  for (const [, group] of groups) {
    if (group.length < 2) continue;

    const outs = group.filter((e) => e.direction === 'out');
    const ins = group.filter((e) => e.direction === 'in');

    for (const out of outs) {
      for (const inc of ins) {
        // Check if same user and same ecosystem
        const sameUser = out.userId === inc.userId;
        const sameEcosystem =
          out.trackedAddress?.ecosystem === inc.trackedAddress?.ecosystem;
        const compatibleAsset = out.assetId === inc.assetId;
        const compatibleAmount = out.amount && inc.amount
          ? withinTolerance(out.amount.toString(), inc.amount.toString(), 0.01)
          : false;

        // Score confidence
        let confidence = 0;
        if (sameUser) confidence += 0.4;
        if (sameEcosystem) confidence += 0.2;
        if (compatibleAsset) confidence += 0.2;
        if (compatibleAmount) confidence += 0.2;

        if (confidence >= 0.9) {
          const groupKey = `${out.id}-${inc.id}`;

          await prisma.flowEvent.update({
            where: { id: out.id },
            data: {
              flowClass: 'internal_transfer',
              confidence: new Decimal(confidence),
              internalGroupKey: groupKey,
            },
          });

          await prisma.flowEvent.update({
            where: { id: inc.id },
            data: {
              flowClass: 'internal_transfer',
              confidence: new Decimal(confidence),
              internalGroupKey: groupKey,
            },
          });

          reclassified += 2;
        }
      }
    }
  }

  logger.info({ userId, reclassified }, 'Flow reclassification complete');
}
