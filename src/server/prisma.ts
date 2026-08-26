import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from './config';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var pgPoolGlobal: pg.Pool | undefined;
}

let prismaClient: PrismaClient | null = null;
let pgPool: pg.Pool | null = null;

export function getPgPool(): pg.Pool {
  if (pgPool) return pgPool;
  if (globalThis.pgPoolGlobal) return globalThis.pgPoolGlobal;

  pgPool = new pg.Pool({
    connectionString:
      config.databaseUrl || 'postgresql://postgres:password@localhost:5432/redgrid_db?schema=public',
    max: 10,
    connectionTimeoutMillis: 3000,
  });

  // Prevent unhandled error crashes if DB is unreachable
  pgPool.on('error', (err) => {
    console.warn('PostgreSQL Pool background notice:', err.message);
  });

  if (config.nodeEnv !== 'production') {
    globalThis.pgPoolGlobal = pgPool;
  }

  return pgPool;
}

export function getPrisma(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  if (globalThis.prismaGlobal) {
    prismaClient = globalThis.prismaGlobal;
    return prismaClient;
  }

  const pool = getPgPool();
  const adapter = new PrismaPg(pool);

  prismaClient = new PrismaClient({
    adapter,
    log: config.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  });

  if (config.nodeEnv !== 'production') {
    globalThis.prismaGlobal = prismaClient;
  }

  return prismaClient;
}

export const prisma = getPrisma();
