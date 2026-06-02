import React from 'react';
import { ScenarioSummary, CashFlow } from '../types';
import { adjustedBalance } from '../cashFlowUtils';

interface Props {
  scenarios: ScenarioSummary[];
  yearCount: number;
  onYearClick?: (year: number) => void;
  selectedYear?: number;
  incomeMode?: boolean;
  annuityMode?: boolean;
  cashFlows?: CashFlow[];
}

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return '$0';
}

function getDisplayValue(s: ScenarioSummary, annuityMode: boolean): number {
  return annuityMode ? (s.finalTotalIncome ?? 0) : (s.finalWithdrawal ?? 0);
}

export default function OutcomesHeatmap({ scenarios, yearCount, onYearClick, selectedYear, incomeMode = false, annuityMode = false, cashFlows = [] }: Props) {
  const adjBalances = scenarios.map(s => adjustedBalance(s.endingBalance, yearCount, cashFlows));
  const maxBalance = Math.max(...adjBalances);
  const maxIncome  = Math.max(...scenarios.map(s => getDisplayValue(s, annuityMode)));

  return (
    <div className="chart-container">
      <div className="chart-header">
        {incomeMode
          ? <h3>{yearCount}-Year {annuityMode ? 'Total Income' : 'Withdrawal'} Grid by Starting Year</h3>
          : <h3>{yearCount}-Year Outcomes Grid by Starting Year</h3>
        }
        {!incomeMode && (
          <div className="chart-legend">
            <span className="legend-dot legend-dot--success" /> Survived — brighter green = larger balance &nbsp;
            <span className="legend-dot legend-dot--danger" /> Failed — brighter red = failed sooner
          </div>
        )}
      </div>

      <div className="heatmap-grid">
        {scenarios.map((s, i) => {
          const adjBal = adjBalances[i];
          let bg: string;

          if (incomeMode) {
            const incomeValue = getDisplayValue(s, annuityMode);
            const intensity = maxIncome > 0 ? incomeValue / maxIncome : 0;
            const opacity = Math.max(0.35, 0.2 + intensity * 0.75);
            bg = s.failed
              ? `rgba(220, 38, 38, ${opacity})`
              : `rgba(99, 102, 241, ${opacity})`;
          } else if (s.failed) {
            const failSeverity = 1 - (s.yearsSurvived / yearCount);
            const opacity = 0.35 + failSeverity * 0.65;
            bg = `rgba(220, 38, 38, ${opacity})`;
          } else {
            const wealth = maxBalance > 0 ? adjBal / maxBalance : 0;
            const opacity = 0.2 + wealth * 0.75;
            bg = `rgba(16, 185, 129, ${opacity})`;
          }

          const isSelected = selectedYear === s.startYear;
          return (
            <div
              key={s.startYear}
              className={`heatmap-cell ${onYearClick ? 'heatmap-cell--clickable' : ''} ${isSelected ? 'heatmap-cell--selected' : ''}`}
              style={{ background: bg }}
              onClick={() => onYearClick?.(s.startYear)}
              title={onYearClick ? `Click to explore ${s.startYear}` : undefined}
            >
              <div className="heatmap-year">{s.startYear}</div>
              <div className="heatmap-value">
                {incomeMode
                  ? fmt$(getDisplayValue(s, annuityMode))
                  : s.failed
                    ? <><span className="heatmap-fail">✗</span> {s.yearsSurvived}yr</>
                    : fmt$(adjBal)
                }
              </div>
            </div>
          );
        })}
      </div>

      <p className="chart-note">
        {incomeMode
          ? `Each tile shows the final-year ${annuityMode ? 'total income (portfolio + annuity)' : 'withdrawal amount'} for that starting year. Brighter = higher income.${onYearClick ? ' Click any tile to see the year-by-year detail.' : ''}`
          : `Each tile represents one ${yearCount}-year retirement window. Greener = larger remaining balance. Brighter red = portfolio ran out sooner.${onYearClick ? ' Click any tile to see the year-by-year detail.' : ''}`
        }
      </p>
    </div>
  );
}
