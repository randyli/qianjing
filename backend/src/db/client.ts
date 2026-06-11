import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { config } from '../config';

mkdirSync(dirname(config.databaseUrl), { recursive: true });

export const db = new DatabaseSync(config.databaseUrl);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function nowIso() {
  return new Date().toISOString();
}

export function one<T>(sql: string, params: SQLInputValue[] = []): T | null {
  return db.prepare(sql).get(...params) as T | undefined ?? null;
}

export function all<T>(sql: string, params: SQLInputValue[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}
