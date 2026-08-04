import React from 'react';
import { ScenarioSummary } from '../types';

interface Props {
  scenarios: ScenarioSummary[];
  yearCount: number;
  onYearClick?: (year: number) => void;
  selectedYear?: number;
  incomeMode?: boolean;
}

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return '$0';
}

function getDisplayValue(s: ScenarioSummary): number {
  if (s.failed) return 0;
  return s.finalTotalIncome ?? 0;
}

export default function OutcomesHeatmap({ scenarios, yearCount, onYearClick, selectedYear, incomeMode = false }: Props) {
  const maxBalance = Math.max(...scenarios.map(s => s.endingBalance));
  const maxIncome  = Math.max(...scenarios.map(s => getDisplayValue(s)));

  return (
    <div className="chart-container">
      <div className="chart-header">
        {incomeMode
          ? <h3>{yearCount}-Year Total Income Grid by Starting Year</h3>
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
        {scenarios.map(s => {
          let bg: string;

          if (incomeMode) {
            const incomeValue = getDisplayValue(s);
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
            const wealth = maxBalance > 0 ? s.endingBalance / maxBalance : 0;
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
                  ? fmt$(getDisplayValue(s))
                  : s.failed
                    ? <><span className="heatmap-fail">✗</span> {s.yearsSurvived}yr</>
                    : fmt$(s.endingBalance)
                }
              </div>
            </div>
          );
        })}
      </div>

      <p className="chart-note">
        {incomeMode
          ? `Each tile shows the final-year total income (portfolio withdrawal + any Income entries + annuity, if applicable) for that starting year. Brighter = higher income.${onYearClick ? ' Click any tile to see the year-by-year detail.' : ''}`
          : `Each tile represents one ${yearCount}-year retirement window. Greener = larger remaining balance. Brighter red = portfolio ran out sooner.${onYearClick ? ' Click any tile to see the year-by-year detail.' : ''}`
        }
      </p>
    </div>
  );
}
