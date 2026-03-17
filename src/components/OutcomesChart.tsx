import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { ScenarioSummary } from '../types';

interface Props { scenarios: ScenarioSummary[]; }

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$0`;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: ScenarioSummary = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-year">Started {d.startYear}</p>
      {d.failed
        ? <p>Portfolio <strong style={{color:'#ef4444'}}>exhausted</strong> after <strong>{d.yearsSurvived} years</strong></p>
        : <p>Balance after 40 yrs: <strong>{fmt$(d.endingBalance)}</strong></p>
      }
    </div>
  );
};

export default function OutcomesChart({ scenarios }: Props) {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>40-Year Outcomes by Starting Year</h3>
        <div className="chart-legend">
          <span className="legend-dot legend-dot--success" /> Survived
          <span className="legend-dot legend-dot--danger" style={{marginLeft:16}} /> Failed
        </div>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={scenarios} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="startYear"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            interval={4}
          />
          <YAxis
            tickFormatter={fmt$}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
          <Bar dataKey="endingBalance" radius={[3, 3, 0, 0]}>
            {scenarios.map((s, i) => (
              <Cell
                key={i}
                fill={s.failed ? '#ef4444' : '#10b981'}
                fillOpacity={s.failed ? 0.8 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
