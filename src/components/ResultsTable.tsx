import React, { useState, useEffect, useCallback } from 'react';
import { YearResult, CashFlow } from '../types';
import { applyFlowsToYears } from '../cashFlowUtils';

interface Props {
  data: YearResult[];
  showAnnuityColumns?: boolean;
  cashFlows?: CashFlow[];
}

function fmt$(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US');
}
function fmtPct(n: number) {
  return (n * 100).toFixed(2) + '%';
}

function TableContent({ data, showAnnuityColumns, cashFlows = [] }: { data: YearResult[]; showAnnuityColumns: boolean; cashFlows?: CashFlow[] }) {
  const adjBalances = applyFlowsToYears(data, cashFlows);
  const adjBegins = data.map((r, i) => i === 0 ? r.portfolioBeginning : adjBalances[i - 1]);
  const showCashFlowCol = cashFlows.length > 0;

  // Track depletion to know whether flows were actually applied each year
  let depleted = false;
  const netFlows = data.map(r => {
    if (depleted || r.portfolioEnd <= 0) { depleted = true; return null; }
    const net = cashFlows.reduce((sum, cf) =>
      (cf.allYears || cf.year === r.sequenceNumber) ? sum + cf.amount : sum, 0);
    if ((r.portfolioEnd + net) <= 0) depleted = true;
    return net !== 0 ? net : null;
  });

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
          {showCashFlowCol && <th>Cash Flows</th>}
          {showAnnuityColumns && <>
            <th>Annuity Pmt</th>
            <th>Inf Adj %</th>
            <th>Total Income</th>
          </>}
        </tr>
      </thead>
      <tbody>
        {data.map((r, i) => {
          const displayEnd = adjBalances[i];
          const displayBegin = adjBegins[i];
          const netFlow = netFlows[i];
          return (
            <tr key={r.sequenceNumber} className={r.portfolioEnd <= 0 ? 'row-exhausted' : ''}>
              <td className="dim">{r.sequenceNumber}</td>
              <td className="bold">{r.year}</td>
              <td>{fmt$(displayBegin)}</td>
              <td className="dim">{fmt$(r.annualWithdrawal)}</td>
              <td className={r.portfolioReturnRate >= 0 ? 'positive' : 'negative'}>
                {fmtPct(r.portfolioReturnRate)}
              </td>
              <td className={r.portfolioReturnDollars >= 0 ? 'positive' : 'negative'}>
                {fmt$(r.portfolioReturnDollars)}
              </td>
              <td className="dim">{fmtPct(r.inflation)}</td>
              <td className={`bold ${r.portfolioEnd <= 0 ? 'negative' : ''}`}>
                {fmt$(displayEnd)}
              </td>
              {showCashFlowCol && (
                <td className={netFlow == null ? 'dim' : netFlow >= 0 ? 'positive' : 'negative'}>
                  {netFlow == null ? '—' : `${netFlow >= 0 ? '+' : ''}${fmt$(netFlow)}`}
                </td>
              )}
              {showAnnuityColumns && <>
                <td className="positive">{fmt$(r.annuityPayment ?? 0)}</td>
                <td className="dim">{r.sequenceNumber === 1 ? '—' : fmtPct(r.inflationAdjPct ?? 0)}</td>
                <td className="bold">{fmt$(r.totalIncome)}</td>
              </>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function ResultsTable({ data, showAnnuityColumns = false, cashFlows = [] }: Props) {
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
          <TableContent data={rows} showAnnuityColumns={showAnnuityColumns} cashFlows={cashFlows} />
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
