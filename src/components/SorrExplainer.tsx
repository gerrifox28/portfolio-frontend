import React from 'react';
import { AllScenariosResponse } from '../types';

interface Props { result: AllScenariosResponse; }

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function SorrExplainer({ result }: Props) {
  const { totalScenarios, failureCount, failureRate, earliestFailureYear,
        highestFinalBalance, averageFinalBalance, worstStartYear, bestStartYear } = result;

  return (
    <div className="explainer">

      <section className="explainer-section">
        <h2 className="explainer-heading">What calculations were made?</h2>
        <p>
          <strong>{totalScenarios} iterations</strong> were run — one for each starting year
          from 1929 through {1929 + totalScenarios - 1}. Each iteration simulates a complete
          40-year retirement window using <em>actual</em> historical market returns, inflation
          data, and your withdrawal amount. This gives us every full 40-year period that has
          occurred in modern financial history.
        </p>
        <p>
          Why 40 years? It represents a reasonable long-term retirement planning horizon — long
          enough to capture the full effects of market cycles, inflation, and compounding.
        </p>
      </section>

      <section className="explainer-section">
        <h2 className="explainer-heading">What is Sequence of Returns Risk?</h2>
        <p>
          Sequence of Returns Risk (SORR) is one of the most significant — and least discussed —
          risks in retirement planning. It refers to the danger that the <em>timing</em> of
          market downturns, not just their magnitude, can permanently damage a retirement portfolio.
        </p>
        <p>
          Two retirees with identical portfolios, identical withdrawals, and identical average
          returns over 40 years can end up with wildly different outcomes — purely based on
          <em> when</em> they retired. A severe market decline in the early years of retirement,
          when withdrawals are being made from a shrinking portfolio, can be devastating in a way
          that the same decline mid-retirement simply is not.
        </p>
      </section>

      <section className="explainer-section">
        <h2 className="explainer-heading">Key takeaway</h2>
        <p>
          Look at the spread in the chart above. The worst historical starting year
          ({worstStartYear}) led to portfolio exhaustion after just {earliestFailureYear} years.
          The best starting year ({bestStartYear}) left <strong>{fmt$(highestFinalBalance)}</strong> after
          40 years. The average surviving portfolio ended at <strong>{fmt$(averageFinalBalance)}</strong>.
        </p>
        <p>
          That is an enormous range of outcomes — from running out of money decades too early,
          to leaving a multi-million dollar legacy — driven entirely by which year you happened
          to retire. And {failureCount} out of {totalScenarios} historical scenarios
          ({failureRate}%) ended in failure.
        </p>
        <p className="explainer-callout">
          Kind of a big spread, wouldn't you say?
        </p>
      </section>

      <section className="explainer-section explainer-cta-section">
        <h2 className="explainer-heading">What can you do about it?</h2>
        <p>
          The good news: SORR is manageable. There are proven strategies smart nest egg managers
          use to smooth out this stark contrast and create a far more stable retirement journey —
          regardless of when markets decide to cooperate.
        </p>
        <div className="cta-buttons">
          <a href="#" className="cta-btn cta-btn--primary">
            Watch: The Identical Twins Story →
          </a>
          <a href="#" className="cta-btn cta-btn--secondary">
            Let's build your strategy →
          </a>
        </div>
      </section>

    </div>
  );
}
