import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { AnnuityCompareResponse, ScenarioSummary } from '../types';

interface Props { compare: AnnuityCompareResponse; onYearClick?: (year: number) => void; }

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return '$0';
}

function fmtRate(r: number) { return `${(r * 100).toFixed(1)}%`; }

function ScenarioScatter({
  scenarios, yearCount, title, color, onYearClick,
}: {
  scenarios: ScenarioSummary[];
  yearCount: number;
  title: string;
  color: string;
  onYearClick?: (year: number) => void;
}) {
  const maxBalance = Math.max(...scenarios.map(s => s.endingBalance), 1);
  const failedFloor = -maxBalance * 0.12;

  const data = scenarios.map(s => ({
    ...s,
    y: s.failed ? failedFloor * (1 - (s.yearsSurvived / yearCount) * 0.5) : s.endingBalance,
  }));

  const survivors = data.filter(d => !d.failed);
  const failures  = data.filter(d => d.failed);

  const TooltipContent = ({ active, payload }: any) => {
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

  return (
    <div className="compare-panel">
      <h4 className="compare-panel-title" style={{ color }}>{title}</h4>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 16, right: 12, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="startYear" type="number"
            domain={['dataMin', 'dataMax']} tickCount={8}
            tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            label={{ value: 'Start Year', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            dataKey="y" tickFormatter={v => v < 0 ? '💸' : fmt$(v)}
            tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={60}
          />
          <Tooltip content={<TooltipContent />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="6 3" />
          <Scatter name="Failed" data={failures} r={6}
            onClick={(pt: any) => onYearClick?.(pt.startYear)}
            style={{ cursor: onYearClick ? 'pointer' : 'default' }}>
            {failures.map((_, i) => <Cell key={i} fill="#ef4444" opacity={0.85} />)}
          </Scatter>
          <Scatter name="Survived" data={survivors} r={6}
            onClick={(pt: any) => onYearClick?.(pt.startYear)}
            style={{ cursor: onYearClick ? 'pointer' : 'default' }}>
            {survivors.map((_, i) => <Cell key={i} fill={color} opacity={0.85} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CompareChart({ compare, onYearClick }: Props) {
  const { withoutAnnuity, withAnnuity, annuityRate, initialAnnuityIncome } = compare;
  const yearCount = withoutAnnuity.yearCount;

  const failDiff = withoutAnnuity.failureCount - withAnnuity.failureCount;
  const rateDiff = Math.round((withoutAnnuity.failureRate - withAnnuity.failureRate) * 10) / 10;

  return (
    <div className="compare-container">
      <div className="compare-header">
        <h3>Annuity Comparison</h3>
        <p className="compare-subtitle">
          Annuity rate: <strong>{fmtRate(annuityRate)}</strong> · Year-1 annuity income: <strong>{fmt$(initialAnnuityIncome)}/yr</strong> · CPI-linked, capped at 3%/yr
        </p>
      </div>

      {/* Summary delta cards */}
      <div className="compare-deltas">
        <div className={`compare-delta ${failDiff > 0 ? 'compare-delta--better' : failDiff < 0 ? 'compare-delta--worse' : 'compare-delta--same'}`}>
          <div className="delta-label">Failure rate change</div>
          <div className="delta-value">
            {rateDiff > 0 ? `−${rateDiff}%` : rateDiff < 0 ? `+${Math.abs(rateDiff)}%` : 'No change'}
          </div>
          <div className="delta-sub">
            {withoutAnnuity.failureRate}% → {withAnnuity.failureRate}% ({withAnnuity.failureCount} of {withAnnuity.totalScenarios} failed)
          </div>
        </div>
        <div className={`compare-delta ${withAnnuity.averageEndingBalance >= withoutAnnuity.averageEndingBalance ? 'compare-delta--better' : 'compare-delta--worse'}`}>
          <div className="delta-label">Avg ending balance change</div>
          <div className="delta-value">
            {fmt$(withAnnuity.averageEndingBalance - withoutAnnuity.averageEndingBalance)}
          </div>
          <div className="delta-sub">
            {fmt$(withoutAnnuity.averageEndingBalance)} → {fmt$(withAnnuity.averageEndingBalance)}
          </div>
        </div>
        <div className={`compare-delta ${withAnnuity.earliestFailureYears >= withoutAnnuity.earliestFailureYears || withAnnuity.failureCount === 0 ? 'compare-delta--better' : 'compare-delta--worse'}`}>
          <div className="delta-label">Earliest failure</div>
          <div className="delta-value">
            {withAnnuity.failureCount === 0 ? 'None' : `${withAnnuity.earliestFailureYears} yrs`}
          </div>
          <div className="delta-sub">
            Without annuity: {withoutAnnuity.failureCount === 0 ? 'none' : `${withoutAnnuity.earliestFailureYears} yrs`}
          </div>
        </div>
      </div>

      {/* Side-by-side scatter plots */}
      <div className="compare-charts">
        <ScenarioScatter
          scenarios={withoutAnnuity.scenarios}
          yearCount={yearCount}
          title="Without Annuity"
          color="#10b981"
          onYearClick={onYearClick}
        />
        <ScenarioScatter
          scenarios={withAnnuity.scenarios}
          yearCount={yearCount}
          title="With Annuity"
          color="#6366f1"
          onYearClick={onYearClick}
        />
      </div>
      <p className="chart-note">
        Green = survived · Red = portfolio exhausted · Hover any dot for details
      </p>
    </div>
  );
}
