try {
  process.loadEnvFile?.();
} catch {}
import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { assertSafePrismaCommand } from './scripts/prisma-safety';

// Solo archivos SQLite locales (file:...): D1 no tiene URL de conexion.
const datasourceUrl = process.env.DATABASE_URL?.startsWith('file:')
  ? process.env.DATABASE_URL
  : '';
assertSafePrismaCommand(process.argv.slice(2));

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: datasourceUrl,
  },
});
