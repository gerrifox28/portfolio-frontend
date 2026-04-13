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

function DrillSection({ drillYear, setDrillYear, drillResult, drillAnnuityResult, drillLoading, drillError, onRun }: {
  drillYear: number;
  setDrillYear: (y: number) => void;
  drillResult: SimulationResponse | null;
  drillAnnuityResult: SimulationResponse | null;
  drillLoading: boolean;
  drillError: string | null;
  onRun: (year: number) => void;
}) {
  const [drillView, setDrillView] = React.useState<'without' | 'with'>('without');
  const showToggle = !!drillAnnuityResult;
  const activeResult = showToggle && drillView === 'with' ? drillAnnuityResult : drillResult;

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
      {activeResult && !drillLoading && (
        <div className="drill-results">
          {showToggle && (
            <div className="chart-toggle" style={{ marginBottom: 16 }}>
              <button className={`chart-toggle-btn ${drillView === 'without' ? 'active' : ''}`} onClick={() => setDrillView('without')}>Without Annuity</button>
              <button className={`chart-toggle-btn ${drillView === 'with' ? 'active' : ''}`} onClick={() => setDrillView('with')}>With Annuity</button>
            </div>
          )}
          <h3 className="drill-heading">
            Starting {activeResult.inputs.startYear}: {activeResult.yearlyResults.length}-year projection
            {activeResult.portfolioExhausted && <span className="drill-exhausted"> — portfolio exhausted</span>}
          </h3>
          <PortfolioChart data={activeResult.yearlyResults} />
          <ResultsTable data={activeResult.yearlyResults} showAnnuityColumns={showToggle && drillView === 'with'} />
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

  // ── Withdrawal mode ────────────────────────────────────────────────────────
  const [withdrawalMode, setWithdrawalMode] = useState<'inflation_adjusted' | 'fixed'>('inflation_adjusted');

  // ── Expenses fee ───────────────────────────────────────────────────────────
  const [expensesFee, setExpensesFee] = useState(1.2); // displayed as %, stored as %

  // ── Allocation mode ────────────────────────────────────────────────────────
  const [allocMode, setAllocMode] = useState<'auto' | 'manual'>('auto');
  const [manualAlloc, setManualAlloc] = useState({
    mSp500: 0, mCrsp1_10: 33.6, mCrsp6_10: 6.0,
    mFfIntl: 13.8, mFfEmgMkts: 6.6, mDjUsReit: 10.0,
    mOneMonth: 15.0, mFiveYearUS: 15.0,
  });
  function setField(key: keyof typeof manualAlloc, val: number) {
    setManualAlloc(prev => ({ ...prev, [key]: val }));
  }

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

  // ── Annuity cap ────────────────────────────────────────────────────────────
  const [annuityCap, setAnnuityCap] = useState(0.03);

  // ── Annuity drill result ───────────────────────────────────────────────────
  const [drillAnnuityResult, setDrillAnnuityResult] = useState<SimulationResponse | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    setCompareResult(null);
    setDrillResult(null);
    setDrillAnnuityResult(null);
    try {
      const manualFields = allocMode === 'manual' ? {
        manualAllocations: true,
        mSp500:      manualAlloc.mSp500     / 100,
        mCrsp1_10:   manualAlloc.mCrsp1_10  / 100,
        mCrsp6_10:   manualAlloc.mCrsp6_10  / 100,
        mFfIntl:     manualAlloc.mFfIntl    / 100,
        mFfEmgMkts:  manualAlloc.mFfEmgMkts / 100,
        mDjUsReit:   manualAlloc.mDjUsReit  / 100,
        mOneMonth:   manualAlloc.mOneMonth  / 100,
        mFiveYearUS: manualAlloc.mFiveYearUS / 100,
      } : {};
      const base = {
        startingNestEgg: nestEgg,
        initialWithdrawal: withdrawal,
        stockMarketAllocation: stockPct / 100,
        yearCount,
        expensesAndMgmtFee: expensesFee / 100,
        withdrawalMode,
        ...manualFields,
      };

      if (showAnnuity) {
        const req: AnnuityCompareRequest = {
          ...base,
          age,
          joint,
          annuityPercentage: annuityPct / 100,
          annuityCap,
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

  async function handleDrill(year: number, currentCompareResult?: typeof compareResult) {
    const activeCompare = currentCompareResult ?? compareResult;
    setDrillYear(year);
    setDrillLoading(true);
    setDrillError(null);
    try {
      const sma = stockPct / 100;
      const reit = Math.min(0.10, 1 - sma);
      const bond = (1 - sma - reit) / 2;
      const baseAlloc = allocMode === 'manual' ? {
        sp500:     manualAlloc.mSp500     / 100,
        crsp1_10:  manualAlloc.mCrsp1_10  / 100,
        crsp6_10:  manualAlloc.mCrsp6_10  / 100,
        ffIntl:    manualAlloc.mFfIntl    / 100,
        ffEmgMkts: manualAlloc.mFfEmgMkts / 100,
        djUsReit:  manualAlloc.mDjUsReit  / 100,
        oneMonth:  manualAlloc.mOneMonth  / 100,
        fiveYearUS: manualAlloc.mFiveYearUS / 100,
        expensesAndMgmtFee: expensesFee / 100,
        withdrawalMode,
      } : {
        sp500: 0,
        crsp1_10: sma * 0.56,
        crsp6_10: sma * 0.10,
        ffIntl: sma * 0.23,
        ffEmgMkts: sma * 0.11,
        djUsReit: reit,
        oneMonth: bond,
        fiveYearUS: bond,
        expensesAndMgmtFee: expensesFee / 100,
        withdrawalMode,
      };
      const req: SimulationRequest = {
        startYear: year,
        startingNestEgg: nestEgg,
        initialWithdrawal: withdrawal,
        ...baseAlloc,
      };
      const [res, annuityRes] = await Promise.all([
        runSimulation(req),
        activeCompare ? runSimulation({
          startYear: year,
          startingNestEgg: nestEgg * (1 - annuityPct / 100),
          initialWithdrawal: withdrawal,
          ...baseAlloc,
          annuityInitialIncome: activeCompare.initialAnnuityIncome,
          annuityCap,
        }) : Promise.resolve(null),
      ]);
      setDrillResult(res);
      setDrillAnnuityResult(annuityRes);
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
              <label>Desired Annual Income</label>
              <div className="input-prefix">
                <span>$</span>
                <input type="number" value={withdrawal} min={0} step={1000}
                  onChange={e => setWithdrawal(parseFloat(e.target.value) || 0)} />
              </div>
              <select className="withdrawal-mode-select" value={withdrawalMode} onChange={e => setWithdrawalMode(e.target.value as 'inflation_adjusted' | 'fixed')}>
                <option value="inflation_adjusted">With Inflation Adjustment</option>
                <option value="fixed">Fixed Withdrawal Amount</option>
                <option value="tpa" disabled>Withdrawal Amount Subject to TPA (coming soon)</option>
              </select>
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
              <div className="alloc-header">
                <label>Portfolio Allocation</label>
                <div className="coverage-toggle" style={{ marginLeft: 'auto' }}>
                  <button className={`coverage-btn ${allocMode === 'auto' ? 'active' : ''}`} onClick={() => setAllocMode('auto')}>Auto</button>
                  <button className={`coverage-btn ${allocMode === 'manual' ? 'active' : ''}`} onClick={() => setAllocMode('manual')}>Manual</button>
                </div>
              </div>

              {allocMode === 'auto' && <>
                <div className="stock-slider-row">
                  <input type="range" min={0} max={100} step={1} value={stockPct}
                    onChange={e => setStockPct(parseInt(e.target.value))} className="stock-slider"
                    style={{ '--val': `${stockPct}%` } as React.CSSProperties} />
                  <span className="stock-pct-value">{stockPct}%</span>
                </div>
                <p className="alloc-breakdown">
                  {stockPct}% stocks (globally diversified) · {reitPct}% REIT · {bondPct}% T-Bills · {bondPct}% 5-yr Treasuries
                </p>
              </>}

              {allocMode === 'manual' && (() => {
                const total = Object.values(manualAlloc).reduce((a, b) => a + b, 0);
                const totalRounded = Math.round(total * 10) / 10;
                return (
                  <div className="manual-alloc-grid">
                    {([
                      ['mSp500',     'S&P 500'],
                      ['mCrsp1_10',  'CRSP 1-10 (Total Mkt)'],
                      ['mCrsp6_10',  'CRSP 6-10 (Small/Mid)'],
                      ['mFfIntl',    'Intl Developed'],
                      ['mFfEmgMkts', 'Emerging Markets'],
                      ['mDjUsReit',  'US REIT'],
                      ['mOneMonth',  '1-Mo T-Bills'],
                      ['mFiveYearUS','5-Yr Treasuries'],
                    ] as [keyof typeof manualAlloc, string][]).map(([key, label]) => (
                      <div key={key} className="manual-alloc-row">
                        <span className="manual-alloc-label">{label}</span>
                        <div className="input-prefix manual-alloc-input">
                          <input type="number" value={manualAlloc[key]} min={0} max={100} step={0.1}
                            onChange={e => setField(key, parseFloat(e.target.value) || 0)} />
                          <span>%</span>
                        </div>
                      </div>
                    ))}
                    <div className={`manual-alloc-total ${Math.abs(totalRounded - 100) < 0.1 ? 'total-ok' : 'total-warn'}`}>
                      Total: {totalRounded}% {Math.abs(totalRounded - 100) >= 0.1 && <span>(must equal 100%)</span>}
                    </div>
                  </div>
                );
              })()}

              <div className="expenses-row">
                <label className="expenses-label">Expenses &amp; Mgmt Fee</label>
                <div className="input-prefix expenses-input">
                  <input type="number" value={expensesFee} min={0} max={10} step={0.1}
                    onChange={e => setExpensesFee(parseFloat(e.target.value) || 0)} />
                  <span>%</span>
                </div>
              </div>
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
                    <label>Annuity COLA Cap</label>
                    <select className="withdrawal-mode-select" value={annuityCap} onChange={e => setAnnuityCap(parseFloat(e.target.value))}>
                      <option value={0.03}>3% / year</option>
                      <option value={0.04}>4% / year</option>
                      <option value={0.05}>5% / year</option>
                    </select>
                    <span className="field-note">Max annual annuity income increase</span>
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
              drillResult={drillResult} drillAnnuityResult={null}
              drillLoading={drillLoading} drillError={drillError}
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
                  drillResult={drillResult} drillAnnuityResult={drillAnnuityResult}
                  drillLoading={drillLoading} drillError={drillError}
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
