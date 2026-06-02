import React from 'react';
import { AllScenariosResponse, CashFlow } from '../types';
import { adjustedBalance } from '../cashFlowUtils';

interface Props {
  result: AllScenariosResponse;
  cashFlows?: CashFlow[];
}

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function StatCards({ result, cashFlows = [] }: Props) {
  const { failureCount, totalScenarios, failureRate, earliestFailureYears,
        highestEndingBalance, averageEndingBalance, yearCount, scenarios } = result;

  // Recompute best/average using cash-flow-adjusted balances for surviving scenarios.
  // Failure count/rate and earliest failure are based on raw simulation depletion only.
  let adjHighest = highestEndingBalance;
  let adjAverage = averageEndingBalance;

  if (cashFlows.length > 0 && scenarios?.length > 0) {
    const survivorBalances = scenarios
      .filter(s => !s.failed)
      .map(s => adjustedBalance(s.endingBalance, yearCount, cashFlows));
    if (survivorBalances.length > 0) {
      adjHighest = Math.max(...survivorBalances);
      adjAverage = survivorBalances.reduce((a, b) => a + b, 0) / survivorBalances.length;
    }
  }

  const cards = [
    {
      type: failureCount === 0 ? 'success' : 'danger',
      icon: '⏳',
      label: 'Earliest Portfolio Failure',
      value: failureCount > 0 ? `${earliestFailureYears} years` : 'Never',
      sub: failureCount > 0
        ? 'Shortest time before running out of money'
        : `Portfolio survived all ${yearCount}-year windows`,
    },
    {
      type: failureRate === 0 ? 'success' : 'danger',
      icon: '⚠️',
      label: 'Failure Rate',
      value: `${failureCount} of ${totalScenarios}`,
      sub: `${failureRate}% of all historical scenarios failed`,
    },
    {
      type: 'success',
      icon: '🏆',
      label: `Best Outcome After ${yearCount} Years`,
      value: fmt$(adjHighest),
      sub: 'Highest remaining balance across all scenarios',
    },
    {
      type: 'success',
      icon: '📊',
      label: `Average Balance After ${yearCount} Years`,
      value: fmt$(adjAverage),
      sub: 'Mean ending balance among surviving scenarios',
    },
  ];

  return (
    <div className="stat-cards">
      {cards.map((c, i) => (
        <div key={i} className={`stat-card stat-card--${c.type}`}>
          <div className="stat-icon">{c.icon}</div>
          <div className="stat-label">{c.label}</div>
          <div className="stat-value">{c.value}</div>
          <div className="stat-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
