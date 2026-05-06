import { describe, it, expect } from 'vitest';
import { multiply, add, subtract, calcPnlNet, withinTolerance, formatUsd } from '../../src/math/index.js';

describe('multiply', () => {
  it('multiplies two decimal strings', () => {
    expect(multiply('2.5', '3.0')).toBe('7.500000000000000000');
  });

  it('handles zero', () => {
    expect(multiply('100', '0')).toBe('0.000000000000000000');
  });
});

describe('calcPnlNet', () => {
  it('calculates PnL correctly', () => {
    // V_t=12300, V_(t-1)=10000, C_t=2000, W_t=0 => PnL=300
    const pnl = calcPnlNet({
      previous: '10000',
      current: '12300',
      contributions: '2000',
      withdrawals: '0',
    });
    expect(pnl.startsWith('300')).toBe(true);
  });

  it('handles negative PnL', () => {
    const pnl = calcPnlNet({
      previous: '10000',
      current: '9500',
      contributions: '0',
      withdrawals: '0',
    });
    expect(pnl.startsWith('-500')).toBe(true);
  });

  it('handles withdrawals correctly', () => {
    const pnl = calcPnlNet({
      previous: '10000',
      current: '8000',
      contributions: '0',
      withdrawals: '1500',
    });
    // PnL = 8000 - 10000 - 0 + 1500 = -500
    expect(pnl.startsWith('-500')).toBe(true);
  });
});

describe('withinTolerance', () => {
  it('returns true when within tolerance', () => {
    expect(withinTolerance('100', '99.5', 0.01)).toBe(true);
  });

  it('returns false when outside tolerance', () => {
    expect(withinTolerance('100', '98', 0.01)).toBe(false);
  });
});

describe('formatUsd', () => {
  it('formats to 2 decimal places', () => {
    expect(formatUsd('1234.5678')).toBe('1234.57');
  });
});
