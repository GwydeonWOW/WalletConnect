import type { Ecosystem } from '@wallet-connect/domain';

export interface UpstreamError extends Error {
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
  const message = err?.message || `Upstream error from ${provider}`;

  if (err?.kind === 'RATE_LIMIT' || err?.status === 429) {
    const error = new Error(message) as UpstreamError;
    error.code = 'UPSTREAM_RATE_LIMITED';
    error.httpStatus = 503;
    error.retryable = true;
    error.retryAfterSec = err?.retryAfterSec ?? 30;
    error.provider = provider;
    error.ecosystem = ecosystem;
    return error;
  }

  if (err?.kind === 'NOT_SUPPORTED' || err?.status === 501) {
    const error = new Error(message) as UpstreamError;
    error.code = 'UPSTREAM_NOT_SUPPORTED';
    error.httpStatus = 501;
    error.retryable = false;
    error.provider = provider;
    error.ecosystem = ecosystem;
    return error;
  }

  if (err?.kind === 'INVALID_ADDRESS' || err?.status === 400) {
    const error = new Error(message) as UpstreamError;
    error.code = 'VALIDATION_ERROR';
    error.httpStatus = 400;
    error.retryable = false;
    error.provider = provider;
    error.ecosystem = ecosystem;
    return error;
  }

  const error = new Error(message) as UpstreamError;
  error.code = 'UPSTREAM_TEMPORARY';
  error.httpStatus = 503;
  error.retryable = true;
  error.provider = provider;
  error.ecosystem = ecosystem;
  return error;
}
