import React from 'react';
import { SimulationRequest } from '../types';

interface Props {
  values: SimulationRequest;
  onChange: (updated: SimulationRequest) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

const fmt = (n: number) => n.toLocaleString('en-US');

function CurrencyInput({ label, field, values, onChange }: {
  label: string;
  field: keyof SimulationRequest;
  values: SimulationRequest;
  onChange: (u: SimulationRequest) => void;
}) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <div className="input-prefix">
        <span>$</span>
        <input
          type="number"
          value={values[field] as number}
          min={0}
          step={1000}
          onChange={e => onChange({ ...values, [field]: parseFloat(e.target.value) || 0 })}
        />
      </div>
    </div>
  );
}

function PercentInput({ label, field, values, onChange, step = 0.1 }: {
  label: string;
  field: keyof SimulationRequest;
  values: SimulationRequest;
  onChange: (u: SimulationRequest) => void;
  step?: number;
}) {
  const pct = Math.round((values[field] as number) * 1000) / 10;
  return (
    <div className="input-group">
      <label>{label}</label>
      <div className="input-suffix">
        <input
          type="number"
          value={pct}
          min={0}
          max={100}
          step={step}
          onChange={e => onChange({ ...values, [field]: (parseFloat(e.target.value) || 0) / 100 })}
        />
        <span>%</span>
      </div>
    </div>
  );
}

const ALLOCATION_FIELDS: Array<{ field: keyof SimulationRequest; label: string }> = [
  { field: 'sp500',      label: 'S&P 500' },
  { field: 'crsp1_10',  label: 'CRSP 1-10 (Total Market)' },
  { field: 'oneMonth',  label: 'One-Month T-Bills' },
  { field: 'fiveYearUS',label: '5-Year US Treasuries' },
  { field: 'crsp6_10',  label: 'CRSP 6-10 (Small Cap)' },
  { field: 'ffIntl',    label: 'F/F International' },
  { field: 'djUsReit',  label: 'DJ US REIT' },
  { field: 'ffEmgMkts', label: 'F/F Emerging Markets' },
];

export default function InputsPanel({ values, onChange, onSubmit, loading, error }: Props) {
  const allocSum = ALLOCATION_FIELDS.reduce((s, f) => s + (values[f.field] as number), 0);
  const allocPct = Math.round(allocSum * 1000) / 10;
  const allocOk  = Math.abs(allocSum - 1.0) < 0.001;

  return (
    <aside className="inputs-panel">
      <h2>Inputs</h2>

      <section className="input-section">
        <h3>Portfolio</h3>
        <div className="input-group">
          <label>Start Year</label>
          <input
            type="number"
            value={values.startYear}
            min={1926}
            max={2025}
            onChange={e => onChange({ ...values, startYear: parseInt(e.target.value) || 1929 })}
          />
        </div>
        <CurrencyInput label="Starting Nest Egg"       field="startingNestEgg"   values={values} onChange={onChange} />
        <CurrencyInput label="Initial Annual Withdrawal" field="initialWithdrawal" values={values} onChange={onChange} />
        <PercentInput  label="Expenses + Mgmt Fee"     field="expensesAndMgmtFee" values={values} onChange={onChange} step={0.1} />
      </section>

      <section className="input-section">
        <h3>
          Asset Allocation
          <span className={`alloc-badge ${allocOk ? 'ok' : 'warn'}`}>
            {allocPct}%
          </span>
        </h3>
        {!allocOk && (
          <p className="alloc-warning">Weights must sum to 100%</p>
        )}
        {ALLOCATION_FIELDS.map(({ field, label }) => (
          <PercentInput key={field} label={label} field={field} values={values} onChange={onChange} step={0.1} />
        ))}
      </section>

      {error && <p className="error-msg">{error}</p>}

      <button
        className="run-btn"
        onClick={onSubmit}
        disabled={loading || !allocOk}
      >
        {loading ? 'Running…' : 'Run Simulation →'}
      </button>
    </aside>
  );
}
