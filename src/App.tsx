import React, { useState, useEffect, useRef } from 'react';
import { AllScenariosRequest, AllScenariosResponse, AnnuityCompareRequest, AnnuityCompareResponse, CashFlow } from './types';
import { runAllScenarios, runCompare, runSimulation } from './hooks/useSimulator';
import StatCards from './components/StatCards';
import OutcomesChart from './components/OutcomesChart';
import OutcomesHeatmap from './components/OutcomesHeatmap';
import SorrExplainer from './components/SorrExplainer';
import PortfolioChart from './components/PortfolioChart';
import ResultsTable from './components/ResultsTable';
import CashFlowPanel from './components/CashFlowPanel';
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
            type="number" value={drillYear} min={1926} max={2010} step={1}
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

function adjustCurrency(current: string, step: number, setter: (v: string) => void) {
  const num = parseInt(current.replace(/,/g, ''), 10) || 0;
  const next = Math.max(0, num + step);
  setter(next.toLocaleString('en-US'));
}

export default function App() {
  // ── Core inputs ────────────────────────────────────────────────────────────
  const [nestEgg, setNestEgg] = useState('1,000,000');
  const [withdrawal, setWithdrawal] = useState('40,000');
  const [incomeStartYear, setIncomeStartYear] = useState(1);
  const [yearCount, setYearCount] = useState('30');
  const [stockPct, setStockPct] = useState(60);

  // ── Withdrawal mode ────────────────────────────────────────────────────────
  const [withdrawalMode, setWithdrawalMode] = useState<'inflation_adjusted' | 'fixed' | 'tpa'>('inflation_adjusted');

  // ── Expenses fee ───────────────────────────────────────────────────────────
  const [expensesFee, setExpensesFee] = useState('1.2'); // displayed as %, stored as %

  // ── Allocation mode ────────────────────────────────────────────────────────
  const [allocMode, setAllocMode] = useState<'auto' | 'manual'>('auto');
  const [manualAlloc, setManualAlloc] = useState({
    mSp500: '0', mCrsp1_10: '25', mCrsp6_10: '10',
    mFfIntl: '10', mFfEmgMkts: '5', mDjUsReit: '5',
    mOneMonth: '5', mFiveYearUS: '40',
  });
  function setField(key: keyof typeof manualAlloc, val: string) {
    setManualAlloc(prev => ({ ...prev, [key]: val }));
  }
  function zeroAllocations() {
    setManualAlloc({ mSp500: '0', mCrsp1_10: '0', mCrsp6_10: '0', mFfIntl: '0', mFfEmgMkts: '0', mDjUsReit: '0', mOneMonth: '0', mFiveYearUS: '0' });
  }
  function parseAlloc(v: string) { return parseFloat(v) || 0; }

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
  const [incomeMode, setIncomeMode] = useState(false);
  const [statScenario, setStatScenario] = useState<'without' | 'with'>('without');
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [resultsStale, setResultsStale] = useState(false);
  const [offendingFlowIds, setOffendingFlowIds] = useState<string[]>([]);

  // ── Temporary depletion modal ──────────────────────────────────────────────
  const [showDepletionModal, setShowDepletionModal] = useState(false);
  const [pendingDrillResult, setPendingDrillResult] = useState<SimulationResponse | null>(null);
  const [pendingDrillAnnuityResult, setPendingDrillAnnuityResult] = useState<SimulationResponse | null>(null);
  const [depletionOffendingSeq, setDepletionOffendingSeq] = useState<number | null>(null);

  // Sanitize any stale entries that may have a non-numeric amount
  useEffect(() => {
    setCashFlows(prev => prev.map(cf => {
      const parsed = cf as any;
      // Migrate old single "year" field to yearStart/yearEnd
      const yearStart = cf.yearStart ?? (parsed.year ?? null);
      const yearEnd = cf.yearEnd ?? (parsed.year ?? null);
      return {
        ...cf,
        amount: isNaN(parseFloat(String(cf.amount))) ? 0 : parseFloat(String(cf.amount)),
        inflationAdj: cf.inflationAdj ?? 'none',
        yearStart,
        yearEnd,
      };
    }));
  }, []);

  // ── Save / Load ────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveLoadError, setSaveLoadError] = useState<string | null>(null);

  function handleSave() {
    const sessionData = {
      version: '1.0',
      savedAt: new Date().toISOString(),
      nestEgg,
      withdrawal,
      incomeStartYear,
      yearCount,
      expensesFee,
      withdrawalMode,
      stockPct,
      allocMode,
      manualAlloc,
      showAnnuity,
      age,
      joint,
      annuityPct,
      annuityCap,
      cashFlows,
      incomeMode,
      statScenario,
      chartView,
    };
    const json = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `retirement-simulation-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleLoad(e: React.ChangeEvent<HTMLInputElement>) {
    setSaveLoadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const d = JSON.parse(event.target?.result as string);
        if (!d.version) {
          setSaveLoadError('Unrecognized file format. Please load a valid save file.');
          return;
        }
        setNestEgg(d.nestEgg ?? '1,000,000');
        setWithdrawal(d.withdrawal ?? '40,000');
        setIncomeStartYear(d.incomeStartYear ?? 1);
        setYearCount(d.yearCount ?? '30');
        setExpensesFee(d.expensesFee ?? '1.2');
        setWithdrawalMode(d.withdrawalMode ?? 'inflation_adjusted');
        setStockPct(d.stockPct ?? 60);
        setAllocMode(d.allocMode ?? 'auto');
        if (d.manualAlloc) setManualAlloc(d.manualAlloc);
        setShowAnnuity(d.showAnnuity ?? false);
        setAge(d.age ?? 65);
        setJoint(d.joint ?? false);
        setAnnuityPct(d.annuityPct ?? 30);
        setAnnuityCap(d.annuityCap ?? 0.03);
        setCashFlows(d.cashFlows ?? []);
        setIncomeMode(d.incomeMode ?? false);
        setStatScenario(d.statScenario ?? 'without');
        if (d.chartView) setChartView(d.chartView);
        // Clear previous results so the user re-runs with the loaded config
        setResult(null);
        setCompareResult(null);
        setDrillResult(null);
        setDrillAnnuityResult(null);
        setResultsStale(false);
      } catch {
        setSaveLoadError('Failed to load file. Please ensure it is a valid save file.');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be reloaded if needed
    e.target.value = '';
  }

  function handleCashFlowChange(flows: CashFlow[]) {
    setCashFlows(flows);
    setOffendingFlowIds([]);
    setResultsStale(true);
  }

  function detectTemporaryDepletion(yearlyResults: { portfolioEnd: number; sequenceNumber: number }[]) {
    let firstDepletionSeq: number | null = null;
    for (const r of yearlyResults) {
      if (r.portfolioEnd <= 0) {
        if (firstDepletionSeq === null) firstDepletionSeq = r.sequenceNumber;
      } else if (firstDepletionSeq !== null) {
        return { found: true, seq: firstDepletionSeq };
      }
    }
    return { found: false, seq: null };
  }

  function handleDepletionYes() {
    setDrillResult(pendingDrillResult);
    setDrillAnnuityResult(pendingDrillAnnuityResult);
    setPendingDrillResult(null);
    setPendingDrillAnnuityResult(null);
    setShowDepletionModal(false);
    setDepletionOffendingSeq(null);
  }

  function handleDepletionNo() {
    const offending = cashFlows
      .filter(cf => cf.amount < 0 && (cf.allYears || cf.yearStart === depletionOffendingSeq))
      .map(cf => cf.id);
    setOffendingFlowIds(offending);
    setPendingDrillResult(null);
    setPendingDrillAnnuityResult(null);
    setShowDepletionModal(false);
    setDepletionOffendingSeq(null);
  }

  // ── Drill-down ─────────────────────────────────────────────────────────────
  const [drillYear, setDrillYear] = useState<number>(1970);
  const [drillResult, setDrillResult] = useState<SimulationResponse | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);

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
        mSp500:      parseAlloc(manualAlloc.mSp500)     / 100,
        mCrsp1_10:   parseAlloc(manualAlloc.mCrsp1_10)  / 100,
        mCrsp6_10:   parseAlloc(manualAlloc.mCrsp6_10)  / 100,
        mFfIntl:     parseAlloc(manualAlloc.mFfIntl)    / 100,
        mFfEmgMkts:  parseAlloc(manualAlloc.mFfEmgMkts) / 100,
        mDjUsReit:   parseAlloc(manualAlloc.mDjUsReit)  / 100,
        mOneMonth:   parseAlloc(manualAlloc.mOneMonth)  / 100,
        mFiveYearUS: parseAlloc(manualAlloc.mFiveYearUS) / 100,
      } : {};
      const base = {
        startingNestEgg: parseFloat(nestEgg.replace(/,/g, '')) || 0,
        initialWithdrawal: parseFloat(withdrawal.replace(/,/g, '')) || 0,
        stockMarketAllocation: stockPct / 100,
        yearCount: parseInt(yearCount) || 30,
        expensesAndMgmtFee: (parseFloat(expensesFee) || 0) / 100,
        withdrawalMode,
        cashFlows,
        incomeStartYear,
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
        setStatScenario('without');
      } else {
        const req: AllScenariosRequest = base;
        setResult(await runAllScenarios(req));
      }

      setResultsStale(false);
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
      const remaining = 1 - sma - reit;
      const oneMonthAuto = Math.min(0.05, remaining);
      const fiveYearAuto = Math.max(0, remaining - oneMonthAuto);
      const baseAlloc = allocMode === 'manual' ? {
        sp500:     parseAlloc(manualAlloc.mSp500)     / 100,
        crsp1_10:  parseAlloc(manualAlloc.mCrsp1_10)  / 100,
        crsp6_10:  parseAlloc(manualAlloc.mCrsp6_10)  / 100,
        ffIntl:    parseAlloc(manualAlloc.mFfIntl)    / 100,
        ffEmgMkts: parseAlloc(manualAlloc.mFfEmgMkts) / 100,
        djUsReit:  parseAlloc(manualAlloc.mDjUsReit)  / 100,
        oneMonth:  parseAlloc(manualAlloc.mOneMonth)  / 100,
        fiveYearUS: parseAlloc(manualAlloc.mFiveYearUS) / 100,
        expensesAndMgmtFee: (parseFloat(expensesFee) || 0) / 100,
        withdrawalMode,
      } : {
        sp500: 0,
        crsp1_10: sma * 0.56,
        crsp6_10: sma * 0.10,
        ffIntl: sma * 0.23,
        ffEmgMkts: sma * 0.11,
        djUsReit: reit,
        oneMonth: oneMonthAuto,
        fiveYearUS: fiveYearAuto,
        expensesAndMgmtFee: (parseFloat(expensesFee) || 0) / 100,
        withdrawalMode,
      };
      const req: SimulationRequest = {
        startYear: year,
        startingNestEgg: parseFloat(nestEgg.replace(/,/g, '')) || 0,
        initialWithdrawal: parseFloat(withdrawal.replace(/,/g, '')) || 0,
        yearCount: parseInt(yearCount) || 30,
        cashFlows,
        incomeStartYear,
        ...baseAlloc,
      };
      const [res, annuityRes] = await Promise.all([
        runSimulation(req),
        activeCompare ? runSimulation({
          startYear: year,
          startingNestEgg: (parseFloat(nestEgg.replace(/,/g, '')) || 0) * (1 - annuityPct / 100),
          initialWithdrawal: parseFloat(withdrawal.replace(/,/g, '')) || 0,
          yearCount: parseInt(yearCount) || 30,
          cashFlows,
          incomeStartYear,
          ...baseAlloc,
          annuityInitialIncome: activeCompare.initialAnnuityIncome,
          annuityCap,
        }) : Promise.resolve(null),
      ]);

      // Detect temporary depletion before showing results
      const depletion = detectTemporaryDepletion(res.yearlyResults);
      if (depletion.found) {
        setPendingDrillResult(res);
        setPendingDrillAnnuityResult(annuityRes);
        setDepletionOffendingSeq(depletion.seq);
        setShowDepletionModal(true);
      } else {
        setDrillResult(res);
        setDrillAnnuityResult(annuityRes);
      }
      setTimeout(() => document.getElementById('drill')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      setDrillError(e.message);
    } finally {
      setDrillLoading(false);
    }
  }

  // Allocation breakdown for display
  const reitPct = Math.min(10, 100 - stockPct);
  const remainingPct = 100 - stockPct - reitPct;
  const tBillsPct = Math.min(5, remainingPct);
  const fiveYrPct = Math.max(0, remainingPct - tBillsPct);

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
          <div className="save-load-toolbar">
            <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleLoad} />
            <button className="save-load-btn" onClick={handleSave}>💾 Save</button>
            <button className="save-load-btn" onClick={() => fileInputRef.current?.click()}>📂 Load</button>
            {saveLoadError && <span className="save-load-error">{saveLoadError}</span>}
          </div>
          <div className="main-inputs">

            <div className="main-input-group">
              <label>Size of Nest Egg</label>
              <div className="input-prefix">
                <span>$</span>
                <input type="text" inputMode="numeric" value={nestEgg}
                  onChange={e => { const d = e.target.value.replace(/[^0-9]/g, ''); setNestEgg(d === '' ? '' : parseInt(d, 10).toLocaleString('en-US')); }} />
                <div className="spin-btns">
                  <button type="button" className="spin-btn" onClick={() => adjustCurrency(nestEgg, 10000, setNestEgg)} />
                  <button type="button" className="spin-btn" onClick={() => adjustCurrency(nestEgg, -10000, setNestEgg)} />
                </div>
              </div>
            </div>

            <div className="main-input-group">
              <label>Desired Year 1 Annual Income</label>
              <div className="input-prefix">
                <span>$</span>
                <input type="text" inputMode="numeric" value={withdrawal}
                  onChange={e => { const d = e.target.value.replace(/[^0-9]/g, ''); setWithdrawal(d === '' ? '' : parseInt(d, 10).toLocaleString('en-US')); }} />
                <div className="spin-btns">
                  <button type="button" className="spin-btn" onClick={() => adjustCurrency(withdrawal, 1000, setWithdrawal)} />
                  <button type="button" className="spin-btn" onClick={() => adjustCurrency(withdrawal, -1000, setWithdrawal)} />
                </div>
              </div>
              <select className="withdrawal-mode-select" value={withdrawalMode} onChange={e => setWithdrawalMode(e.target.value as 'inflation_adjusted' | 'fixed' | 'tpa')}>
                <option value="inflation_adjusted">With Inflation Adjustment</option>
                <option value="fixed">Fixed Withdrawal Amount</option>
                <option value="tpa">Withdrawal Amount Subject to TPA</option>
              </select>
              {withdrawalMode === 'tpa' && ((parseInt(yearCount) || 0) < 30 || (parseInt(yearCount) || 0) > 45) && (
                <p className="field-warn">TPA requires Years to Simulate between 30 and 45.</p>
              )}
            </div>

            <div className="main-input-group">
              <label>Income Start Year</label>
              <div className="input-prefix">
                <span>yr</span>
                <input
                  type="number"
                  className="hide-spin"
                  value={incomeStartYear}
                  min={1}
                  max={parseInt(yearCount) || 30}
                  step={1}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 1;
                    setIncomeStartYear(Math.max(1, Math.min(v, parseInt(yearCount) || 30)));
                  }}
                />
                <div className="spin-btns">
                  <button type="button" className="spin-btn" onClick={() => setIncomeStartYear(v => Math.min(v + 1, parseInt(yearCount) || 30))} />
                  <button type="button" className="spin-btn" onClick={() => setIncomeStartYear(v => Math.max(1, v - 1))} />
                </div>
              </div>
              {incomeStartYear > 1 && (
                <p className="field-note">Income withdrawals begin in simulation year {incomeStartYear}. Years 1–{incomeStartYear - 1} show $0 withdrawal.</p>
              )}
            </div>

            <div className="main-input-group">
              <label>Years to Simulate</label>
              <div className="input-prefix">
                <span>yrs</span>
                <input type="number" className="hide-spin" value={yearCount} min={1} max={96} step={1}
                  onChange={e => setYearCount(e.target.value)} />
                <div className="spin-btns">
                  <button type="button" className="spin-btn" onClick={() => setYearCount(String(Math.min(96, (parseInt(yearCount) || 0) + 1)))} />
                  <button type="button" className="spin-btn" onClick={() => setYearCount(String(Math.max(1, (parseInt(yearCount) || 0) - 1)))} />
                </div>
              </div>
            </div>

            <div className="main-input-group">
              <label>Expenses &amp; Mgmt Fee</label>
              <div className="input-suffix">
                <input type="number" className="hide-spin" value={expensesFee} min={0} max={10} step={0.1}
                  onChange={e => setExpensesFee(e.target.value)} />
                <div className="spin-btns">
                  <button type="button" className="spin-btn" onClick={() => setExpensesFee(v => String(Math.round(Math.min(10, (parseFloat(v) || 0) + 0.1) * 10) / 10))} />
                  <button type="button" className="spin-btn" onClick={() => setExpensesFee(v => String(Math.round(Math.max(0, (parseFloat(v) || 0) - 0.1) * 10) / 10))} />
                </div>
                <span>%</span>
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
                  {stockPct}% stocks (globally diversified) · {reitPct}% REIT · {tBillsPct}% T-Bills · {fiveYrPct}% 5-yr Treasuries
                </p>
              </>}

              {allocMode === 'manual' && (() => {
                const total = Object.values(manualAlloc).reduce((a, b) => a + (parseFloat(b) || 0), 0);
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
                            onChange={e => setField(key, e.target.value)} />
                          <span>%</span>
                        </div>
                      </div>
                    ))}
                    <div className={`manual-alloc-total ${Math.abs(totalRounded - 100) < 0.1 ? 'total-ok' : 'total-warn'}`}>
                      <span>Total: {totalRounded}% {Math.abs(totalRounded - 100) >= 0.1 && <span>(must equal 100%)</span>}</span>
                      <button className="zero-alloc-btn" onClick={zeroAllocations}>Clear</button>
                    </div>
                  </div>
                );
              })()}

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
                      ${Math.round((parseFloat(nestEgg.replace(/,/g, '')) || 0) * annuityPct / 100).toLocaleString()} to annuity · ${Math.round((parseFloat(nestEgg.replace(/,/g, '')) || 0) * (100 - annuityPct) / 100).toLocaleString()} invested
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="main-input-group full-width">
              <CashFlowPanel
                cashFlows={cashFlows}
                onChange={handleCashFlowChange}
                maxYear={parseInt(yearCount) || 30}
                offendingIds={offendingFlowIds}
              />
            </div>

            {resultsStale && (result || compareResult) && (
              <div className="stale-warning" style={{ gridColumn: '1 / -1' }}>
                ⚠ Cash flows have changed — re-run to see updated results.
              </div>
            )}

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
            {resultsStale && (
              <div className="stale-warning">
                ⚠ Cash flows have changed — re-run to see updated results.
              </div>
            )}
            <StatCards result={result} />
            <div className="chart-toggle">
              <button className={`chart-toggle-btn ${chartView === 'scatter' ? 'active' : ''}`} onClick={() => setChartView('scatter')}>Scatter Plot</button>
              <button className={`chart-toggle-btn ${chartView === 'heatmap' ? 'active' : ''}`} onClick={() => setChartView('heatmap')}>Outcomes Grid</button>
              <button className={`chart-toggle-btn ${chartView === 'both' ? 'active' : ''}`} onClick={() => setChartView('both')}>Show Both</button>
              <button className={`chart-toggle-btn ${incomeMode ? 'active' : ''}`} onClick={() => setIncomeMode(v => !v)}>Income</button>
            </div>
            {(chartView === 'scatter' || chartView === 'both') && <OutcomesChart scenarios={result.scenarios} yearCount={result.yearCount} onYearClick={handleDrill} selectedYear={drillResult ? drillYear : undefined} incomeMode={incomeMode} annuityMode={false} />}
            {(chartView === 'heatmap' || chartView === 'both') && <OutcomesHeatmap scenarios={result.scenarios} yearCount={result.yearCount} onYearClick={handleDrill} selectedYear={drillResult ? drillYear : undefined} incomeMode={incomeMode} annuityMode={false} />}

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
            {resultsStale && (
              <div className="stale-warning">
                ⚠ Cash flows have changed — re-run to see updated results.
              </div>
            )}
            <div className="stat-scenario-toggle">
              <button className={`chart-toggle-btn ${statScenario === 'without' ? 'active' : ''}`} onClick={() => setStatScenario('without')}>Without Annuity</button>
              <button className={`chart-toggle-btn ${statScenario === 'with' ? 'active' : ''}`} onClick={() => setStatScenario('with')}>With Annuity</button>
            </div>
            <StatCards result={statScenario === 'with' ? compareResult.withAnnuity : compareResult.withoutAnnuity} />

            <div className="compare-section-header">
              <h3 className="compare-section-label">Without Annuity</h3>
              <button className={`chart-toggle-btn ${incomeMode ? 'active' : ''}`} onClick={() => setIncomeMode(v => !v)}>Income</button>
            </div>
            <OutcomesChart scenarios={compareResult.withoutAnnuity.scenarios} yearCount={compareResult.withoutAnnuity.yearCount} onYearClick={handleDrill} selectedYear={drillResult ? drillYear : undefined} incomeMode={incomeMode} annuityMode={false} />
            <OutcomesHeatmap scenarios={compareResult.withoutAnnuity.scenarios} yearCount={compareResult.withoutAnnuity.yearCount} onYearClick={handleDrill} selectedYear={drillResult ? drillYear : undefined} incomeMode={incomeMode} annuityMode={false} />

            <h3 className="compare-section-label">With Annuity</h3>
            <OutcomesChart scenarios={compareResult.withAnnuity.scenarios} yearCount={compareResult.withAnnuity.yearCount} onYearClick={handleDrill} selectedYear={drillResult ? drillYear : undefined} incomeMode={incomeMode} annuityMode={true} />
            <OutcomesHeatmap scenarios={compareResult.withAnnuity.scenarios} yearCount={compareResult.withAnnuity.yearCount} onYearClick={handleDrill} selectedYear={drillResult ? drillYear : undefined} incomeMode={incomeMode} annuityMode={true} />

            {drillResult && (
              <DrillSection
                drillYear={drillYear} setDrillYear={setDrillYear}
                drillResult={drillResult} drillAnnuityResult={drillAnnuityResult}
                drillLoading={drillLoading} drillError={drillError}
                onRun={handleDrill}
              />
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

      {showDepletionModal && (
        <div className="depletion-modal-overlay">
          <div className="depletion-modal">
            <h3 className="depletion-modal-title">⚠ Portfolio Temporarily Depleted</h3>
            <p className="depletion-modal-body">
              A cash flow is causing the portfolio to reach $0 before a subsequent
              cash flow brings it back above $0. Do you wish to continue?
            </p>
            <div className="depletion-modal-actions">
              <button className="depletion-modal-yes" onClick={handleDepletionYes}>Yes — Show Results</button>
              <button className="depletion-modal-no" onClick={handleDepletionNo}>No — Highlight Offending Entry</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
