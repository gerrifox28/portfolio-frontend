import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend
} from 'recharts';
import { ScenarioSummary } from '../types';

interface Props { scenarios: ScenarioSummary[]; yearCount: number; onYearClick?: (year: number) => void; selectedYear?: number; }

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$0`;
}

export default function OutcomesChart({ scenarios, yearCount, onYearClick, selectedYear }: Props) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d: ScenarioSummary & { y: number } = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-year">Started {d.startYear}</p>
        {d.failed
          ? <p>Portfolio <strong style={{ color: '#ef4444' }}>exhausted</strong> after <strong>{d.yearsSurvived} years</strong></p>
          : <p>Balance after {yearCount} yrs: <strong>{fmt$(d.endingBalance)}</strong></p>
        }
      </div>
    );
  };
  // Survivors: y = ending balance
  // Failed: y = negative value so they plot below the zero line, scaled for visibility
  const maxBalance = Math.max(...scenarios.map(s => s.endingBalance));
  const failedFloor = -maxBalance * 0.12; // failed dots sit ~12% below zero line

  const data = scenarios.map(s => ({
    ...s,
    y: s.failed ? failedFloor * (1 - (s.yearsSurvived / yearCount) * 0.5) : s.endingBalance,
  }));

  const survivors = data.filter(d => !d.failed);
  const failures  = data.filter(d => d.failed);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>{yearCount}-Year Outcomes by Starting Year</h3>
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
          <Scatter name="Failed" data={failures} opacity={0.85}
            onClick={(pt: any) => onYearClick?.(pt.startYear)}
            style={{ cursor: onYearClick ? 'pointer' : 'default' }}>
            {failures.map((d, i) => (
              <Cell key={i} fill="#ef4444"
                r={d.startYear === selectedYear ? 11 : 7}
                stroke={d.startYear === selectedYear ? '#fff' : 'none'}
                strokeWidth={2} />
            ))}
          </Scatter>
          {/* Surviving scenarios — green dots above zero line */}
          <Scatter name="Survived" data={survivors} opacity={0.85}
            onClick={(pt: any) => onYearClick?.(pt.startYear)}
            style={{ cursor: onYearClick ? 'pointer' : 'default' }}>
            {survivors.map((d, i) => (
              <Cell key={i} fill="#10b981"
                r={d.startYear === selectedYear ? 11 : 7}
                stroke={d.startYear === selectedYear ? '#fff' : 'none'}
                strokeWidth={2} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="chart-note">
        {onYearClick ? 'Click' : 'Hover'} any dot for details. Green dots show final balance after {yearCount} years.
        Red dots indicate portfolio exhaustion — positioned lower = failed earlier.
      </p>
    </div>
  );
}
