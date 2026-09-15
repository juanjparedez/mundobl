try {
  process.loadEnvFile?.();
} catch {}
import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { assertSafePrismaCommand } from './scripts/prisma-safety';

const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
assertSafePrismaCommand(process.argv.slice(2), datasourceUrl);

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: datasourceUrl,
  },
});
