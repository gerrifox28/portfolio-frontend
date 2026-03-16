import React, { useState } from 'react';
import { YearResult } from '../types';

interface Props {
  data: YearResult[];
}

function fmt$(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US');
}
function fmtPct(n: number) {
  return (n * 100).toFixed(1) + '%';
}

export default function ResultsTable({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? data : data.slice(0, 15);

  return (
    <div className="results-table-wrap">
      <h3>Year-by-Year Detail</h3>
      <div className="table-scroll">
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Year</th>
              <th>Begin Balance</th>
              <th>Withdrawal</th>
              <th>Return %</th>
              <th>Return $</th>
              <th>Inflation</th>
              <th>End Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.sequenceNumber} className={r.portfolioEnd <= 0 ? 'row-exhausted' : ''}>
                <td className="dim">{r.sequenceNumber}</td>
                <td className="bold">{r.year}</td>
                <td>{fmt$(r.portfolioBeginning)}</td>
                <td className="dim">{fmt$(r.annualWithdrawal)}</td>
                <td className={r.portfolioReturnRate >= 0 ? 'positive' : 'negative'}>
                  {fmtPct(r.portfolioReturnRate)}
                </td>
                <td className={r.portfolioReturnDollars >= 0 ? 'positive' : 'negative'}>
                  {fmt$(r.portfolioReturnDollars)}
                </td>
                <td className="dim">{fmtPct(r.inflation)}</td>
                <td className={`bold ${r.portfolioEnd <= 0 ? 'negative' : ''}`}>
                  {fmt$(r.portfolioEnd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 15 && (
        <button className="expand-btn" onClick={() => setExpanded(e => !e)}>
          {expanded ? '▲ Show less' : `▼ Show all ${data.length} years`}
        </button>
      )}
    </div>
  );
}
