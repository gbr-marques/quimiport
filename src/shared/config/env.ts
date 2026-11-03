import { existsSync } from 'node:fs';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

// DATABASE_URL não fica aqui: o Prisma a lê direto do ambiente (prisma/schema.prisma)
export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  porta: Number(process.env.PORT ?? 3000),
} as const;
