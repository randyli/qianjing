export type View = 'dashboard' | 'research' | 'sentiment' | 'alerts' | 'reportDetail' | 'settings';

export type ReportAccessLevel = 'free' | 'premium' | 'demo';

export interface Report {
  id: string;
  title: string;
  ticker?: string;
  sector: string;
  summary: string;
  content?: string;
  impact: 'positive' | 'neutral' | 'negative';
  date: string;
  /**
   * Describes how the report should be gated in the UI.
   * - free/demo reports render their content directly
   * - premium reports render with the locked upgrade overlay
   */
  accessLevel?: ReportAccessLevel;
  /** @deprecated Use accessLevel to avoid ambiguity between content type and user access. */
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
