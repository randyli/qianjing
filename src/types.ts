export type View = 'dashboard' | 'research' | 'sentiment' | 'alerts' | 'reportDetail' | 'settings';

export interface Report {
  id: string;
  title: string;
  ticker?: string;
  sector: string;
  summary: string;
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
