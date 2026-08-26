import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config';

export interface JwtAuthPayload {
  userId: string;
  role: Role;
  email?: string;
}

/**
 * Signs a JWT with the minimal secure payload and resilient fail-safe options.
 */
export function signAuthToken(payload: JwtAuthPayload): string {
  const secret = config.jwtSecret || 'redgrid-dev-secret-jwt-key-2026';
  const expiresIn = config.jwtExpiresIn || '7d';

  try {
    return jwt.sign(payload, secret, {
      expiresIn,
    } as jwt.SignOptions);
  } catch {
    // Fail-safe fallback if any custom expiresIn format causes signing issues
    try {
      return jwt.sign(payload, secret, {
        expiresIn: '7d',
      });
    } catch {
      return jwt.sign(payload, secret, {
        expiresIn: 604800, // 7 days in seconds
      });
    }
  }
}

/**
 * Verifies a JWT and extracts the typed payload.
 */
export function verifyAuthToken(token: string): JwtAuthPayload {
  const secret = config.jwtSecret || 'redgrid-dev-secret-jwt-key-2026';
  return jwt.verify(token, secret) as JwtAuthPayload;
}
