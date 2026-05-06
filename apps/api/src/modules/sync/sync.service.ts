import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SyncService {
  async getJobStatus(userId: string, jobId: string) {
    const job = await prisma.syncJob.findFirst({
      where: { id: jobId, userId },
    });
    return job;
  }
}
