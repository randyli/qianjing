export type View = 'landing' | 'dashboard' | 'research' | 'sentiment' | 'marketTools' | 'alerts' | 'jobs' | 'reportDetail' | 'settings';

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface UserSettings {
  notificationEmail: string;
  dailyDigestEnabled: boolean;
  watchlistAlertEnabled: boolean;
  theme: string;
}

export interface ValuationPoint {
  year: string;
  price: number;
  eps: number;
  pe: number;
  note?: string;
}

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
  valuationData?: ValuationPoint[];
  valuationNote?: string;
}

export interface SentimentData {
  time: string;
  score: number;
}

export interface SentimentEvent {
  id: string;
  targetType: string;
  targetKey: string;
  title: string;
  reason: string;
  scoreDelta: number;
  occurredAt: string;
}

export interface SectorAlert {
  id: string;
  sector: string;
  targetType?: string;
  targetKey?: string;
  enabled: boolean;
  threshold: number;
  direction?: 'above' | 'below';
  createdAt?: string;
  updatedAt?: string;
}

export interface AlertTrigger {
  id: string;
  alertId?: string;
  targetKey: string;
  score: number;
  message: string;
  triggeredAt: string;
  readAt?: string | null;
}

export interface JobRecord {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  input: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}


export interface PeBandPoint {
  tradeDate: string;
  close: number;
  peTtm: number;
  ttmEps: number;
  bands: Record<string, number>;
}

export interface PeBandData {
  target: {
    tsCode: string;
    name: string;
    currency: 'CNY';
  };
  range: {
    startDate: string;
    endDate: string;
    actualStartDate: string;
    actualEndDate: string;
  };
  multiples: number[];
  metrics: {
    latestClose: number;
    latestTradeDate: string;
    latestPeTtm: number;
    latestTtmEps: number;
    priceChangePct: number;
    ttmEpsChangePct: number;
  };
  series: PeBandPoint[];
  financialMarkers: Array<{
    period: string;
    endDate: string;
    annDate: string;
    basicEps: number;
  }>;
  source?: {
    provider: string;
    apis: string[];
    fetchedAt: string;
    cacheHit: boolean;
  };
  warnings: string[];
}
