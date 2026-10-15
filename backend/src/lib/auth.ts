import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const COOKIE = config.admin.cookieName;

function getCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

export function signAdminToken(login: string): string {
  return jwt.sign({ sub: login }, config.admin.jwtSecret, {
    expiresIn: config.admin.tokenTtlSeconds,
  });
}

export function setAdminCookie(res: Response, token: string): void {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAdminCookie(res: Response): void {
  res.clearCookie(COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    path: '/',
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = getCookie(req, COOKIE);
  if (!token) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(token, config.admin.jwtSecret);
    res.locals.adminLogin =
      typeof payload === 'object' && payload !== null ? payload.sub : null;
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'unauthorized' });
  }
}
