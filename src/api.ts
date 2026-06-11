import type { Report, SectorAlert, SentimentData, ValuationPoint } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const DEMO_EMAIL = import.meta.env.VITE_DEMO_USER_EMAIL ?? 'demo@example.com';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_USER_PASSWORD ?? 'password';

interface ApiEnvelope<T> {
  data: T;
}

let tokenPromise: Promise<string> | null = null;

async function getDemoToken() {
  tokenPromise ??= fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error('演示用户登录失败');
      return response.json() as Promise<{ token: string }>;
    })
    .then((payload) => payload.token);

  return tokenPromise;
}

async function request<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');

  if (authenticated) {
    headers.set('authorization', `Bearer ${await getDemoToken()}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API 请求失败：${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  async listReports(q = '') {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    const suffix = params.toString() ? `?${params}` : '';
    const payload = await request<ApiEnvelope<Report[]>>(`/reports${suffix}`);
    return payload.data;
  },

  async getReport(id: string) {
    const payload = await request<ApiEnvelope<Report>>(`/reports/${id}`);
    return payload.data;
  },

  async getValuation(id: string) {
    const payload = await request<ApiEnvelope<ValuationPoint[]>>(`/reports/${id}/valuation`);
    return payload.data;
  },

  async getSentimentPoints() {
    const payload = await request<ApiEnvelope<SentimentData[]>>('/sentiment/points');
    return payload.data;
  },

  async getSentimentOverview() {
    const payload = await request<ApiEnvelope<{ globalScore: number; sectors: Array<{ name: string; score: number; trend: number }> }>>('/sentiment/overview');
    return payload.data;
  },

  async listAlerts() {
    const payload = await request<ApiEnvelope<SectorAlert[]>>('/alerts', {}, true);
    return payload.data;
  },

  async updateAlert(id: string, patch: Partial<SectorAlert>) {
    const payload = await request<ApiEnvelope<SectorAlert>>(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }, true);
    return payload.data;
  },

  async createAlert(alert: Omit<SectorAlert, 'id'>) {
    const payload = await request<ApiEnvelope<SectorAlert>>('/alerts', { method: 'POST', body: JSON.stringify(alert) }, true);
    return payload.data;
  },

  async getAlertTriggers() {
    const payload = await request<ApiEnvelope<Array<{ id: string; targetKey: string; score: number; message: string; triggeredAt: string }>>>('/alerts/triggers', {}, true);
    return payload.data;
  },

  async getSettings() {
    return request<{ settings: { notificationEmail: string; dailyDigestEnabled: boolean; watchlistAlertEnabled: boolean; theme: string }; subscription: { planCode: string; status: string; currentPeriodEnd: string } }>('/me/settings', {}, true);
  },

  async updateSettings(settings: { notificationEmail: string; dailyDigestEnabled: boolean; watchlistAlertEnabled: boolean; theme: string }) {
    return request<{ settings: { notificationEmail: string; dailyDigestEnabled: boolean; watchlistAlertEnabled: boolean; theme: string } }>('/me/settings', { method: 'PATCH', body: JSON.stringify(settings) }, true);
  },
};
