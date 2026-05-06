import Decimal from 'decimal.js';

Decimal.set({ precision: 38 });

export function multiply(a: string, b: string): string {
  return new Decimal(a).mul(new Decimal(b)).toFixed(18);
}

export function add(a: string, b: string): string {
  return new Decimal(a).plus(new Decimal(b)).toFixed(18);
}

export function subtract(a: string, b: string): string {
  return new Decimal(a).minus(new Decimal(b)).toFixed(18);
}

export function divide(a: string, b: string): string {
  return new Decimal(a).div(new Decimal(b)).toFixed(18);
}

export function isZero(a: string): boolean {
  return new Decimal(a).isZero();
}

export function gt(a: string, b: string): boolean {
  return new Decimal(a).greaterThan(new Decimal(b));
}

export function gte(a: string, b: string): boolean {
  return new Decimal(a).greaterThanOrEqualTo(new Decimal(b));
}

export function lte(a: string, b: string): boolean {
  return new Decimal(a).lessThanOrEqualTo(new Decimal(b));
}

export function withinTolerance(a: string, b: string, tolerance: number): boolean {
  const diff = new Decimal(a).minus(new Decimal(b)).abs();
  const max = new Decimal(a).abs().greaterThan(new Decimal(b).abs())
    ? new Decimal(a).abs()
    : new Decimal(b).abs();
  if (max.isZero()) return diff.isZero();
  return diff.div(max).lessThanOrEqualTo(tolerance);
}

export function calcPnlNet(input: {
  previous: string;
  current: string;
  contributions: string;
  withdrawals: string;
}): string {
  // PnL_t = V_t - V_(t-1) - C_t + W_t
  return new Decimal(input.current)
    .minus(new Decimal(input.previous))
    .minus(new Decimal(input.contributions))
    .plus(new Decimal(input.withdrawals))
    .toFixed(18);
}

export function dec(value: string): Decimal {
  return new Decimal(value);
}

export function formatUsd(value: string): string {
  return new Decimal(value).toFixed(2);
}

// Re-export Decimal for direct usage
export { Decimal };
