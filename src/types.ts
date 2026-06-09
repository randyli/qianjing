export type View = 'dashboard' | 'research' | 'sentiment' | 'alerts' | 'reportDetail' | 'settings';

export interface ReportFinancials {
  revenue: string;
  netProfit: string;
  grossMargin?: string;
  roe?: string;
  netInterestMargin?: string;
  dividendYield?: string;
  freeCashFlow?: string;
  capex?: string;
}

export interface Report {
  id: string;
  title: string;
  companyName?: string;
  ticker?: string;
  companyName?: string;
  exchange?: string;
  rating?: 'buy' | 'hold' | 'sell' | 'neutral';
  targetPrice?: number;
  currentPrice?: number;
  upside?: number;
  valuation?: { year: string; eps: number; pe: number; price: number }[];
  financials?: { year: string; revenue: number; netProfit: number; roe?: number; margin?: number }[];
  investmentHighlights?: string[];
  keyRisks?: string[];
  thesis?: string;
  sector: string;
  summary: string;
  content?: string;
  impact: 'positive' | 'neutral' | 'negative';
  rating?: string;
  currentPrice?: string;
  targetPrice?: string;
  upside?: string;
  valuation?: string;
  financials?: ReportFinancials;
  investmentHighlights?: string[];
  keyRisks?: string[];
  date: string;
  isPremium: boolean;
}

export interface SentimentData {
  time: string;
  score: number;
}

export interface SectorAlert {
  id: string;
  sector: string;
  enabled: boolean;
  threshold: number; // e.g., trigger if sentiment drops below this or jumps above
}
