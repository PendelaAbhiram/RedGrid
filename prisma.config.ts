import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/redgrid_db?schema=public',
  },
});
