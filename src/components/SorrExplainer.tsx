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
