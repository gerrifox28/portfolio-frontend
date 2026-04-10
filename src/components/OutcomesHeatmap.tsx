import React from 'react';
import { ScenarioSummary } from '../types';

interface Props { scenarios: ScenarioSummary[]; yearCount: number; }

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return '$0';
}

export default function OutcomesHeatmap({ scenarios, yearCount }: Props) {
  const maxBalance = Math.max(...scenarios.map(s => s.endingBalance));

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>{yearCount}-Year Outcomes Grid by Starting Year</h3>
        <div className="chart-legend">
          <span className="legend-dot legend-dot--success" /> Survived — brighter green = larger balance &nbsp;
          <span className="legend-dot legend-dot--danger" /> Failed — brighter red = failed sooner
        </div>
      </div>

      <div className="heatmap-grid">
        {scenarios.map(s => {
          let bg: string;

          if (s.failed) {
            // Bright red = failed earliest (low yearsSurvived)
            // Dark red = nearly made it (yearsSurvived close to yearCount)
            const failSeverity = 1 - (s.yearsSurvived / yearCount); // 1 = failed very early, 0 = almost made it
            const opacity = 0.35 + failSeverity * 0.65; // range 0.35 → 1.0
            bg = `rgba(220, 38, 38, ${opacity})`;
          } else {
            // Muted green = smaller balance, rich green = larger balance
            const wealth = s.endingBalance / maxBalance; // 0 → 1
            const opacity = 0.2 + wealth * 0.75; // range 0.2 → 0.95
            bg = `rgba(16, 185, 129, ${opacity})`;
          }

          return (
            <div key={s.startYear} className="heatmap-cell" style={{ background: bg }}>
              <div className="heatmap-year">{s.startYear}</div>
              <div className="heatmap-value">
                {s.failed
                  ? <><span className="heatmap-fail">✗</span> {s.yearsSurvived}yr</>
                  : fmt$(s.endingBalance)
                }
              </div>
            </div>
          );
        })}
      </div>

      <p className="chart-note">
        Each tile represents one {yearCount}-year retirement window.
        Greener = larger remaining balance. Brighter red = portfolio ran out sooner.
      </p>
    </div>
  );
}
