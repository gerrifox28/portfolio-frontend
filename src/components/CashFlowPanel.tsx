import React, { useState } from 'react';
import { CashFlow } from '../types';

interface Props {
  cashFlows: CashFlow[];
  onChange: (flows: CashFlow[]) => void;
  maxYear: number;
  offendingIds?: string[];
}

interface NewFlowState {
  description: string;
  amount: string;
  year: string;
  allYears: boolean;
  inflationAdj: 'none' | 'full' | 'half';
  type: 'income' | 'cashflow';
}

const BLANK: NewFlowState = {
  description: '', amount: '', year: '', allYears: false, inflationAdj: 'none', type: 'cashflow',
};

function typeLabel(t: 'income' | 'cashflow' | undefined): string {
  return t === 'income' ? 'Income' : 'Cash Flow';
}

function fmt$(n: number) {
  const abs = Math.abs(n);
  const formatted = abs >= 1_000 ? abs.toLocaleString('en-US') : String(abs);
  return `${n >= 0 ? '+' : '-'}$${formatted}`;
}

function inflAdjLabel(cf: CashFlow): string {
  if (!cf.allYears && cf.yearStart === cf.yearEnd) return '—';
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
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (start >= 1 && end <= maxYear && start <= end)
      return { yearStart: start, yearEnd: end, valid: true };
    return { valid: false, error: `Range must be between 1 and ${maxYear}, and start must be ≤ end.` };
  }
  const single = parseInt(trimmed, 10);
  if (!isNaN(single) && single >= 1 && single <= maxYear)
    return { yearStart: single, yearEnd: single, valid: true };
  return { valid: false, error: `Enter a single year (e.g. 5) or a range (e.g. 5-10) within 1–${maxYear}.` };
}

