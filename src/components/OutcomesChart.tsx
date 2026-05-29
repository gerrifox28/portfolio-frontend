import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { ScenarioSummary } from '../types';

interface Props {
  scenarios: ScenarioSummary[];
  yearCount: number;
  onYearClick?: (year: number) => void;
  selectedYear?: number;
  incomeMode?: boolean;
  annuityMode?: boolean;
}

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$0`;
}

function getDisplayValue(s: ScenarioSummary, incomeMode: boolean, annuityMode: boolean): number {
  if (!incomeMode) return s.endingBalance;
  return annuityMode ? (s.finalTotalIncome ?? 0) : (s.finalWithdrawal ?? 0);
}

export default function OutcomesChart({ scenarios, yearCount, onYearClick, selectedYear, incomeMode = false, annuityMode = false }: Props) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d: ScenarioSummary & { y: number } = payload[0].payload;
    if (incomeMode) {
      const label = annuityMode ? 'Total income' : 'Withdrawal';
      return (
        <div className="chart-tooltip">
          <p className="tooltip-year">Started {d.startYear}</p>
          <p>{label} in final year: <strong>{fmt$(d.y)}</strong></p>
        </div>
      );
    }
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

  if (incomeMode) {
    const data = scenarios.map(s => ({ ...s, y: getDisplayValue(s, true, annuityMode) }));
    const incomeLabel = annuityMode ? 'Total Income (Final Year)' : 'Withdrawal (Final Year)';
    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3>{yearCount}-Year {incomeLabel} by Starting Year</h3>
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
              tickFormatter={v => fmt$(v)}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
            <Scatter data={data} opacity={0.85}
              onClick={(pt: any) => onYearClick?.(pt.startYear)}
              style={{ cursor: onYearClick ? 'pointer' : 'default' }}>
              {data.map((d, i) => (
                <Cell key={i} fill="#6366f1"
                  r={d.startYear === selectedYear ? 11 : 7}
                  stroke={d.startYear === selectedYear ? '#fff' : 'none'}
                  strokeWidth={2} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <p className="chart-note">
          {onYearClick ? 'Click' : 'Hover'} any dot for details. Shows final-year {annuityMode ? 'total income (portfolio withdrawal + annuity)' : 'withdrawal amount'} for each starting year.
        </p>
      </div>
    );
  }

  // Standard balance mode
  const maxBalance = Math.max(...scenarios.map(s => s.endingBalance));
  const failedFloor = -maxBalance * 0.12;
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
