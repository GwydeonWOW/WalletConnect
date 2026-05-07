import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { PrismaClient } from '@prisma/client';
import type { Env } from '@wallet-connect/config';

const prisma = new PrismaClient();

// In-memory challenge store (use Redis in production)
const challenges = new Map<string, string>();

export class AuthService {
  constructor(private env: Env) {}

  async generateRegistrationOptions(userId: string) {
    const options = await generateRegistrationOptions({
      rpID: this.env.WEBAUTHN_RP_ID,
      rpName: this.env.WEBAUTHN_RP_NAME,
      userID: new TextEncoder().encode(userId),
      userName: userId,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    challenges.set(userId, options.challenge);
    return options;
  }

  async verifyRegistration(
    userId: string,
    credential: RegistrationResponseJSON,
  ) {
    const expectedChallenge = challenges.get(userId);
    if (!expectedChallenge) {
      throw new Error('No pending registration challenge found');
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: this.env.WEBAUTHN_ORIGIN,
      expectedRPID: this.env.WEBAUTHN_RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error('Registration verification failed');
    }

    const info = verification.registrationInfo;

    // Create user if not exists, then store credential
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    await prisma.passkeyCredential.create({
      data: {
        userId: user.id,
        credentialId: info.credential.id,
        publicKey: info.credential.publicKey,
        counter: info.credential.counter,
        transports: credential.response.transports?.join(','),
        deviceType: info.credentialDeviceType,
        backedUp: info.credentialBackedUp,
        name: credential.response.transports?.[0] || 'Passkey',
      },
    });

    challenges.delete(userId);
    return { verified: true, userId: user.id };
  }

  async generateLoginOptions() {
    const options = await generateAuthenticationOptions({
      rpID: this.env.WEBAUTHN_RP_ID,
      userVerification: 'preferred',
    });

    challenges.set('login', options.challenge);
    return options;
  }

  async verifyLogin(credential: AuthenticationResponseJSON) {
    const expectedChallenge = challenges.get('login');
    if (!expectedChallenge) {
      throw new Error('No pending login challenge found');
    }

    const cred = await prisma.passkeyCredential.findUnique({
      where: { credentialId: credential.id },
      include: { user: true },
    });

    if (!cred) {
      throw new Error('Credential not found');
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: this.env.WEBAUTHN_ORIGIN,
      expectedRPID: this.env.WEBAUTHN_RP_ID,
      credential: {
        id: cred.credentialId,
        publicKey: cred.publicKey,
        counter: cred.counter,
      },
    });

    if (!verification.verified) {
      throw new Error('Login verification failed');
    }

    // Update counter
    await prisma.passkeyCredential.update({
      where: { id: cred.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    challenges.delete('login');
    return { verified: true, userId: cred.userId };
  }
}
