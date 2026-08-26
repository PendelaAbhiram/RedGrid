import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { config } from '../config';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint for container lifecycle monitoring and load balancers.
 * Checks both server runtime and database connectivity.
 */
router.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'not_configured';

  if (config.databaseUrl && !config.databaseUrl.includes('localhost:5432')) {
    try {
      // Fast database ping with adequate handshake window for remote SSL connections
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 5000)),
      ]);
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'unreachable';
    }
  } else if (config.databaseUrl) {
    dbStatus = 'local_configured';
  }

  res.status(200).json({
    status: 'ok',
    service: 'REDGRID API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: dbStatus,
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  });
});

/**
 * GET /api/ready
 * Readiness probe for container orchestrators (Kubernetes / Cloud Run).
 * Verifies that PostgreSQL is actively accepting queries and core services are operational.
 */
router.get('/ready', async (req: Request, res: Response): Promise<void> => {
  let isDbReady = false;

  try {
    if (config.databaseUrl) {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 4000)),
      ]);
      isDbReady = true;
    }
  } catch {
    isDbReady = false;
  }

  const isConfigValid = Boolean(config.jwtSecret);

  if (isDbReady && isConfigValid) {
    res.status(200).json({
      status: 'ready',
      service: 'REDGRID Core Engine',
      ready: true,
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: config.nodeEnv,
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      service: 'REDGRID Core Engine',
      ready: false,
      timestamp: new Date().toISOString(),
      database: isDbReady ? 'connected' : 'unreachable',
      environment: config.nodeEnv,
      error: 'Service dependencies are not ready to accept traffic.',
    });
  }
});

export default router;
