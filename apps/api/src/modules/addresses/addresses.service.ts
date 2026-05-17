import { PrismaClient } from '@prisma/client';
import { canonicalizeAddress } from '@wallet-connect/domain';
import type { ImportAddressRequest } from '@wallet-connect/domain';
import { syncQueue } from '../../queue.js';

const prisma = new PrismaClient();

export class AddressService {
  async importAddress(userId: string, data: ImportAddressRequest) {
    const normalizedAddress = canonicalizeAddress(data.ecosystem, data.address);

    const existing = await prisma.trackedAddress.findUnique({
      where: {
        userId_ecosystem_addressNormalized: {
          userId,
          ecosystem: data.ecosystem,
          addressNormalized: normalizedAddress,
        },
      },
    });

    if (existing && existing.status === 'active') {
      return {
        addressId: existing.id,
        normalizedAddress,
        syncJobId: null,
        warnings: ['ADDRESS_ALREADY_TRACKED'],
      };
    }

    const address = await prisma.trackedAddress.upsert({
      where: {
        userId_ecosystem_addressNormalized: {
          userId,
          ecosystem: data.ecosystem,
          addressNormalized: normalizedAddress,
        },
      },
      update: {
        status: 'active',
        walletSource: data.walletSource,
        chainRef: data.chainRef,
        addressRaw: data.address,
        label: data.label,
        lastSeenFromWallet: new Date(),
      },
      create: {
        userId,
        ecosystem: data.ecosystem,
        walletSource: data.walletSource,
        chainRef: data.chainRef,
        addressRaw: data.address,
        addressNormalized: normalizedAddress,
        label: data.label,
        status: 'active',
        lastSeenFromWallet: new Date(),
      },
    });

    // Create sync job in DB + enqueue to BullMQ
    const syncJob = await prisma.syncJob.create({
      data: {
        userId,
        trackedAddressId: address.id,
        jobType: 'sync-address',
        status: 'queued',
        trigger: data.importMode === 'wallet_connect' ? 'wallet_connect' : 'manual',
      },
    });

    await syncQueue.add('sync-address', { addressId: address.id, userId }, { jobId: syncJob.id });

    return {
      addressId: address.id,
      normalizedAddress,
      syncJobId: syncJob.id,
      warnings: [],
    };
  }

  async listAddresses(userId: string) {
    return prisma.trackedAddress.findMany({
      where: { userId, status: { not: 'archived' } },
      orderBy: { importedAt: 'desc' },
    });
  }

  async patchAddress(userId: string, addressId: string, data: { label?: string; status?: string }) {
    const address = await prisma.trackedAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) return null;

    return prisma.trackedAddress.update({
      where: { id: addressId },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.status && { status: data.status as any }),
      },
    });
  }

  async deactivateAddress(userId: string, addressId: string) {
    const address = await prisma.trackedAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) return null;

    return prisma.trackedAddress.update({
      where: { id: addressId },
      data: { status: 'inactive' },
    });
  }

  async createSyncJob(userId: string, addressId: string) {
    const address = await prisma.trackedAddress.findFirst({
      where: { id: addressId, userId, status: 'active' },
    });

    if (!address) return null;

    const syncJob = await prisma.syncJob.create({
      data: {
        userId,
        trackedAddressId: address.id,
        jobType: 'sync-address',
        status: 'queued',
        trigger: 'manual',
      },
    });

    await syncQueue.add('sync-address', { addressId: address.id, userId }, { jobId: syncJob.id });

    return syncJob;
  }
}
