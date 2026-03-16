import React, { useState, useEffect } from 'react';
import { SimulationRequest, SimulationResponse } from './types';
import { useDefaults, runSimulation } from './hooks/useSimulator';
import InputsPanel from './components/InputsPanel';
import SummaryCards from './components/SummaryCards';
import PortfolioChart from './components/PortfolioChart';
import ResultsTable from './components/ResultsTable';
import './App.css';

export default function App() {
  const defaults = useDefaults();
  const [inputs, setInputs] = useState<SimulationRequest | null>(null);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form once defaults load
  useEffect(() => {
    if (defaults && !inputs) setInputs(defaults);
  }, [defaults, inputs]);

  async function handleSubmit() {
    if (!inputs) return;
    setLoading(true);
    setError(null);
    try {
      const res = await runSimulation(inputs);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-title">
            <span className="header-logo">◈</span>
            <h1>Portfolio Simulator</h1>
          </div>
          <p className="header-sub">
            Historical retirement portfolio analysis · {' '}
            <span className="header-range">1926 – 2025</span>
          </p>
        </div>
      </header>

      <div className="app-body">
        {inputs ? (
          <InputsPanel
            values={inputs}
            onChange={setInputs}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        ) : (
          <aside className="inputs-panel loading-panel">
            <p>Loading defaults…</p>
          </aside>
        )}

        <main className="results-area">
          {!result && !loading && (
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <h2>Configure your portfolio</h2>
              <p>Set your inputs on the left and click <strong>Run Simulation</strong> to see how your portfolio would have performed historically.</p>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <div className="spinner" />
              <p>Running simulation…</p>
            </div>
          )}

          {result && !loading && (
            <div className="results">
              <SummaryCards result={result} />
              <PortfolioChart data={result.yearlyResults} />
              <ResultsTable data={result.yearlyResults} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
