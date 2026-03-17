import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend
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
  const d: ScenarioSummary & { y: number } = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-year">Started {d.startYear}</p>
      {d.failed
        ? <p>Portfolio <strong style={{ color: '#ef4444' }}>exhausted</strong> after <strong>{d.yearsSurvived} years</strong></p>
        : <p>Balance after 40 yrs: <strong>{fmt$(d.endingBalance)}</strong></p>
      }
    </div>
  );
};

export default function OutcomesChart({ scenarios }: Props) {
  // Survivors: y = ending balance
  // Failed: y = negative value so they plot below the zero line, scaled for visibility
  const maxBalance = Math.max(...scenarios.map(s => s.endingBalance));
  const failedFloor = -maxBalance * 0.12; // failed dots sit ~12% below zero line

  const data = scenarios.map(s => ({
    ...s,
    y: s.failed ? failedFloor * (1 - (s.yearsSurvived / 40) * 0.5) : s.endingBalance,
  }));

  const survivors = data.filter(d => !d.failed);
  const failures  = data.filter(d => d.failed);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>40-Year Outcomes by Starting Year</h3>
        <div className="chart-legend">
          <span className="legend-dot legend-dot--success" /> Survived &nbsp;
          <span className="legend-dot legend-dot--danger" /> Failed (below line)
        </div>
      </div>
      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="startYear"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickCount={10}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            label={{ value: 'Retirement Start Year', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
          />
          <YAxis
            dataKey="y"
            tickFormatter={v => v < 0 ? '💸' : fmt$(v)}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
          <ReferenceLine
            y={0}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            label={{ value: '← Survived above · Failed below →', position: 'insideTopRight', fill: '#64748b', fontSize: 11 }}
          />
          {/* Failed scenarios — red dots below zero line */}
          <Scatter name="Failed" data={failures} fill="#ef4444" opacity={0.85} r={7}>
            {failures.map((_, i) => <Cell key={i} fill="#ef4444" />)}
          </Scatter>
          {/* Surviving scenarios — green dots above zero line */}
          <Scatter name="Survived" data={survivors} fill="#10b981" opacity={0.85} r={7}>
            {survivors.map((_, i) => <Cell key={i} fill="#10b981" />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="chart-note">
        Hover any dot for details. Green dots show final balance after 40 years.
        Red dots indicate portfolio exhaustion — positioned lower = failed earlier.
      </p>
    </div>
  );
}
