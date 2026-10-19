import type { Bracket, CreditSegment } from './types';

export const r2 = (n: number) => Math.round(n * 100) / 100;

/** Tax over progressive brackets. Negative income gives 0. */
export function bracketTax(income: number, brackets: Bracket[]): number {
  if (income <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    const upper = b.upTo ?? Infinity;
    if (income <= lower) break;
    const slice = Math.min(income, upper) - lower;
    tax += slice * b.rate;
    lower = upper;
  }
  return tax;
}

/** Evaluate a piecewise-linear credit table, never below zero. */
export function credit(income: number, table: CreditSegment[]): number {
  const x = Math.max(0, income);
  for (const s of table) {
    const to = s.to ?? Infinity;
    if (x >= s.from && x < to) return Math.max(0, s.base + s.rate * (x - s.from));
  }
  return 0;
}

/**
 * Bisection on a monotonically non-decreasing function f: finds x in [lo, hi]
 * with f(x) ≈ target. Throws if the target is outside the range.
 */
export function solveIncreasing(
  f: (x: number) => number,
  target: number,
  lo: number,
  hi: number,
  tol = 0.01,
): number {
  if (f(lo) > target) return lo;
  if (f(hi) < target) throw new Error('Doel ligt buiten het rekenbereik');
  for (let i = 0; i < 200 && hi - lo > tol; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < target) lo = mid;
    else hi = mid;
  }
  return hi;
}
