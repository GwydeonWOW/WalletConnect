import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';
import type { Env } from '@wallet-connect/config';

const prisma = new PrismaClient();

export class AuthService {
  constructor(private env: Env) {}

  async registerStart(email: string) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    const existing = await prisma.totpCredential.findUnique({ where: { userId: user.id } });
    if (existing?.verified) {
      throw new Error('User already registered. Please login instead.');
    }

    const secret = authenticator.generateSecret();

    await prisma.totpCredential.upsert({
      where: { userId: user.id },
      update: { secret, verified: false },
      create: { userId: user.id, secret, verified: false },
    });

    const issuer = 'WalletConnect';
    const uri = authenticator.keyuri(email, issuer, secret);
    const qrUrl = await QRCode.toDataURL(uri);

    return { qrUrl, email };
  }

  async registerVerify(email: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { totpCredentials: true },
    });

    if (!user || user.totpCredentials.length === 0) {
      throw new Error('No pending registration found. Start registration first.');
    }

    const cred = user.totpCredentials[0];
    const valid = authenticator.check(code, cred.secret);
    if (!valid) {
      throw new Error('Invalid verification code');
    }

    await prisma.totpCredential.update({
      where: { id: cred.id },
      data: { verified: true },
    });

    return { verified: true, userId: user.id };
  }

  async loginStart(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { totpCredentials: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const verifiedCred = user.totpCredentials.find((c) => c.verified);
    if (!verifiedCred) {
      throw new Error('User not verified. Complete registration first.');
    }

    return { email };
  }

  async loginVerify(email: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { totpCredentials: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const verifiedCred = user.totpCredentials.find((c) => c.verified);
    if (!verifiedCred) {
      throw new Error('User not verified');
    }

    const valid = authenticator.check(code, verifiedCred.secret);
    if (!valid) {
      throw new Error('Invalid verification code');
    }

    return { verified: true, userId: user.id };
  }
}
