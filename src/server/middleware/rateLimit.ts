import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

interface ClientRecord {
  timestamps: number[];
  lastSeen: number;
}

/**
 * Creates a reusable in-memory sliding-window rate limiting middleware.
 * Automatically cleans up expired entries to prevent unbounded memory usage.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please try again later.',
    keyGenerator = (req: Request) => {
      // Prioritize authenticated user ID if present; fallback to client IP
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (userId) return `user:${userId}`;

      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return `ip:${forwarded.split(',')[0].trim()}`;
      }
      return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    },
    skip = () => false,
  } = options;

  const hits = new Map<string, ClientRecord>();

  // Periodically sweep expired entries every 60 seconds
  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.lastSeen > windowMs * 2) {
        hits.delete(key);
      }
    }
  }, 60000);

  // Allow Node to exit cleanly without keeping event loop alive
  if (sweepInterval.unref) {
    sweepInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = hits.get(key);
    if (!record) {
      record = { timestamps: [], lastSeen: now };
      hits.set(key, record);
    }

    // Filter out timestamps outside the current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
    record.lastSeen = now;

    // Check if limit exceeded
    if (record.timestamps.length >= max) {
      const oldestInWindow = record.timestamps[0] || now;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + windowMs - now) / 1000));

      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((oldestInWindow + windowMs) / 1000));

      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message,
        retryAfterSeconds,
      });
      return;
    }

    // Record this request
    record.timestamps.push(now);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.timestamps.length));
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

    next();
  };
}

/**
 * AUTH LOGIN: 10 requests / 15 minutes / IP
 */
export const authLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  keyGenerator: (req: Request) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip || req.socket.remoteAddress || 'unknown';
    return `auth_login:${ip}`;
  },
});

/**
 * AUTH REGISTER: 10 requests / 15 minutes / IP
 */
export const authRegisterLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many registration attempts. Please wait 15 minutes before trying again.',
  keyGenerator: (req: Request) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip || req.socket.remoteAddress || 'unknown';
    return `auth_register:${ip}`;
  },
});

/**
 * EMERGENCY CREATION: 30 requests / hour / authenticated organization
 */
export const emergencyCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Emergency alert dispatch limit reached (max 30 per hour). Please contact direct hotline for critical assistance.',
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    const orgId = user?.managedOrganizations?.[0]?.id || user?.organizationId || user?.id;
    return `emergency_create:${orgId || req.ip || 'unknown'}`;
  },
});

/**
 * DONOR RESPONSE: 60 requests / hour / authenticated donor
 */
export const donorResponseLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: 'Emergency response limit reached (max 60 per hour).',
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return `donor_response:${user?.id || req.ip || 'unknown'}`;
  },
});

/**
 * GENERAL API: 120 requests / minute / authenticated user or IP
 * (Skips health/readiness checks)
 */
export const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'API request rate limit exceeded (max 120 per minute). Please slow down your requests.',
  skip: (req: Request) => {
    // Never rate limit health, readiness, or static asset endpoints
    return (
      req.path === '/health' ||
      req.path === '/ready' ||
      req.path === '/api/health' ||
      req.path === '/api/ready'
    );
  },
});

/**
 * ADMIN ANALYTICS: 60 requests / minute / authenticated admin
 */
export const adminAnalyticsLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Admin analytics telemetry request limit reached (max 60 per minute).',
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return `admin_analytics:${user?.id || req.ip || 'admin'}`;
  },
});

/**
 * NOTIFICATIONS: 120 requests / minute / authenticated user
 */
export const notificationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Notification polling rate limit exceeded.',
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return `notifications:${user?.id || req.ip || 'unknown'}`;
  },
});
