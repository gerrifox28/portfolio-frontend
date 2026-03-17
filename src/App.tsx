import React, { useState, useEffect } from 'react';
import { AllScenariosRequest, AllScenariosResponse, SimulationRequest } from './types';
import { useDefaults, runAllScenarios } from './hooks/useSimulator';
import StatCards from './components/StatCards';
import OutcomesChart from './components/OutcomesChart';
import OutcomesHeatmap from './components/OutcomesHeatmap';
import SorrExplainer from './components/SorrExplainer';
import './App.css';

const ALLOCATION_FIELDS: Array<{ field: keyof SimulationRequest; label: string }> = [
  { field: 'sp500',       label: 'S&P 500' },
  { field: 'crsp1_10',   label: 'CRSP 1-10 (Total Market)' },
  { field: 'oneMonth',   label: 'One-Month T-Bills' },
  { field: 'fiveYearUS', label: '5-Year US Treasuries' },
  { field: 'crsp6_10',   label: 'CRSP 6-10 (Small Cap)' },
  { field: 'ffIntl',     label: 'F/F International' },
  { field: 'djUsReit',   label: 'DJ US REIT' },
  { field: 'ffEmgMkts',  label: 'F/F Emerging Markets' },
];

type ChartView = 'scatter' | 'heatmap' | 'both';

export default function App() {
  const defaults = useDefaults();
  const [nestEgg, setNestEgg] = useState(1_000_000);
  const [withdrawal, setWithdrawal] = useState(40_000);
  const [advanced, setAdvanced] = useState<SimulationRequest | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<AllScenariosResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<ChartView>('both');

  useEffect(() => { if (defaults) setAdvanced(defaults); }, [defaults]);

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      const req: AllScenariosRequest = { startingNestEgg: nestEgg, initialWithdrawal: withdrawal };
      setResult(await runAllScenarios(req));
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const allocSum = advanced
    ? ALLOCATION_FIELDS.reduce((s, f) => s + (advanced[f.field] as number), 0)
    : 1;
  const allocOk = Math.abs(allocSum - 1.0) < 0.001;

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <span className="header-logo">◈</span>
          <div>
            <h1>Sequence of Returns Risk</h1>
            <p className="header-sub">How much does your retirement start year matter? More than you think.</p>
          </div>
        </div>
      </header>

      {/* ── Inputs ── */}
      <section className="inputs-section">
        <div className="inputs-inner">
          <div className="main-inputs">
            <div className="main-input-group">
              <label>Starting Nest Egg</label>
              <div className="input-prefix">
                <span>$</span>
                <input type="number" value={nestEgg} min={0} step={10000}
                  onChange={e => setNestEgg(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="main-input-group">
              <label>Initial Annual Withdrawal <span className="label-note">*adjusts for inflation each year</span></label>
              <div className="input-prefix">
                <span>$</span>
                <input type="number" value={withdrawal} min={0} step={1000}
                  onChange={e => setWithdrawal(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button className="run-btn" onClick={handleRun} disabled={loading}>
              {loading ? <><span className="btn-spinner" /> Running 58 scenarios…</> : 'Run All Historical Scenarios →'}
            </button>
          </div>

          <div className="advanced-section">
            <button className="advanced-toggle" onClick={() => setShowAdvanced(v => !v)}>
              {showAdvanced ? '▲' : '▼'} Advanced: Portfolio Allocation & Fees
            </button>
            {showAdvanced && advanced && (
              <div className="advanced-grid">
                <div className="adv-input-group">
                  <label>Expenses + Mgmt Fee</label>
                  <div className="input-suffix">
                    <input type="number" value={Math.round(advanced.expensesAndMgmtFee * 1000) / 10}
                      min={0} max={10} step={0.1}
                      onChange={e => setAdvanced({ ...advanced, expensesAndMgmtFee: (parseFloat(e.target.value) || 0) / 100 })} />
                    <span>%</span>
                  </div>
                </div>
                {ALLOCATION_FIELDS.map(({ field, label }) => (
                  <div key={field} className="adv-input-group">
                    <label>{label}</label>
                    <div className="input-suffix">
                      <input type="number"
                        value={Math.round((advanced[field] as number) * 1000) / 10}
                        min={0} max={100} step={0.1}
                        onChange={e => setAdvanced({ ...advanced, [field]: (parseFloat(e.target.value) || 0) / 100 })} />
                      <span>%</span>
                    </div>
                  </div>
                ))}
                <p className={`alloc-sum ${allocOk ? 'alloc-ok' : 'alloc-warn'}`}>
                  Allocation total: {Math.round(allocSum * 1000) / 10}% {allocOk ? '✓' : '— must equal 100%'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      {result && !loading && (
        <section id="results" className="results-section">
          <div className="results-inner">

            <StatCards result={result} />

            {/* Chart toggle */}
            <div className="chart-toggle">
              <button className={`chart-toggle-btn ${chartView === 'scatter' ? 'active' : ''}`}
                onClick={() => setChartView('scatter')}>Scatter Plot</button>
              <button className={`chart-toggle-btn ${chartView === 'heatmap' ? 'active' : ''}`}
                onClick={() => setChartView('heatmap')}>Outcomes Grid</button>
              <button className={`chart-toggle-btn ${chartView === 'both' ? 'active' : ''}`}
                onClick={() => setChartView('both')}>Show Both</button>
            </div>

            {(chartView === 'scatter' || chartView === 'both') && (
              <OutcomesChart scenarios={result.scenarios} />
            )}
            {(chartView === 'heatmap' || chartView === 'both') && (
              <OutcomesHeatmap scenarios={result.scenarios} />
            )}

            <SorrExplainer result={result} />
          </div>
        </section>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Running {58} historical scenarios…</p>
        </div>
      )}

    </div>
  );
}
