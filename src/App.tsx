import React, { useState } from 'react';
import { AllScenariosRequest, AllScenariosResponse, AnnuityCompareRequest, AnnuityCompareResponse } from './types';
import { runAllScenarios, runCompare, runSimulation } from './hooks/useSimulator';
import StatCards from './components/StatCards';
import OutcomesChart from './components/OutcomesChart';
import OutcomesHeatmap from './components/OutcomesHeatmap';
import SorrExplainer from './components/SorrExplainer';
import CompareChart from './components/CompareChart';
import PortfolioChart from './components/PortfolioChart';
import ResultsTable from './components/ResultsTable';
import './App.css';
import { SimulationRequest, SimulationResponse } from './types';

function DrillSection({ drillYear, setDrillYear, drillResult, drillLoading, drillError, onRun }: {
  drillYear: number;
  setDrillYear: (y: number) => void;
  drillResult: SimulationResponse | null;
  drillLoading: boolean;
  drillError: string | null;
  onRun: (year: number) => void;
}) {
  return (
    <div id="drill" className="drill-section">
      <div className="drill-input-row">
        <span className="drill-label">Explore a specific start year:</span>
        <div className="input-prefix drill-year-input">
          <span>yr</span>
          <input
            type="number" value={drillYear} min={1929} max={2010} step={1}
            onChange={e => setDrillYear(parseInt(e.target.value) || 1970)}
            onKeyDown={e => e.key === 'Enter' && onRun(drillYear)}
          />
        </div>
        <button className="drill-run-btn" onClick={() => onRun(drillYear)} disabled={drillLoading}>
          {drillLoading ? <><span className="btn-spinner" /> Running…</> : 'Run →'}
        </button>
      </div>
      {drillError && <p className="error-msg">{drillError}</p>}
      {drillResult && !drillLoading && (
        <div className="drill-results">
          <h3 className="drill-heading">
            Starting {drillResult.inputs.startYear}: {drillResult.yearlyResults.length}-year projection
            {drillResult.portfolioExhausted && <span className="drill-exhausted"> — portfolio exhausted</span>}
          </h3>
          <PortfolioChart data={drillResult.yearlyResults} />
          <ResultsTable data={drillResult.yearlyResults} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  // ── Core inputs ────────────────────────────────────────────────────────────
  const [nestEgg, setNestEgg] = useState(1_000_000);
  const [withdrawal, setWithdrawal] = useState(40_000);
  const [yearCount, setYearCount] = useState(40);
  const [stockPct, setStockPct] = useState(60);

  // ── Annuity inputs ─────────────────────────────────────────────────────────
  const [showAnnuity, setShowAnnuity] = useState(false);
  const [age, setAge] = useState(65);
  const [joint, setJoint] = useState(false);
  const [annuityPct, setAnnuityPct] = useState(30); // displayed as whole number

  // ── Results ────────────────────────────────────────────────────────────────
  const [result, setResult] = useState<AllScenariosResponse | null>(null);
  const [compareResult, setCompareResult] = useState<AnnuityCompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'scatter' | 'heatmap' | 'both'>('both');

  // ── Drill-down ─────────────────────────────────────────────────────────────
  const [drillYear, setDrillYear] = useState<number>(1970);
  const [drillResult, setDrillResult] = useState<SimulationResponse | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);

  // ── Compare heatmap toggle ─────────────────────────────────────────────────
  const [compareHeatmap, setCompareHeatmap] = useState<'without' | 'with'>('without');

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    setCompareResult(null);
    try {
      const base = {
        startingNestEgg: nestEgg,
        initialWithdrawal: withdrawal,
        stockMarketAllocation: stockPct / 100,
        yearCount,
        expensesAndMgmtFee: 0.012,
      };

      if (showAnnuity) {
        const req: AnnuityCompareRequest = {
          ...base,
          age,
          joint,
          annuityPercentage: annuityPct / 100,
        };
        setCompareResult(await runCompare(req));
      } else {
        const req: AllScenariosRequest = base;
        setResult(await runAllScenarios(req));
      }

      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDrill(year: number) {
    setDrillYear(year);
    setDrillLoading(true);
    setDrillError(null);
    try {
      const sma = stockPct / 100;
      const reit = Math.min(0.10, 1 - sma);
      const bond = (1 - sma - reit) / 2;
      const req: SimulationRequest = {
        startYear: year,
        startingNestEgg: nestEgg,
        initialWithdrawal: withdrawal,
        expensesAndMgmtFee: 0.012,
        sp500: 0,
        crsp1_10: sma * 0.56,
        crsp6_10: sma * 0.10,
        ffIntl: sma * 0.23,
        ffEmgMkts: sma * 0.11,
        djUsReit: reit,
        oneMonth: bond,
        fiveYearUS: bond,
      };
      const res = await runSimulation(req);
      setDrillResult(res);
      setTimeout(() => document.getElementById('drill')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      setDrillError(e.message);
    } finally {
      setDrillLoading(false);
    }
  }

  // Allocation breakdown for display
  const reitPct = Math.min(10, 100 - stockPct);
  const bondPct = Math.round((100 - stockPct - reitPct) / 2);

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
              <label>Size of Nest Egg</label>
              <div className="input-prefix">
                <span>$</span>
                <input type="number" value={nestEgg} min={0} step={10000}
                  onChange={e => setNestEgg(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="main-input-group">
              <label>Inflation-Adjusted Annual Income <span className="label-note">*adjusts with inflation each year</span></label>
              <div className="input-prefix">
                <span>$</span>
                <input type="number" value={withdrawal} min={0} step={1000}
                  onChange={e => setWithdrawal(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="main-input-group">
              <label>Years to Simulate</label>
              <div className="input-prefix">
                <span>yrs</span>
                <input type="number" value={yearCount} min={1} max={96} step={1}
                  onChange={e => setYearCount(parseInt(e.target.value) || 40)} />
              </div>
            </div>

            <div className="main-input-group full-width">
              <label>
                Stock Market Allocation
                <span className="label-note"> *remainder goes to bonds &amp; REITs</span>
              </label>
              <div className="stock-slider-row">
                <input type="range" min={0} max={100} step={1} value={stockPct}
                  onChange={e => setStockPct(parseInt(e.target.value))} className="stock-slider"
                  style={{ '--val': `${stockPct}%` } as React.CSSProperties} />
                <span className="stock-pct-value">{stockPct}%</span>
              </div>
              <p className="alloc-breakdown">
                {stockPct}% stocks (globally diversified) · {reitPct}% REIT · {bondPct}% T-Bills · {bondPct}% 5-yr Treasuries
              </p>
            </div>

            {/* ── Annuity toggle ── */}
            <div className="annuity-section">
              <button className="annuity-toggle" onClick={() => setShowAnnuity(v => !v)}>
                {showAnnuity ? '▲' : '▼'} Add Annuity Comparison
              </button>

              {showAnnuity && (
                <div className="annuity-grid">
                  <div className="adv-input-group">
                    <label>Your Age</label>
                    <input type="number" value={age} min={49} max={80} step={1}
                      onChange={e => setAge(parseInt(e.target.value) || 65)} />
                    <span className="field-note">Ages 49–80 supported</span>
                  </div>

                  <div className="adv-input-group">
                    <label>Coverage Type</label>
                    <div className="coverage-toggle">
                      <button className={`coverage-btn ${!joint ? 'active' : ''}`} onClick={() => setJoint(false)}>Single</button>
                      <button className={`coverage-btn ${joint ? 'active' : ''}`} onClick={() => setJoint(true)}>Joint</button>
                    </div>
                  </div>

                  <div className="adv-input-group">
                    <label>% of Nest Egg to Annuitize</label>
                    <div className="stock-slider-row">
                      <input type="range" min={1} max={99} step={1} value={annuityPct}
                        onChange={e => setAnnuityPct(parseInt(e.target.value))} className="stock-slider"
                        style={{ '--val': `${annuityPct}%` } as React.CSSProperties} />
                      <span className="stock-pct-value">{annuityPct}%</span>
                    </div>
                    <p className="alloc-breakdown">
                      ${Math.round(nestEgg * annuityPct / 100).toLocaleString()} to annuity · ${Math.round(nestEgg * (100 - annuityPct) / 100).toLocaleString()} invested
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button className="run-btn" onClick={handleRun} disabled={loading}>
              {loading
                ? <><span className="btn-spinner" /> Running scenarios…</>
                : showAnnuity ? 'Run Annuity Comparison →' : 'Run All Historical Scenarios →'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Results: standard ── */}
      {result && !loading && (
        <section id="results" className="results-section">
          <div className="results-inner">
            <StatCards result={result} />
            <div className="chart-toggle">
              <button className={`chart-toggle-btn ${chartView === 'scatter' ? 'active' : ''}`} onClick={() => setChartView('scatter')}>Scatter Plot</button>
              <button className={`chart-toggle-btn ${chartView === 'heatmap' ? 'active' : ''}`} onClick={() => setChartView('heatmap')}>Outcomes Grid</button>
              <button className={`chart-toggle-btn ${chartView === 'both' ? 'active' : ''}`} onClick={() => setChartView('both')}>Show Both</button>
            </div>
            {(chartView === 'scatter' || chartView === 'both') && <OutcomesChart scenarios={result.scenarios} yearCount={result.yearCount} onYearClick={handleDrill} selectedYear={drillResult ? drillYear : undefined} />}
            {(chartView === 'heatmap' || chartView === 'both') && <OutcomesHeatmap scenarios={result.scenarios} yearCount={result.yearCount} onYearClick={handleDrill} selectedYear={drillResult ? drillYear : undefined} />}

            <DrillSection
              drillYear={drillYear} setDrillYear={setDrillYear}
              drillResult={drillResult} drillLoading={drillLoading} drillError={drillError}
              onRun={handleDrill}
            />

            <SorrExplainer result={result} />
          </div>
        </section>
      )}

      {/* ── Results: annuity comparison ── */}
      {compareResult && !loading && (
        <section id="results" className="results-section">
          <div className="results-inner">
            <StatCards result={compareResult.withoutAnnuity} />
            <CompareChart compare={compareResult} onYearClick={handleDrill} />

            {!drillResult && (
              <p className="click-prompt">Click any dot above to explore a specific start year in detail.</p>
            )}

            {drillResult && (
              <>
                <DrillSection
                  drillYear={drillYear} setDrillYear={setDrillYear}
                  drillResult={drillResult} drillLoading={drillLoading} drillError={drillError}
                  onRun={handleDrill}
                />
                <div className="compare-full-panel">
                  <div className="chart-toggle" style={{ marginBottom: 16 }}>
                    <button className={`chart-toggle-btn ${compareHeatmap === 'without' ? 'active' : ''}`} onClick={() => setCompareHeatmap('without')}>Without Annuity</button>
                    <button className={`chart-toggle-btn ${compareHeatmap === 'with' ? 'active' : ''}`} onClick={() => setCompareHeatmap('with')}>With Annuity</button>
                  </div>
                  {compareHeatmap === 'without'
                    ? <OutcomesHeatmap scenarios={compareResult.withoutAnnuity.scenarios} yearCount={compareResult.withoutAnnuity.yearCount} onYearClick={handleDrill} selectedYear={drillYear} />
                    : <OutcomesHeatmap scenarios={compareResult.withAnnuity.scenarios} yearCount={compareResult.withAnnuity.yearCount} onYearClick={handleDrill} selectedYear={drillYear} />
                  }
                </div>
              </>
            )}

            <SorrExplainer result={compareResult.withAnnuity} />
          </div>
        </section>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Running historical scenarios…</p>
        </div>
      )}

    </div>
  );
}
