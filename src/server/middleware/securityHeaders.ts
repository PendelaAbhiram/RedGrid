import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Production-safe HTTP Security Headers Middleware.
 * Protects against MIME sniffing, clickjacking, unsafe referrer leakage,
 * and common browser vulnerabilities while remaining fully compatible
 * with Vite, React, Google AI Studio preview iframes, and Socket.IO.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // 1. Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 2. Control referrer leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 3. Prevent cross-site scripting (XSS) filter bypass in legacy browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 4. Restrict Flash and PDF policy file execution
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // 5. Restrict file downloads from being opened directly in old browsers
  res.setHeader('X-Download-Options', 'noopen');

  // 6. Strict-Transport-Security for production HTTPS
  if (config.nodeEnv === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 7. Frame protection & CSP: Allow embedding in Google AI Studio and authorized container hosts
  // We avoid strict 'DENY' so AI Studio iframe preview continues to render smoothly.
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' ws: wss: https:",
      "frame-ancestors 'self' https://*.google.com https://*.googleusercontent.com https://*.run.app http://localhost:*",
    ].join('; ')
  );

  next();
}
