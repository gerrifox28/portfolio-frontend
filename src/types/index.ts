export interface SimulationRequest {
  startYear: number;
  startingNestEgg: number;
  initialWithdrawal: number;
  expensesAndMgmtFee: number;
  sp500: number;
  crsp1_10: number;
  oneMonth: number;
  fiveYearUS: number;
  crsp6_10: number;
  ffIntl: number;
  djUsReit: number;
  ffEmgMkts: number;
  withdrawalMode?: string;
  yearCount?: number;
  annuityInitialIncome?: number;
  annuityCap?: number;
}

export interface YearResult {
  sequenceNumber: number;
  year: number;
  inflation: number;
  portfolioBeginning: number;
  annualWithdrawal: number;
  portfolioReturnRate: number;
  portfolioReturnDollars: number;
  totalIncome: number;
  portfolioEnd: number;
  annuityPayment?: number;
  inflationAdjPct?: number;
}

export interface SimulationResponse {
  inputs: SimulationRequest;
  yearlyResults: YearResult[];
  yearsSurvived: number;
  portfolioExhausted: boolean;
  finalPortfolioValue: number;
  finalYear: number;
}

export interface AssetClass {
  key: keyof SimulationRequest;
  label: string;
}

export interface Metadata {
  minYear: number;
  maxYear: number;
  assetClasses: AssetClass[];
}

export interface ManualAllocations {
  mSp500: number;
  mCrsp1_10: number;
  mCrsp6_10: number;
  mFfIntl: number;
  mFfEmgMkts: number;
  mDjUsReit: number;
  mOneMonth: number;
  mFiveYearUS: number;
}

export interface AllScenariosRequest {
  startingNestEgg: number;
  initialWithdrawal: number;
  stockMarketAllocation: number;
  yearCount: number;
  expensesAndMgmtFee: number;
  withdrawalMode: string;
  manualAllocations?: boolean;
  mSp500?: number;
  mCrsp1_10?: number;
  mCrsp6_10?: number;
  mFfIntl?: number;
  mFfEmgMkts?: number;
  mDjUsReit?: number;
  mOneMonth?: number;
  mFiveYearUS?: number;
}

export interface ScenarioSummary {
  startYear: number;
  endingBalance: number;
  failed: boolean;
  yearsSurvived: number;
}

export interface AllScenariosResponse {
  scenarios: ScenarioSummary[];
  totalScenarios: number;
  failureCount: number;
  failureRate: number;
  earliestFailureYears: number;
  highestEndingBalance: number;
  averageEndingBalance: number;
  worstStartYear: number;
  bestStartYear: number;
  yearCount: number;
}

export interface AnnuityCompareRequest {
  startingNestEgg: number;
  initialWithdrawal: number;
  stockMarketAllocation: number;
  yearCount: number;
  expensesAndMgmtFee: number;
  age: number;
  joint: boolean;
  annuityPercentage: number;
  withdrawalMode: string;
  annuityCap: number;
  manualAllocations?: boolean;
  mSp500?: number;
  mCrsp1_10?: number;
  mCrsp6_10?: number;
  mFfIntl?: number;
  mFfEmgMkts?: number;
  mDjUsReit?: number;
  mOneMonth?: number;
  mFiveYearUS?: number;
}

export interface AnnuityCompareResponse {
  withoutAnnuity: AllScenariosResponse;
  withAnnuity: AllScenariosResponse;
  annuityRate: number;
  initialAnnuityIncome: number;
}
