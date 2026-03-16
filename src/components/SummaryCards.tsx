import React from 'react';
import { SimulationResponse } from '../types';

interface Props {
  result: SimulationResponse;
}

function fmt$(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export default function SummaryCards({ result }: Props) {
  const { yearsSurvived, portfolioExhausted, finalPortfolioValue, finalYear, inputs } = result;
  const withdrawalRate = ((inputs.initialWithdrawal / inputs.startingNestEgg) * 100).toFixed(1);

  return (
    <div className="summary-cards">
      <div className={`card ${portfolioExhausted ? 'card-danger' : 'card-success'}`}>
        <div className="card-label">Outcome</div>
        <div className="card-value">
          {portfolioExhausted ? '💸 Exhausted' : '✅ Survived'}
        </div>
        <div className="card-sub">
          {portfolioExhausted
            ? `Ran out in ${finalYear} after ${yearsSurvived} years`
            : `Still going after ${yearsSurvived} years`}
        </div>
      </div>

      <div className="card">
        <div className="card-label">Final Balance ({finalYear})</div>
        <div className="card-value">{fmt$(finalPortfolioValue)}</div>
        <div className="card-sub">End of available data</div>
      </div>

      <div className="card">
        <div className="card-label">Years Simulated</div>
        <div className="card-value">{yearsSurvived}</div>
        <div className="card-sub">{inputs.startYear} → {finalYear}</div>
      </div>

      <div className="card">
        <div className="card-label">Withdrawal Rate</div>
        <div className="card-value">{withdrawalRate}%</div>
        <div className="card-sub">{fmt$(inputs.initialWithdrawal)} / yr initially</div>
      </div>
    </div>
  );
}
