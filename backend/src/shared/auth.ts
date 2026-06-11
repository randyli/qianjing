import { createHmac, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { one } from '../db/client';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function signPayload(value: string) {
  return createHmac('sha256', config.jwtSecret).update(value).digest('base64url');
}

export function createPasswordHash(password: string, salt = randomUUID()) {
  const hash = scryptSync(password, salt, 64).toString('base64url');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(':');
  if (!salt || !storedHash) return false;

  const candidate = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, 'base64url');
  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
}

export function createToken(user: AuthUser) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({ sub: user.id, email: user.email, name: user.displayName, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 }));
  const signature = signPayload(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;
  if (signPayload(`${header}.${payload}`) !== signature) return null;

  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub: string; email: string; name: string; role: string; exp: number };
  if (claims.exp < Math.floor(Date.now() / 1000)) return null;

  const user = one<{ id: string; email: string; display_name: string; role: string }>(
    'SELECT id, email, display_name, role FROM users WHERE id = ?',
    [claims.sub],
  );
  if (!user) return null;
  return { id: user.id, email: user.email, displayName: user.display_name, role: user.role };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  const user = token ? verifyToken(token) : null;

  if (!user) {
    res.status(401).json({ error: { code: 'unauthorized', message: '需要有效登录令牌。' } });
    return;
  }

  req.user = user;
  next();
}