export default function CashFlowPanel({ cashFlows, onChange, maxYear, offendingIds = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState<NewFlowState>(BLANK);
  const [err, setErr] = useState('');
  const [yearErr, setYearErr] = useState('');

  // ── Inline edit state ──────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editAllYears, setEditAllYears] = useState(false);
  const [editInflAdj, setEditInflAdj] = useState<'none' | 'full' | 'half'>('none');
  const [editType, setEditType] = useState<'income' | 'cashflow'>('cashflow');
  const [editErr, setEditErr] = useState('');

  function handleStartEdit(cf: CashFlow) {
    setEditingId(cf.id);
    setEditDesc(cf.description);
    setEditAmount(String(cf.amount));
    setEditAllYears(cf.allYears);
    setEditYear(cf.allYears ? '' : cf.yearStart === cf.yearEnd ? String(cf.yearStart) : `${cf.yearStart}-${cf.yearEnd}`);
    setEditInflAdj(cf.inflationAdj ?? 'none');
    setEditType(cf.type ?? 'cashflow');
    setEditErr('');
  }

  function handleSaveEdit(id: string) {
    setEditErr('');
    if (!editDesc.trim()) { setEditErr('Description is required.'); return; }
    const rawAmount = editAmount.replace(/[$,\s]/g, '');
    const parsedAmount = parseFloat(rawAmount);
    if (!rawAmount || isNaN(parsedAmount)) { setEditErr('Enter a valid amount.'); return; }

    let yearStart: number | null = null;
    let yearEnd: number | null = null;
    if (!editAllYears) {
      if (!editYear.trim()) { setEditErr('Enter a year or range (e.g. 5 or 5-10).'); return; }
      const parsed = parseYearInput(editYear, maxYear);
      if (!parsed.valid) { setEditErr(parsed.error); return; }
      yearStart = parsed.yearStart;
      yearEnd = parsed.yearEnd;
    }

    onChange(cashFlows.map(cf =>
      cf.id === id ? {
        ...cf,
        description: editDesc.trim(),
        amount: parsedAmount,
        allYears: editAllYears,
        yearStart,
        yearEnd,
        inflationAdj: editInflAdj,
        type: editType,
      } : cf
    ));
    setEditingId(null);
    setEditErr('');
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditErr('');
  }

  function update(patch: Partial<NewFlowState>) {
    setFlow(prev => ({ ...prev, ...patch }));
    if ('year' in patch) setYearErr('');
  }

  function handleAdd() {
    setErr('');
    setYearErr('');

    if (!flow.description.trim()) { setErr('Description is required.'); return; }

    const rawAmount = flow.amount.replace(/[$,\s]/g, '');
    const parsedAmount = parseFloat(rawAmount);
    if (!rawAmount || isNaN(parsedAmount)) { setErr('Enter a valid number for Amount.'); return; }

    let yearStart: number | null = null;
    let yearEnd: number | null = null;

    if (!flow.allYears) {
      if (!flow.year.trim()) { setYearErr('Enter a year or range (e.g. 5 or 5-10).'); return; }
      const parsed = parseYearInput(flow.year, maxYear);
      if (!parsed.valid) { setYearErr(parsed.error); return; }
      yearStart = parsed.yearStart;
      yearEnd = parsed.yearEnd;
    }

    onChange([...cashFlows, {
      id: crypto.randomUUID(),
      description: flow.description.trim(),
      amount: parsedAmount,
      allYears: flow.allYears,
      yearStart,
      yearEnd,
      inflationAdj: flow.inflationAdj,
      type: flow.type,
    }]);
    setFlow(BLANK);
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
                value={flow.description}
                onChange={e => update({ description: e.target.value })}
              />
            </div>

            <div className="cashflow-field cashflow-field--year">
              <label>Year</label>
              <input
                type="text"
                placeholder="e.g. 5 or 5-10"
                value={flow.year}
                disabled={flow.allYears}
                onChange={e => update({ year: e.target.value })}
              />
              {yearErr && <p className="cashflow-error cashflow-year-error">{yearErr}</p>}
            </div>

            <div className="cashflow-field cashflow-field--amount">
              <label>Amount (+/-)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 24,000 or -18,000"
                value={flow.amount}
                onChange={e => update({ amount: e.target.value.replace(/[^0-9,.-]/g, '') })}
              />
            </div>

            <div className="cashflow-field cashflow-field--type">
              <label>Type</label>
              <select
                value={flow.type}
                onChange={e => update({ type: e.target.value as 'income' | 'cashflow' })}
              >
                <option value="cashflow">Cash Flow</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="cashflow-field cashflow-field--allyears">
              <label>All Years</label>
              <input
                type="checkbox"
                checked={flow.allYears}
                onChange={e => update({ allYears: e.target.checked, year: '' })}
              />
            </div>

            <div className="cashflow-field cashflow-field--infladj">
              <label>Inflation Adj.</label>
              <select
                value={flow.inflationAdj}
                onChange={e => update({ inflationAdj: e.target.value as 'none' | 'full' | 'half' })}
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
                  <th>Type</th>
                  <th>Inflation Adj.</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cashFlows.map((cf, i) => {
                  const isEditing = editingId === cf.id;
                  const editIsSingle = !editAllYears && !!editYear.trim() && !editYear.trim().match(/\d+\s*-\s*\d+/);
                  return (
                    <tr key={cf.id} className={offendingIds.includes(cf.id) ? 'cashflow-row--offending' : ''}>
                      <td className="dim">{i + 1}</td>

                      {/* Description */}
                      <td>
                        {isEditing ? (
                          <input type="text" maxLength={40} className="cashflow-edit-input" value={editDesc}
                            onChange={e => setEditDesc(e.target.value)} />
                        ) : (
                          <>{cf.description}{offendingIds.includes(cf.id) && <span className="cashflow-offending-flag"> ⚠</span>}</>
                        )}
                      </td>

                      {/* Year(s) */}
                      <td>
                        {isEditing ? (
                          <div className="cashflow-edit-year-group">
                            <input type="text" className="cashflow-edit-input cashflow-edit-year"
                              placeholder="e.g. 5 or 5-10" value={editYear} disabled={editAllYears}
                              onChange={e => setEditYear(e.target.value)} />
                            <label className="cashflow-edit-allyears-label">
                              <input type="checkbox" checked={editAllYears}
                                onChange={e => { setEditAllYears(e.target.checked); if (e.target.checked) setEditYear(''); }} />
                              All
                            </label>
                          </div>
                        ) : yearRangeLabel(cf)}
                      </td>

                      {/* Amount */}
                      <td className={isEditing ? '' : cf.amount >= 0 ? 'positive' : 'negative'}>
                        {isEditing ? (
                          <input type="text" className="cashflow-edit-input cashflow-edit-amount"
                            value={editAmount} onChange={e => setEditAmount(e.target.value.replace(/[^0-9,.-]/g, ''))} />
                        ) : fmt$(cf.amount)}
                      </td>

                      {/* Type */}
                      <td>
                        {isEditing ? (
                          <select className="cashflow-edit-select" value={editType}
                            onChange={e => setEditType(e.target.value as 'income' | 'cashflow')}>
                            <option value="cashflow">Cash Flow</option>
                            <option value="income">Income</option>
                          </select>
                        ) : (
                          <span className="dim">{typeLabel(cf.type)}</span>
                        )}
                      </td>

                      {/* Inflation Adj */}
                      <td>
                        {isEditing ? (
                          <select className="cashflow-edit-select" value={editInflAdj} disabled={editIsSingle}
                            onChange={e => setEditInflAdj(e.target.value as 'none' | 'full' | 'half')}>
                            <option value="none">No Adjustment</option>
                            <option value="full">Full Inflation</option>
                            <option value="half">½ Inflation</option>
                          </select>
                        ) : (
                          <span className="dim">{inflAdjLabel(cf)}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="cashflow-actions">
                        {isEditing ? (
                          <div className="cashflow-edit-actions">
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="cashflow-save-btn" onClick={() => handleSaveEdit(cf.id)}>Save</button>
                              <button className="cashflow-cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                            </div>
                            {editErr && <span className="cashflow-error cashflow-edit-err">{editErr}</span>}
                          </div>
                        ) : (
                          <>
                            <button className="cashflow-edit-btn" onClick={() => handleStartEdit(cf)}>Edit</button>
                            <button className="cashflow-del-btn" onClick={() => handleDelete(cf.id)}>×</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
