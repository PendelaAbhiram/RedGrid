import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Production Security Guard: Refuse to start with dev JWT secret in production
const DEV_JWT_FALLBACK = 'redgrid-dev-secret-jwt-key-2026';
const rawJwtSecret = process.env.JWT_SECRET;

if (isProduction && (!rawJwtSecret || rawJwtSecret === DEV_JWT_FALLBACK)) {
  throw new Error(
    '[FATAL CONFIGURATION ERROR] Production deployment requires an explicit, secure JWT_SECRET environment variable. Development fallback is rejected.'
  );
}

const jwtSecret = rawJwtSecret || DEV_JWT_FALLBACK;

// Parse CORS allowed origins from comma-separated list
const rawCorsOrigin = process.env.CORS_ORIGIN || '*';
const allowedCorsOrigins: string[] = rawCorsOrigin
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/**
 * Validates whether an incoming request origin is permitted.
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  // Allow server-to-server requests, mobile apps, health checks, or local curl without origin header
  if (!origin) return true;

  // If wildcard '*' is configured (or default), permit all origins
  if (rawCorsOrigin === '*' || allowedCorsOrigins.includes('*')) {
    return true;
  }

  const normalizedOrigin = origin.replace(/\/+$/, '').toLowerCase();

  // Always permit Google Cloud Run, AI Studio preview/production domains, and local dev
  try {
    const parsed = new URL(normalizedOrigin);
    const hostname = parsed.hostname.toLowerCase();

    // Allow localhost & loopback
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost')
    ) {
      return true;
    }

    // Allow Cloud Run & Google AI Studio container domains
    if (
      hostname.endsWith('.run.app') ||
      hostname.endsWith('.googleusercontent.com') ||
      hostname.endsWith('.aistudio.google.com') ||
      hostname.endsWith('.ai.studio') ||
      hostname === 'ai.studio'
    ) {
      return true;
    }

    // Allow Vercel preview & production deployments
    if (hostname.endsWith('.vercel.app')) {
      return true;
    }
  } catch {
    // If URL parsing fails, fallback to explicit pattern matching
  }

  return allowedCorsOrigins.some((allowed) => {
    const norm = allowed.replace(/\/+$/, '').toLowerCase();
    if (norm === '*' || norm === normalizedOrigin) return true;
    if (norm.startsWith('*.') && normalizedOrigin.endsWith(norm.slice(1))) return true;
    if (norm.includes('run.app') && normalizedOrigin.endsWith('.run.app')) return true;
    if (norm.includes('vercel.app') && normalizedOrigin.endsWith('.vercel.app')) return true;
    return false;
  });
}

// Parse JWT expiration string or numeric seconds safely
function parseExpiresIn(val: string | undefined): string | number {
  if (!val) return '7d';
  const cleaned = String(val).trim().replace(/^["']|["']$/g, '').trim();
  if (!cleaned || cleaned === 'undefined' || cleaned === 'null') {
    return '7d';
  }
  // Pure numeric seconds string: e.g. "604800" or "86400"
  if (/^\d+$/.test(cleaned)) {
    const num = parseInt(cleaned, 10);
    return isNaN(num) || num <= 0 ? '7d' : num;
  }
  // Standard duration strings supported by ms/jsonwebtoken: e.g. "7d", "24h", "60m", "3600s"
  if (/^\d+\s*(s|sec|secs|seconds|m|min|mins|minutes|h|hr|hrs|hours|d|day|days|w|weeks|y|years)$/i.test(cleaned)) {
    return cleaned;
  }
  return '7d';
}

export const config = {
  port: 3000,
  nodeEnv,
  isProduction,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret,
  jwtExpiresIn: parseExpiresIn(process.env.JWT_EXPIRES_IN),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  corsOrigin: rawCorsOrigin,
  allowedCorsOrigins,
  donorMatchRadiusKm: Number(process.env.DONOR_MATCH_RADIUS_KM) || 10,
};

