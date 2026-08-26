import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './src/server/routes';
import { config, isOriginAllowed } from './src/server/config';
import { initSocketServer, closeSocketServer } from './src/server/socket';
import { securityHeaders } from './src/server/middleware/securityHeaders';
import { generalApiLimiter } from './src/server/middleware/rateLimit';
import { prisma } from './src/server/prisma';
import { seedAllDemoAccountsIfMissing } from './src/server/utils/seedDemoAccounts';

async function startServer() {
  const app = express();
  const PORT = config.port; // 3000

  // 1. Security Headers Middleware (MIME-sniffing, clickjacking, referrer policy, CSP)
  app.use(securityHeaders);

  // 2. Hardened CORS Configuration
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (isOriginAllowed(requestOrigin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy violation: Origin "${requestOrigin}" is not allowed.`), false);
        }
      },
      credentials: true,
    })
  );

  // 3. Body Parsers with Payload Size Restrictions
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Global API Rate Limiter on /api routes (skips /health & /ready)
  app.use('/api', generalApiLimiter);

  // 5. API Routes (MUST be mounted before Vite / static middleware)
  app.use('/api', apiRouter);

  // 6. Global API Error Handler (Sanitizes stack traces and credentials in production)
  app.use('/api', (err: any, req: Request, res: Response, _next: NextFunction) => {
    // If CORS origin error, return 403
    if (err.message && err.message.includes('CORS policy violation')) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Cross-origin request blocked by CORS policy.',
      });
      return;
    }

    console.error('Unhandled API Error:', config.isProduction ? err.message : err);

    res.status(err.status || 500).json({
      success: false,
      error: 'Internal Server Error',
      message: config.isProduction
        ? 'An unexpected error occurred. Please contact system support.'
        : err.message || 'An unexpected error occurred',
    });
  });

  // 7. Vite Middleware (Development) or Static File Serving (Production)
  if (config.nodeEnv !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 8. Create HTTP server and initialize Socket.IO
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  // 9. Start HTTP Listener on Host 0.0.0.0 & Port 3000
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 REDGRID Backend Server running on http://0.0.0.0:${PORT}`);
    console.log(`⚡ Socket.IO Real-Time Engine active on port ${PORT}`);
    console.log(`🏥 Health Check active at: http://0.0.0.0:${PORT}/api/health`);
    console.log(`🛡️ Readiness Check active at: http://0.0.0.0:${PORT}/api/ready`);

    // Ensure default system accounts exist in PostgreSQL
    seedAllDemoAccountsIfMissing().catch((err) => {
      console.warn('[SEED] Notice during initial startup seed check:', err);
    });
  });

  // 10. Graceful Shutdown Handlers (SIGTERM & SIGINT)
  let isShuttingDown = false;

  async function handleGracefulShutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[SHUTDOWN] Received ${signal}. Starting graceful shutdown sequence...`);

    // Safety timeout to prevent shutdown hanging indefinitely
    const forceExitTimer = setTimeout(() => {
      console.error('[SHUTDOWN] Graceful shutdown timeout (10s) exceeded. Forcing exit.');
      process.exit(1);
    }, 10000);

    if (forceExitTimer.unref) {
      forceExitTimer.unref();
    }

    try {
      // 1. Stop accepting new HTTP connections
      await new Promise<void>((resolve) => {
        httpServer.close((err) => {
          if (err) console.warn('[SHUTDOWN] HTTP server close warning:', err.message);
          resolve();
        });
      });
      console.log('[SHUTDOWN] HTTP listener stopped.');

      // 2. Terminate Socket.IO client connections
      await closeSocketServer();
      console.log('[SHUTDOWN] Socket.IO engine closed.');

      // 3. Disconnect PostgreSQL database connection pool
      await prisma.$disconnect();
      console.log('[SHUTDOWN] Prisma database connection closed.');

      clearTimeout(forceExitTimer);
      console.log('[SHUTDOWN] REDGRID graceful shutdown complete. Exiting cleanly.');
      process.exit(0);
    } catch (shutdownErr) {
      console.error('[SHUTDOWN] Error encountered during shutdown:', shutdownErr);
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('Failed to start REDGRID server:', error);
  process.exit(1);
});

