import React, { useState, useEffect, useCallback } from 'react';
import { YearResult } from '../types';

interface Props {
  data: YearResult[];
  showAnnuityColumns?: boolean;
}

function fmt$(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US');
}
function fmtPct(n: number) {
  return (n * 100).toFixed(1) + '%';
}

function TableContent({ data, showAnnuityColumns }: { data: YearResult[]; showAnnuityColumns: boolean }) {
  return (
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
          {showAnnuityColumns && <>
            <th>Annuity Pmt</th>
            <th>Inf Adj %</th>
            <th>Total Income</th>
          </>}
        </tr>
      </thead>
      <tbody>
        {data.map(r => (
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
            {showAnnuityColumns && <>
              <td className="positive">{fmt$(r.annuityPayment ?? 0)}</td>
              <td className="dim">{r.sequenceNumber === 1 ? '—' : fmtPct(r.inflationAdjPct ?? 0)}</td>
              <td className="bold">{fmt$(r.totalIncome)}</td>
            </>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ResultsTable({ data, showAnnuityColumns = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState(false);
  const rows = expanded ? data : data.slice(0, 15);

  const closeModal = useCallback(() => setModal(false), []);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [modal, closeModal]);

  return (
    <>
      <div className="results-table-wrap">
        <div className="results-table-header">
          <h3>Year-by-Year Detail</h3>
          <button className="table-expand-btn" onClick={() => setModal(true)} title="Open full view">
            ⤢ Full view
          </button>
        </div>
        <div className="table-scroll">
          <TableContent data={rows} showAnnuityColumns={showAnnuityColumns} />
        </div>
        {data.length > 15 && (
          <button className="expand-btn" onClick={() => setExpanded(e => !e)}>
            {expanded ? '▲ Show less' : `▼ Show all ${data.length} years`}
          </button>
        )}
      </div>

      {modal && (
        <div className="table-modal-overlay" onClick={closeModal}>
          <div className="table-modal" onClick={e => e.stopPropagation()}>
            <div className="table-modal-header">
              <span className="table-modal-title">Year-by-Year Detail</span>
              <button className="table-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="table-modal-scroll">
              <TableContent data={data} showAnnuityColumns={showAnnuityColumns} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
