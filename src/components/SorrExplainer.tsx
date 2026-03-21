import React from 'react';
import { AllScenariosResponse } from '../types';

interface Props { result: AllScenariosResponse; }

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function SorrExplainer({ result }: Props) {
  const { totalScenarios, failureCount, failureRate, earliestFailureYears,
          highestEndingBalance, averageEndingBalance, worstStartYear, bestStartYear } = result;

  return (
    <div className="explainer">

      <section className="explainer-section">
        <h2 className="explainer-heading">What calculations were made?</h2>
        <p>
          <strong>{totalScenarios} iterations</strong> were run — one for each starting year
          from 1929 through 1986. Each iteration simulates a complete 40-year retirement
          window using actual historical market returns, inflation data, and your withdrawal
          amount. This gives us every full 40-year period that has occurred in modern
          financial history.
        </p>
        <p>
          Why 40 years? It represents a reasonable long-term retirement planning horizon —
          long enough to capture the full effects of market cycles, inflation, and compounding.
        </p>
        <p>
          To explore alternative scenarios, click the "Advanced" option beneath the blue
          "Run All" button to adjust allocations and assumptions.
        </p>
        <p>
          If you want tailored guidance or to discuss how this applies to your situation,{' '}
          <a href="#" className="explainer-link">schedule a call with me today!</a>
        </p>
        <p className="explainer-footnote">
          * This simulation is based on a portfolio allocation of approximately 60% globally
          diversified stocks, 25% intermediate-term U.S. bonds, 10% REITs, and 5% short-term
          U.S. Treasuries. The portfolio is rebalanced annually and assumes a 1.2% total
          expense and management fee.
        </p>
      </section>

      <section className="explainer-section">
        <h2 className="explainer-heading">Key takeaway</h2>
        <p>
          Look at the variances! The worst historical starting year ({worstStartYear}) led to
          portfolio exhaustion after just{' '}
          <strong>{failureCount > 0 ? `${earliestFailureYears} years` : 'never'}</strong>.
          The best starting year ({bestStartYear}) left{' '}
          <strong>{fmt$(highestEndingBalance)}</strong> after 40 years. The average surviving
          portfolio ended at <strong>{fmt$(averageEndingBalance)}</strong>.
        </p>
        <p>
          That is an enormous range of outcomes — from running out of money decades too early,
          to leaving a multi-million dollar legacy — driven entirely by which year you happened
          to retire. And <strong>{failureCount} out of {totalScenarios}</strong> historical
          scenarios (<strong>{failureRate}%</strong>) ended in failure.
        </p>
        <p className="explainer-callout">
          Kind of a big spread, wouldn't you say?
        </p>
      </section>

      <section className="explainer-section explainer-cta-section">
        <h2 className="explainer-heading">What can you do about it?</h2>
        <p>
          The good news: SORR is manageable. There are proven strategies smart nest egg
          managers use to smooth out this stark contrast and create a far more stable
          retirement journey — regardless of when markets decide to cooperate.
        </p>
        <p>
          If you'd like to see how this applies to your situation, simply click below to
          schedule a time that works best for you.
        </p>
        <div className="cta-buttons">
          <a href="#" className="cta-btn cta-btn--primary">
            Schedule a call →
          </a>
        </div>
      </section>

    </div>
  );
}
