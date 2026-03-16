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
