import React, { useState } from 'react';
import { CashFlow } from '../types';

interface Props {
  cashFlows: CashFlow[];
  onChange: (flows: CashFlow[]) => void;
  maxYear: number;
  offendingIds?: string[];
}

function fmt$(n: number) {
  const abs = Math.abs(n);
  const formatted = abs >= 1_000 ? abs.toLocaleString('en-US') : String(abs);
  return `${n >= 0 ? '+' : '-'}$${formatted}`;
}

export default function CashFlowPanel({ cashFlows, onChange, maxYear, offendingIds = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [year, setYear] = useState('');
  const [allYears, setAllYears] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function handleAdd() {
    setErr(null);
    if (!desc.trim()) { setErr('Description is required.'); return; }
    const parsedAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(parsedAmount) || amount.trim() === '') { setErr('Enter a valid amount.'); return; }
    if (!allYears) {
      const parsedYear = parseInt(year);
      if (!year || isNaN(parsedYear) || parsedYear < 1 || parsedYear > maxYear) {
        setErr(`Year must be between 1 and ${maxYear}.`);
        return;
      }
    }
    onChange([...cashFlows, {
      id: crypto.randomUUID(),
      description: desc.trim(),
      amount: parsedAmount,
      allYears,
      year: allYears ? null : parseInt(year),
    }]);
    setDesc(''); setAmount(''); setYear(''); setAllYears(false);
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
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>
            <div className="cashflow-field cashflow-field--year">
              <label>Year</label>
              <input
                type="number"
                min={1}
                max={maxYear}
                step={1}
                placeholder="e.g. 5"
                value={year}
                disabled={allYears}
                onChange={e => setYear(e.target.value)}
              />
            </div>
            <div className="cashflow-field cashflow-field--amount">
              <label>Amount (+/-)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 24,000 or -18,000"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9,.-]/g, ''))}
              />
            </div>
            <div className="cashflow-field cashflow-field--allyears">
              <label>All Years</label>
              <input
                type="checkbox"
                checked={allYears}
                onChange={e => { setAllYears(e.target.checked); if (e.target.checked) setYear(''); }}
              />
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cashFlows.map((cf, i) => (
                  <tr key={cf.id} className={offendingIds.includes(cf.id) ? 'cashflow-row--offending' : ''}>
                    <td className="dim">{i + 1}</td>
                    <td>{cf.description}{offendingIds.includes(cf.id) && <span className="cashflow-offending-flag"> ⚠</span>}</td>
                    <td>{cf.allYears ? 'All' : `Year ${cf.year}`}</td>
                    <td className={cf.amount >= 0 ? 'positive' : 'negative'}>{fmt$(cf.amount)}</td>
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
