export type View = 'dashboard' | 'research' | 'sentiment' | 'alerts' | 'reportDetail' | 'settings';

export interface Report {
  id: string;
  title: string;
  ticker?: string;
  companyName?: string;
  sector: string;
  summary: string;
  isDemo?: boolean;
  valuation?: Record<string, string | number>;
  financials?: Record<string, string | number>;
  content?: string;
  impact: 'positive' | 'neutral' | 'negative';
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
