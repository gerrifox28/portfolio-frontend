import React from 'react';
import { AllScenariosResponse } from '../types';

interface Props { result: AllScenariosResponse; }

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function SorrExplainer({ result }: Props) {
  const { totalScenarios, failureCount, failureRate, earliestFailureYears,
          highestEndingBalance, averageEndingBalance, worstStartYear, bestStartYear,
          yearCount } = result;

  return (
    <div className="explainer">

      <section className="explainer-section">
        <h2 className="explainer-heading">What calculations were made?</h2>
        <p>
          <strong>{totalScenarios} iterations</strong> were run — one for each starting year
          in our historical dataset. Each iteration simulates a complete {yearCount}-year
          retirement window using actual historical market returns, inflation data, and your
          withdrawal amount. This gives us every full {yearCount}-year period that has occurred
          in modern financial history.
        </p>
        <p>
          If you want tailored guidance or to discuss how this applies to your situation,{' '}
          <a href="#" className="explainer-link">schedule a call with me today!</a>
        </p>
        <p className="explainer-footnote">
          * Portfolio allocation is based on your selected stock market percentage, split across
          globally diversified equities (CRSP 1-10, CRSP 6-10, F/F International, F/F Emerging
          Markets), with the remainder in REITs and U.S. Treasuries. Assumes a 1.2% total
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
          <strong>{fmt$(highestEndingBalance)}</strong> after {yearCount} years. The average
          surviving portfolio ended at <strong>{fmt$(averageEndingBalance)}</strong>.
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
          The good news: SORR is manageable. TThere are proven strategies smart nest egg managers use to smooth out this stark contrast and create a far more stable retirement income journey — regardless of when markets decide to cooperate.
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
