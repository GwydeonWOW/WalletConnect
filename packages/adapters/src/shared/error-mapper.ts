import type { Ecosystem } from '@wallet-connect/domain';

export interface UpstreamError {
  code: string;
  httpStatus: number;
  retryable: boolean;
  retryAfterSec?: number;
  provider: string;
  ecosystem: Ecosystem;
}

export function mapUpstreamError(
  err: any,
  provider: string,
  ecosystem: Ecosystem,
): UpstreamError {
  if (err?.kind === 'RATE_LIMIT' || err?.status === 429) {
    return {
      code: 'UPSTREAM_RATE_LIMITED',
      httpStatus: 503,
      retryable: true,
      retryAfterSec: err?.retryAfterSec ?? 30,
      provider,
      ecosystem,
    };
  }

  if (err?.kind === 'NOT_SUPPORTED' || err?.status === 501) {
    return {
      code: 'UPSTREAM_NOT_SUPPORTED',
      httpStatus: 501,
      retryable: false,
      provider,
      ecosystem,
    };
  }

  if (err?.kind === 'INVALID_ADDRESS' || err?.status === 400) {
    return {
      code: 'VALIDATION_ERROR',
      httpStatus: 400,
      retryable: false,
      provider,
      ecosystem,
    };
  }

  return {
    code: 'UPSTREAM_TEMPORARY',
    httpStatus: 503,
    retryable: true,
    provider,
    ecosystem,
  };
}
