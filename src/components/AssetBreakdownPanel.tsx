import React, { useState } from 'react';

export interface Asset {
  id: string;
  description: string;
  amount: number;
}

interface Props {
  assets: Asset[];
  onChange: (assets: Asset[]) => void;
  open: boolean;
  onToggle: () => void;
}

function fmt$(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function AssetBreakdownPanel({ assets, onChange, open, onToggle }: Props) {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState('');

  const total = assets.reduce((s, a) => s + a.amount, 0);

  function handleAdd() {
    setErr('');
    if (!desc.trim()) { setErr('Description is required.'); return; }
    const raw = amount.replace(/[$,\s]/g, '');
    const parsed = parseFloat(raw);
    if (!raw || isNaN(parsed) || parsed <= 0) { setErr('Enter a positive dollar amount.'); return; }
    onChange([...assets, { id: crypto.randomUUID(), description: desc.trim(), amount: parsed }]);
    setDesc('');
    setAmount('');
  }

  function handleDelete(id: string) {
    onChange(assets.filter(a => a.id !== id));
  }

  return (
    <div className="cashflow-section">
      <button className="annuity-toggle" onClick={onToggle}>
        {open ? '▲' : '▼'} Break down by asset{assets.length > 0 ? ` (${assets.length})` : ''}
      </button>

      {open && (
        <div className="cashflow-body">
          <div className="cashflow-input-row">
            <div className="cashflow-field cashflow-field--desc">
              <label>Description</label>
              <input
                type="text"
                maxLength={40}
                placeholder="e.g. 401k, Home Equity"
                value={desc}
                onChange={e => { setDesc(e.target.value); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="cashflow-field cashflow-field--amount">
              <label>Amount ($)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 500,000"
                value={amount}
                onChange={e => { setAmount(e.target.value.replace(/[^0-9,]/g, '')); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <button className="cashflow-add-btn" onClick={handleAdd}>Add</button>
          </div>

          {err && <p className="cashflow-error">{err}</p>}

          {assets.length > 0 && (
            <table className="cashflow-list">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a, i) => (
                  <tr key={a.id}>
                    <td className="dim">{i + 1}</td>
                    <td>{a.description}</td>
                    <td>{fmt$(a.amount)}</td>
                    <td className="cashflow-actions">
                      <button className="cashflow-del-btn" onClick={() => handleDelete(a.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="asset-total-row">
                  <td colSpan={2}>Total Nest Egg</td>
                  <td>{fmt$(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
