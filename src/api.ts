import type { AlertTrigger, CurrentUser, JobRecord, Report, SectorAlert, SentimentData, SentimentEvent, UserSettings, PeBandData, ValuationPoint } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const AUTH_TOKEN_STORAGE_KEY = 'qianjing.authToken';

interface ApiEnvelope<T> {
  data: T;
}

interface AuthResponse {
  token: string;
  user: CurrentUser;
}

export class AuthRequiredError extends Error {
  constructor(message = '请先登录后再访问该功能。') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

let authToken: string | null = readStoredToken();

function readStoredToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

function persistToken(token: string | null) {
  authToken = token;
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

function extractErrorMessage(payload: unknown) {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    const error = 'error' in payload ? (payload as { error?: unknown }).error : undefined;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    if ('message' in payload) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
  }
  return null;
}

async function request<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  if (authenticated) {
    const token = api.getAuthToken();
    if (!token) throw new AuthRequiredError();
    headers.set('authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    if (response.status === 401 && authenticated) api.clearAuthToken();
    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text();
    const message = extractErrorMessage(payload);
    throw response.status === 401 ? new AuthRequiredError(message ?? undefined) : new Error(message || `API 请求失败：${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  getAuthToken() {
    return authToken ?? readStoredToken();
  },

  setAuthToken(token: string) {
    persistToken(token);
  },

  clearAuthToken() {
    persistToken(null);
  },

  async login(email: string, password: string) {
    const payload = await request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    this.setAuthToken(payload.token);
    return payload;
  },

  async register(email: string, password: string, displayName: string) {
    const payload = await request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) });
    this.setAuthToken(payload.token);
    return payload;
  },

  async getMe() {
    return request<{ user: CurrentUser; settings: (UserSettings & { updatedAt?: string }) | null; subscription: { planCode: string; status: string; currentPeriodEnd: string } | null }>('/me', {}, true);
  },

  async updateMe(profile: { displayName: string }) {
    return request<{ user: CurrentUser }>('/me', { method: 'PATCH', body: JSON.stringify(profile) }, true);
  },

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

  async getPeBand(params: { tsCode: string; range?: string; startDate?: string; endDate?: string; multiples?: number[] }) {
    const query = new URLSearchParams();
    query.set('tsCode', params.tsCode);
    if (params.range) query.set('range', params.range);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.multiples?.length) query.set('multiples', params.multiples.join(','));
    const payload = await request<ApiEnvelope<PeBandData>>(`/market/pe-band?${query}`);
    return payload.data;
  },

  async getSentimentPoints() {
    const payload = await request<ApiEnvelope<SentimentData[]>>('/sentiment/series');
    return payload.data;
  },

  async getSentimentOverview() {
    const payload = await request<ApiEnvelope<{ globalScore: number; sectors: Array<{ name: string; score: number; trend: number }> }>>('/sentiment/overview');
    return payload.data;
  },

  async getSentimentEvents() {
    const payload = await request<ApiEnvelope<SentimentEvent[]>>('/sentiment/events');
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

  async deleteAlert(id: string) {
    await request<void>(`/alerts/${id}`, { method: 'DELETE' }, true);
  },

  async getAlertTriggers() {
    const payload = await request<ApiEnvelope<AlertTrigger[]>>('/alerts/triggers', {}, true);
    return payload.data;
  },

  async getSettings() {
    return request<{ settings: (UserSettings & { updatedAt?: string }) | null; subscription: { planCode: string; status: string; currentPeriodEnd: string } | null }>('/me/settings', {}, true);
  },

  async updateSettings(settings: UserSettings) {
    return request<{ settings: UserSettings & { updatedAt?: string } }>('/me/settings', { method: 'PATCH', body: JSON.stringify(settings) }, true);
  },

  async listJobs(filters: { type?: string; status?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    const suffix = params.toString() ? `?${params}` : '';
    const payload = await request<ApiEnvelope<JobRecord[]>>(`/jobs${suffix}`, {}, true);
    return payload.data;
  },

  async createJob(type: string, input: Record<string, unknown> = {}) {
    const payload = await request<ApiEnvelope<JobRecord>>('/jobs', { method: 'POST', body: JSON.stringify({ type, input }) }, true);
    return payload.data;
  },

  async runJob(id: string) {
    const payload = await request<ApiEnvelope<JobRecord>>(`/jobs/${id}/run`, { method: 'POST' }, true);
    return payload.data;
  },

  async recalculateSentiment(input: Record<string, unknown> = {}) {
    const payload = await request<ApiEnvelope<JobRecord>>('/sentiment/recalculate', { method: 'POST', body: JSON.stringify(input) }, true);
    return payload.data;
  },
};
