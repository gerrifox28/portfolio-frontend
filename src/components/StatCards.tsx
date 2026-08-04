import React, { useState } from 'react';
import { AllScenariosResponse } from '../types';

interface Props { result: AllScenariosResponse; allYearsMode?: boolean; }

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

interface CardData {
  type: 'success' | 'danger';
  icon: string;
  label: string;
  value: string;
  sub: string;
  toggle?: boolean;
}

export default function StatCards({ result, allYearsMode = false }: Props) {
  const [showWorstOutcome, setShowWorstOutcome] = useState(false);

  const { failureCount, totalScenarios, failureRate, earliestFailureYears,
        highestEndingBalance, lowestEndingBalance, averageEndingBalance, yearCount } = result;

  const allYearsAverage = result.scenarios.reduce((sum, s) => sum + s.endingBalance, 0) / result.totalScenarios;
  const adjAverage = allYearsMode ? allYearsAverage : averageEndingBalance;

  // Always Total Income, same reasoning as avgAnnualIncome below.
  const bestIncome = Math.max(...result.scenarios.map(s => s.failed ? 0 : (s.finalTotalIncome ?? 0)));
  // True average across every year of every scenario (not just each scenario's final year).
  // Always Total Income (withdrawal + manual Income entries + annuity, if any) so Without
  // and With Annuity are comparing the same thing — not withdrawal-only vs. total income.
  const avgAnnualIncome = result.averageAnnualTotalIncome;

  const outcomeCard: CardData = showWorstOutcome
    ? {
        type: 'danger',
        icon: '📉',
        label: `Worst Outcome After ${yearCount} Years`,
        value: fmt$(lowestEndingBalance),
        sub: 'Lowest remaining balance across all scenarios',
        toggle: true,
      }
    : {
        type: 'success',
        icon: '🏆',
        label: `Best Outcome After ${yearCount} Years`,
        value: fmt$(highestEndingBalance),
        sub: 'Highest remaining balance across all scenarios',
        toggle: true,
      };

  const cards: CardData[] = [
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
    outcomeCard,
    {
      type: 'success',
      icon: '📊',
      label: `Average Balance After ${yearCount} Years`,
      value: fmt$(adjAverage),
      sub: allYearsMode ? 'Mean ending balance among all scenarios' : 'Mean ending balance among surviving scenarios',
    },
  ];

  const incomeCards: CardData[] = [
    {
      type: 'success',
      icon: '💰',
      label: `Best Income After ${yearCount} Years`,
      value: fmt$(bestIncome),
      sub: 'Highest total income in the final simulated year',
    },
    {
      type: 'success',
      icon: '📈',
      label: `Average Annual Income for all ${yearCount} Years`,
      value: fmt$(avgAnnualIncome),
      sub: 'Mean annual total income across all scenarios and all years',
    },
  ];

  return (
    <>
      <div className="stat-cards">
        {cards.map((c, i) => (
          <div key={i} className={`stat-card stat-card--${c.type}`}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-sub">{c.sub}</div>
            {c.toggle && (
              <button
                type="button"
                className="stat-card-toggle"
                onClick={() => setShowWorstOutcome(v => !v)}
              >
                {showWorstOutcome ? 'Show Best Outcome' : 'Show Worst Outcome'}
              </button>
            )}
          </div>
        ))}
      </div>
      {!allYearsMode && (
        <div className="stat-cards">
          {incomeCards.map((c, i) => (
            <div key={i} className={`stat-card stat-card--${c.type}`}>
              <div className="stat-icon">{c.icon}</div>
              <div className="stat-label">{c.label}</div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-sub">{c.sub}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
