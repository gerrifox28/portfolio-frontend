import React from 'react';
import { AllScenariosResponse } from '../types';

interface Props { result: AllScenariosResponse; allYearsMode?: boolean; annuityMode?: boolean; }

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function StatCards({ result, allYearsMode = false, annuityMode = false }: Props) {
  const { failureCount, totalScenarios, failureRate, earliestFailureYears,
        highestEndingBalance, averageEndingBalance, yearCount } = result;

  const adjHighest = highestEndingBalance;
  const allYearsAverage = result.scenarios.reduce((sum, s) => sum + s.endingBalance, 0) / result.totalScenarios;
  const adjAverage = allYearsMode ? allYearsAverage : averageEndingBalance;

  const bestIncome = Math.max(...result.scenarios.map(s =>
    s.failed ? 0 : (annuityMode ? (s.finalTotalIncome ?? 0) : (s.finalWithdrawal ?? 0))
  ));
  const avgAnnualIncome = annuityMode
    ? (result.averageAnnualTotalIncome ?? 0)
    : (result.averageAnnualWithdrawal ?? 0);

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
      sub: allYearsMode ? 'Mean ending balance among all scenarios' : 'Mean ending balance among surviving scenarios',
    },
  ];

  const incomeCards = [
    {
      type: 'success',
      icon: '💰',
      label: `Best Income After ${yearCount} Years`,
      value: fmt$(bestIncome),
      sub: `Highest ${annuityMode ? 'total income' : 'withdrawal'} in the final simulated year`,
    },
    {
      type: 'success',
      icon: '📈',
      label: `Average Annual Income for all ${yearCount} Years`,
      value: fmt$(avgAnnualIncome),
      sub: `Mean annual ${annuityMode ? 'total income' : 'withdrawal'} across all scenarios and all years`,
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
