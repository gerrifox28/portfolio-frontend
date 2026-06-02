import { CashFlow, YearResult } from './types';

/**
 * Single-year helper used for scatter plot / outcomes grid final-balance display.
 * Depletion guard: if rawBalance <= 0, no flows applied and 0 is returned.
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

/**
 * Year-by-year sequential helper for PortfolioChart and ResultsTable.
 * Before applying each year's flows, checks if the pre-flow balance (raw
 * simulation result) is $0 or below. Once depleted — either by the raw
 * simulation or by a cash flow pushing the adjusted balance to $0 — all
 * subsequent years are locked at $0.
 */
export function applyFlowsToYears(
  data: YearResult[],
  cashFlows: CashFlow[]
): number[] {
  let depleted = false;
  return data.map(r => {
    if (depleted || r.portfolioEnd <= 0) {
      depleted = true;
      return 0;
    }
    if (cashFlows.length === 0) return r.portfolioEnd;
    const adj = cashFlows.reduce((sum, cf) => {
      return (cf.allYears || cf.year === r.sequenceNumber) ? sum + cf.amount : sum;
    }, r.portfolioEnd);
    if (adj <= 0) depleted = true;
    return Math.max(0, adj);
  });
}
