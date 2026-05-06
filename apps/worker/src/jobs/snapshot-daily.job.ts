import { PrismaClient } from '@prisma/client';
import { calcPnlNet, formatUsd } from '@wallet-connect/domain';
import Decimal from 'decimal.js';
import pino from 'pino';

const prisma = new PrismaClient();
const logger = pino();

export async function runDailySnapshot(userId: string): Promise<void> {
  logger.info({ userId }, 'Starting daily snapshot');

  // Get user timezone
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    logger.warn({ userId }, 'User not found for snapshot');
    return;
  }

  // Calculate bucket in UTC (simplified: use UTC midnight)
  const today = new Date();
  const dayStr = today.toISOString().split('T')[0];
  const bucketStartUtc = new Date(`${dayStr}T00:00:00Z`);
  const bucketEndUtc = new Date(`${dayStr}T23:59:59Z`);

  // Check if snapshot already exists
  const existing = await prisma.portfolioSnapshotDaily.findUnique({
    where: {
      userId_day_quoteCurrency: {
        userId,
        day: bucketStartUtc,
        quoteCurrency: 'USD',
      },
    },
  });

  if (existing) {
    logger.info({ userId, day: dayStr }, 'Snapshot already exists');
    return;
  }

  // Get all active tracked addresses with positions
  const addresses = await prisma.trackedAddress.findMany({
    where: { userId, status: 'active' },
    include: {
      currentPositions: {
        include: { asset: true },
      },
    },
  });

  let netWorth = new Decimal(0);
  let unpricedValue = new Decimal(0);
  const breakdownByEcosystem: Record<string, string> = {};
  const breakdownByAddress: Array<{ addressId: string; label: string | null; value: string }> = [];

  for (const addr of addresses) {
    let addrTotal = new Decimal(0);

    for (const pos of addr.currentPositions) {
      if (pos.valueUsd) {
        addrTotal = addrTotal.plus(new Decimal(pos.valueUsd));
      }
    }

    netWorth = netWorth.plus(addrTotal);

    breakdownByEcosystem[addr.ecosystem] = new Decimal(
      breakdownByEcosystem[addr.ecosystem] || '0'
    ).plus(addrTotal).toFixed(2);

    breakdownByAddress.push({
      addressId: addr.id,
      label: addr.label,
      value: addrTotal.toFixed(2),
    });
  }

  // Get yesterday's snapshot for PnL calculation
  const yesterday = new Date(bucketStartUtc);
  yesterday.setDate(yesterday.getDate() - 1);

  const previousSnapshot = await prisma.portfolioSnapshotDaily.findUnique({
    where: {
      userId_day_quoteCurrency: {
        userId,
        day: yesterday,
        quoteCurrency: 'USD',
      },
    },
  });

  // Get flow events for today
  const contributions = await sumFlowClass(userId, bucketStartUtc, bucketEndUtc, 'external_contribution');
  const withdrawals = await sumFlowClass(userId, bucketStartUtc, bucketEndUtc, 'external_withdrawal');
  const internalTransfers = await sumFlowClass(userId, bucketStartUtc, bucketEndUtc, 'internal_transfer');
  const fees = await sumFlowClass(userId, bucketStartUtc, bucketEndUtc, 'fee');

  // Calculate PnL
  let pnlNet: Decimal;
  if (previousSnapshot) {
    pnlNet = new Decimal(
      calcPnlNet({
        previous: previousSnapshot.netWorth.toFixed(18),
        current: netWorth.toFixed(18),
        contributions: contributions.toFixed(18),
        withdrawals: withdrawals.toFixed(18),
      })
    );
  } else {
    pnlNet = new Decimal(0);
  }

  // Create snapshot
  await prisma.portfolioSnapshotDaily.create({
    data: {
      userId,
      day: bucketStartUtc,
      bucketStartUtc,
      bucketEndUtc,
      quoteCurrency: 'USD',
      netWorth,
      unpricedValue,
      externalContributions: contributions,
      externalWithdrawals: withdrawals,
      internalTransfers,
      fees,
      pnlNet,
      breakdown: {
        byEcosystem: breakdownByEcosystem,
        byAddress: breakdownByAddress,
      },
    },
  });

  logger.info({ userId, day: dayStr, netWorth: netWorth.toFixed(2), pnlNet: pnlNet.toFixed(2) }, 'Snapshot created');
}

async function sumFlowClass(
  userId: string,
  from: Date,
  to: Date,
  flowClass: string,
): Promise<Decimal> {
  const events = await prisma.flowEvent.findMany({
    where: {
      userId,
      flowClass,
      occurredAt: { gte: from, lte: to },
    },
    select: { amountUsd: true },
  });

  return events.reduce(
    (sum, e) => sum.plus(new Decimal(e.amountUsd || 0)),
    new Decimal(0)
  );
}
