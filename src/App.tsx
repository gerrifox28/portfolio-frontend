import React, { useState } from 'react';
import { AllScenariosRequest, AllScenariosResponse, AnnuityCompareRequest, AnnuityCompareResponse } from './types';
import { runAllScenarios, runCompare, uploadSpreadsheet, UploadResult } from './hooks/useSimulator';
import StatCards from './components/StatCards';
import OutcomesChart from './components/OutcomesChart';
import OutcomesHeatmap from './components/OutcomesHeatmap';
import SorrExplainer from './components/SorrExplainer';
import CompareChart from './components/CompareChart';
import './App.css';

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

  // ── Upload ─────────────────────────────────────────────────────────────────
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    setUploadError(null);
    try {
      const res = await uploadSpreadsheet(file);
      setUploadResult(res);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

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

      {/* ── Spreadsheet Upload ── */}
      <section className="upload-section">
        <div className="upload-inner">
          <label className="upload-label">
            {uploading ? 'Uploading…' : 'Update historical data (.xlsx / .xltm)'}
            <input type="file" accept=".xlsx,.xltm,.xls" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
          </label>
          {uploadResult && <span className="upload-success">✓ {uploadResult.yearsLoaded} years loaded ({uploadResult.minYear}–{uploadResult.maxYear})</span>}
          {uploadError && <span className="upload-error">{uploadError}</span>}
        </div>
      </section>

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
              <input type="number" value={yearCount} min={1} max={96} step={1}
                onChange={e => setYearCount(parseInt(e.target.value) || 40)} />
            </div>

            <div className="main-input-group">
              <label>
                Stock Market Allocation
                <span className="label-note"> *remainder goes to bonds &amp; REITs</span>
              </label>
              <div className="stock-slider-row">
                <input type="range" min={0} max={100} step={1} value={stockPct}
                  onChange={e => setStockPct(parseInt(e.target.value))} className="stock-slider" />
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
                        onChange={e => setAnnuityPct(parseInt(e.target.value))} className="stock-slider" />
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
            {(chartView === 'scatter' || chartView === 'both') && <OutcomesChart scenarios={result.scenarios} yearCount={result.yearCount} />}
            {(chartView === 'heatmap' || chartView === 'both') && <OutcomesHeatmap scenarios={result.scenarios} yearCount={result.yearCount} />}
            <SorrExplainer result={result} />
          </div>
        </section>
      )}

      {/* ── Results: annuity comparison ── */}
      {compareResult && !loading && (
        <section id="results" className="results-section">
          <div className="results-inner">
            <StatCards result={compareResult.withoutAnnuity} />
            <CompareChart compare={compareResult} />
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
