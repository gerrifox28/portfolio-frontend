import React from 'react';
import { AllScenariosResponse } from '../types';

interface Props { result: AllScenariosResponse; }

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function StatCards({ result }: Props) {
  const { failureCount, totalScenarios, failureRate, earliestFailureYears,
        highestEndingBalance, averageEndingBalance, yearCount } = result;

  const cards = [
    {
      type: 'danger',
      icon: '⏳',
      label: 'Earliest Portfolio Failure',
      value: failureCount > 0 ? `${earliestFailureYears} years` : 'Never',
      sub: failureCount > 0
        ? 'Shortest time before running out of money'
        : `Portfolio survived all ${yearCount}-year windows`,
    },
    {
      type: 'danger',
      icon: '⚠️',
      label: 'Failure Rate',
      value: `${failureCount} of ${totalScenarios}`,
      sub: `${failureRate}% of all historical scenarios failed`,
    },
    {
      type: 'success',
      icon: '🏆',
      label: `Best Outcome After ${yearCount} Years`,
      value: fmt$(highestEndingBalance),
      sub: 'Highest remaining balance across all scenarios',
    },
    {
      type: 'success',
      icon: '📊',
      label: `Average Balance After ${yearCount} Years`,
      value: fmt$(averageEndingBalance),
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
