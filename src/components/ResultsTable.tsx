import React from 'react';
import { YearResult } from '../types';

interface Props {
  data: YearResult[];
  showAnnuityColumns?: boolean;
  person1AgeLabel?: string;
  person1Age?: number | null;
  person2AgeLabel?: string;
  person2Age?: number | null;
}

function fmt$(n: number | undefined | null) {
  const num = (n == null || isNaN(n as number)) ? 0 : n as number;
  return '$' + Math.round(num).toLocaleString('en-US');
}
function fmtPct(n: number) {
  return (n * 100).toFixed(2) + '%';
}

function TableContent({ data, showAnnuityColumns, person1AgeLabel, person1Age, person2AgeLabel, person2Age }: {
  data: YearResult[];
  showAnnuityColumns: boolean;
  person1AgeLabel?: string;
  person1Age?: number | null;
  person2AgeLabel?: string;
  person2Age?: number | null;
}) {
  return (
    <table className="results-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Year</th>
          {person1Age != null && <th>{person1AgeLabel ?? 'Age'}</th>}
          {person2Age != null && <th>{person2AgeLabel ?? 'Age (2)'}</th>}
          <th>Begin Balance</th>
          <th>Withdrawal</th>
          <th>Income</th>
          <th>Cash Flows</th>
          <th>Return %</th>
          <th>Return $</th>
          <th>Inflation</th>
          <th>End Balance</th>
          {showAnnuityColumns && <>
            <th>Annuity Bal</th>
            <th>Annuity Pmt</th>
            <th>Inf Adj %</th>
          </>}
          <th>Total Income</th>
        </tr>
      </thead>
      <tbody>
        {data.map(r => (
          <tr key={r.sequenceNumber} className={r.portfolioEnd <= 0 ? 'row-exhausted' : ''}>
            <td className="dim">{r.sequenceNumber}</td>
            <td className="bold">{r.year}</td>
            {person1Age != null && <td className="dim">{person1Age + r.sequenceNumber - 1}</td>}
            {person2Age != null && <td className="dim">{person2Age + r.sequenceNumber - 1}</td>}
            <td>{fmt$(r.portfolioBeginning)}</td>
            <td className="dim">{fmt$(r.annualWithdrawal)}</td>
            <td className={(() => { const v = r.incomeApplied ?? 0; return v > 0 ? 'positive' : v < 0 ? 'negative' : 'dim'; })()}>
              {(() => { const v = isNaN(r.incomeApplied) ? 0 : (r.incomeApplied ?? 0); return `${v >= 0 ? '+' : ''}${fmt$(v)}`; })()}
            </td>
            <td className={(() => { const v = r.cashFlowApplied ?? 0; return v > 0 ? 'positive' : v < 0 ? 'negative' : 'dim'; })()}>
              {(() => { const v = isNaN(r.cashFlowApplied) ? 0 : (r.cashFlowApplied ?? 0); return `${v >= 0 ? '+' : ''}${fmt$(v)}`; })()}
            </td>
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
              <td className="dim">{fmt$(r.annuityBalance ?? 0)}</td>
              <td className="positive">{fmt$(r.annuityPayment ?? 0)}</td>
              <td className="dim">{r.sequenceNumber === 1 ? '—' : fmtPct(r.inflationAdjPct ?? 0)}</td>
            </>}
            <td className="bold">{fmt$(r.totalIncome)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ResultsTable({ data, showAnnuityColumns = false, person1AgeLabel, person1Age, person2AgeLabel, person2Age }: Props) {
  return (
    <div className="results-table-wrap">
      <div className="results-table-header">
        <h3>Year-by-Year Detail</h3>
      </div>
      <div className="table-scroll">
        <TableContent
          data={data}
          showAnnuityColumns={showAnnuityColumns}
          person1AgeLabel={person1AgeLabel}
          person1Age={person1Age}
          person2AgeLabel={person2AgeLabel}
          person2Age={person2Age}
        />
      </div>
    </div>
  );
}
