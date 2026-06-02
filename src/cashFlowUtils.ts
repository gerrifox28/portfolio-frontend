import { CashFlow } from './types';

/**
 * Applies manual cash flows to a raw simulation balance for display purposes.
 * Depletion guard: if rawBalance <= 0, the nest egg is considered exhausted —
 * no flows are applied and 0 is returned.
 */
export function adjustedBalance(
  rawBalance: number,
  seq: number,
  cashFlows: CashFlow[]
): number {
  if (rawBalance <= 0 || cashFlows.length === 0) return Math.max(0, rawBalance);
  const adj = cashFlows.reduce((sum, cf) => {
    return (cf.allYears || cf.year === seq) ? sum + cf.amount : sum;
  }, 0);
  return Math.max(0, rawBalance + adj);
}
