import React from 'react';
import { ScenarioSummary } from '../types';

interface Props { scenarios: ScenarioSummary[]; }

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return '$0';
}

export default function OutcomesHeatmap({ scenarios }: Props) {
  const maxBalance = Math.max(...scenarios.map(s => s.endingBalance));

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Outcomes Grid by Starting Year</h3>
        <div className="chart-legend">
          <span className="legend-dot legend-dot--success" /> Survived &nbsp;
          <span className="legend-dot legend-dot--danger" /> Failed
        </div>
      </div>

      <div className="heatmap-grid">
        {scenarios.map(s => {
          const intensity = s.failed ? 0 : s.endingBalance / maxBalance;
          const bg = s.failed
            ? `rgba(239,68,68,${0.3 + (1 - s.yearsSurvived / 40) * 0.5})`
            : `rgba(16,185,129,${0.15 + intensity * 0.75})`;

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
        Each square = one 40-year retirement window. Green intensity = final balance size.
        Red intensity = how early the portfolio failed (darker = failed sooner).
      </p>
    </div>
  );
}
