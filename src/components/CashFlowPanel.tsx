import React, { useState } from 'react';
import { CashFlow } from '../types';

interface Props {
  cashFlows: CashFlow[];
  onChange: (flows: CashFlow[]) => void;
  maxYear: number;
  offendingIds?: string[];
}

const BLANK_FLOW = { description: '', amount: '', year: '', allYears: false, inflationAdj: 'none' as const };

function fmt$(n: number) {
  const abs = Math.abs(n);
  const formatted = abs >= 1_000 ? abs.toLocaleString('en-US') : String(abs);
  return `${n >= 0 ? '+' : '-'}$${formatted}`;
}

function inflAdjLabel(cf: CashFlow): string {
  if (cf.inflationAdj === 'full') return 'Full Inflation';
  if (cf.inflationAdj === 'half') return '½ Inflation';
  return 'No Adj.';
}

function yearRangeLabel(cf: CashFlow): string {
  if (cf.allYears) return 'All';
  if (cf.yearStart === cf.yearEnd) return `Year ${cf.yearStart}`;
  return `Years ${cf.yearStart}–${cf.yearEnd}`;
}

function parseYearInput(input: string, maxYear: number):
  | { yearStart: number; yearEnd: number; valid: true }
  | { valid: false; error: string } {
  const trimmed = input.trim();
  const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    if (start >= 1 && end <= maxYear && start <= end)
      return { yearStart: start, yearEnd: end, valid: true };
    return { valid: false, error: `Range must be between 1 and ${maxYear}, and start must be ≤ end.` };
  }
  const single = parseInt(trimmed);
  if (!isNaN(single) && single >= 1 && single <= maxYear)
    return { yearStart: single, yearEnd: single, valid: true };
  return { valid: false, error: `Year must be a single year or range (e.g. 5 or 5-10) within 1–${maxYear}.` };
}

export default function CashFlowPanel({ cashFlows, onChange, maxYear, offendingIds = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [newFlow, setNewFlow] = useState(BLANK_FLOW);
  const [err, setErr] = useState<string | null>(null);

  function setField(field: keyof typeof BLANK_FLOW, value: string | boolean) {
    setNewFlow(prev => ({ ...prev, [field]: value }));
  }

  function handleAdd() {
    setErr(null);
    if (!newFlow.description.trim()) { setErr('Description is required.'); return; }
    const rawAmount = newFlow.amount.toString().replace(/[$,\s]/g, '');
    const parsedAmount = parseFloat(rawAmount);
    if (isNaN(parsedAmount) || rawAmount === '') { setErr('Please enter a valid number for Amount.'); return; }

    let yearStart: number | null = null;
    let yearEnd: number | null = null;

    if (!newFlow.allYears) {
      if (!newFlow.year.trim()) { setErr('Enter a year or range (e.g. 5 or 5-10).'); return; }
      const parsed = parseYearInput(newFlow.year, maxYear);
      if (!parsed.valid) { setErr(parsed.error); return; }
      yearStart = parsed.yearStart;
      yearEnd = parsed.yearEnd;
    }

    onChange([...cashFlows, {
      id: crypto.randomUUID(),
      description: newFlow.description.trim(),
      amount: parsedAmount,
      allYears: newFlow.allYears,
      yearStart,
      yearEnd,
      inflationAdj: newFlow.inflationAdj,
    }]);
    setNewFlow(BLANK_FLOW);
  }

  function handleDelete(id: string) {
    onChange(cashFlows.filter(cf => cf.id !== id));
  }

  return (
    <div className="cashflow-section">
      <button className="annuity-toggle" onClick={() => setOpen(v => !v)}>
        {open ? '▲' : '▼'} Manual Cash Flows {cashFlows.length > 0 && `(${cashFlows.length})`}
      </button>

      {open && (
        <div className="cashflow-body">
          <div className="cashflow-input-row">
            <div className="cashflow-field cashflow-field--desc">
              <label>Description</label>
              <input
                type="text"
                maxLength={40}
                placeholder="e.g. Social Security"
                value={newFlow.description}
                onChange={e => setField('description', e.target.value)}
              />
            </div>
            <div className="cashflow-field cashflow-field--year">
              <label>Year</label>
              <input
                type="text"
                placeholder="e.g. 5 or 5-10"
                value={newFlow.year}
                disabled={newFlow.allYears}
                onChange={e => setField('year', e.target.value)}
              />
            </div>
            <div className="cashflow-field cashflow-field--amount">
              <label>Amount (+/-)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 24,000 or -18,000"
                value={newFlow.amount}
                onChange={e => setField('amount', e.target.value.replace(/[^0-9,.-]/g, ''))}
              />
            </div>
            <div className="cashflow-field cashflow-field--allyears">
              <label>All Years</label>
              <input
                type="checkbox"
                checked={newFlow.allYears}
                onChange={e => setNewFlow(prev => ({ ...prev, allYears: e.target.checked, year: '' }))}
              />
            </div>
            <div className="cashflow-field cashflow-field--infladj">
              <label>Inflation Adj.</label>
              <select
                value={newFlow.inflationAdj}
                disabled={false}
                onChange={e => setField('inflationAdj', e.target.value)}
              >
                <option value="none">No Adjustment</option>
                <option value="full">Full Inflation</option>
                <option value="half">½ Inflation</option>
              </select>
            </div>
            <button className="cashflow-add-btn" onClick={handleAdd}>Add</button>
          </div>
          {err && <p className="cashflow-error">{err}</p>}

          {cashFlows.length > 0 && (
            <table className="cashflow-list">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Year(s)</th>
                  <th>Amount</th>
                  <th>Inflation Adj.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cashFlows.map((cf, i) => (
                  <tr key={cf.id} className={offendingIds.includes(cf.id) ? 'cashflow-row--offending' : ''}>
                    <td className="dim">{i + 1}</td>
                    <td>{cf.description}{offendingIds.includes(cf.id) && <span className="cashflow-offending-flag"> ⚠</span>}</td>
                    <td>{yearRangeLabel(cf)}</td>
                    <td className={cf.amount >= 0 ? 'positive' : 'negative'}>{fmt$(cf.amount)}</td>
                    <td className="dim">{inflAdjLabel(cf)}</td>
                    <td>
                      <button className="cashflow-del-btn" onClick={() => handleDelete(cf.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
