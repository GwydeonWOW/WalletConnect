import { PrismaClient } from '@prisma/client';
import { calcPnlNet, formatUsd } from '@wallet-connect/domain';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export class PnlService {
  async getDailyPnl(userId: string, from: string, to: string) {
    const snapshots = await prisma.portfolioSnapshotDaily.findMany({
      where: {
        userId,
        day: { gte: new Date(from), lte: new Date(to) },
      },
      orderBy: { day: 'asc' },
    });

    const points = snapshots.map((s) => ({
      date: s.day.toISOString().split('T')[0],
      startNetWorth: '0', // computed from previous snapshot
      endNetWorth: new Decimal(s.netWorth).toFixed(2),
      externalContributions: new Decimal(s.externalContributions).toFixed(2),
      externalWithdrawals: new Decimal(s.externalWithdrawals).toFixed(2),
      internalTransfers: new Decimal(s.internalTransfers).toFixed(2),
      fees: new Decimal(s.fees).toFixed(2),
      pnlNet: new Decimal(s.pnlNet).toFixed(2),
    }));

    let pnlNetPeriod = new Decimal(0);
    let contributionsPeriod = new Decimal(0);
    let withdrawalsPeriod = new Decimal(0);

    for (const s of snapshots) {
      pnlNetPeriod = pnlNetPeriod.plus(new Decimal(s.pnlNet));
      contributionsPeriod = contributionsPeriod.plus(new Decimal(s.externalContributions));
      withdrawalsPeriod = withdrawalsPeriod.plus(new Decimal(s.externalWithdrawals));
    }

    return {
      bucket: 'day',
      points,
      summary: {
        pnlNetPeriod: pnlNetPeriod.toFixed(2),
        contributionsPeriod: contributionsPeriod.toFixed(2),
        withdrawalsPeriod: withdrawalsPeriod.toFixed(2),
      },
    };
  }

  async getSummary(userId: string, from: string, to: string) {
    const snapshots = await prisma.portfolioSnapshotDaily.findMany({
      where: {
        userId,
        day: { gte: new Date(from), lte: new Date(to) },
      },
      orderBy: { day: 'asc' },
    });

    if (snapshots.length === 0) {
      return { pnlNet: '0.00', contributions: '0.00', withdrawals: '0.00', days: 0 };
    }

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];

    let totalPnl = new Decimal(0);
    let totalContributions = new Decimal(0);
    let totalWithdrawals = new Decimal(0);

    for (const s of snapshots) {
      totalPnl = totalPnl.plus(new Decimal(s.pnlNet));
      totalContributions = totalContributions.plus(new Decimal(s.externalContributions));
      totalWithdrawals = totalWithdrawals.plus(new Decimal(s.externalWithdrawals));
    }

    return {
      pnlNet: totalPnl.toFixed(2),
      contributions: totalContributions.toFixed(2),
      withdrawals: totalWithdrawals.toFixed(2),
      startNetWorth: new Decimal(first.netWorth).toFixed(2),
      endNetWorth: new Decimal(last.netWorth).toFixed(2),
      days: snapshots.length,
    };
  }
}
