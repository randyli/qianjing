import type { Response } from 'express';

export function badRequest(res: Response, message: string) {
  return res.status(400).json({ error: { code: 'bad_request', message } });
}

export function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
