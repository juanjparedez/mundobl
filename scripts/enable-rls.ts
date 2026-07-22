/* eslint-disable no-console */
import 'dotenv/config';
import { Pool } from 'pg';

/**
 * Habilita Row Level Security (RLS) en todas las tablas del schema `public`.
 *
 * Por que: el advisor de Supabase marca CRITICAL "RLS Disabled in Public". La
 * anon/publishable key es PUBLICA (NEXT_PUBLIC_...), y con RLS off cualquiera
 * con esa key podria leer/escribir tablas (User emails, AccessLog IPs,
 * Notification, FeatureRequestComment, etc.) via la REST API (PostgREST) de
 * Supabase, salteando la app.
 *
 * Seguro: la app accede a la DB SOLO via Prisma (conexion directa, rol postgres
 * que BYPASSEA RLS) y usa Supabase solo para Storage. Activar RLS sin policies
 * permisivas -> el rol anon no ve nada; la app sigue igual.
 *
 * Nota: RLS no lo maneja Prisma. Tablas nuevas de futuras migraciones NO
 * heredan RLS -> re-correr este script tras cada `prisma migrate`.
 *
 * Uso:
 *   npx tsx scripts/enable-rls.ts            # dry-run (lista estado)
 *   npx tsx scripts/enable-rls.ts --apply    # habilita RLS donde falte
 */

const APPLY = process.argv.includes('--apply');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log(`=== Enable RLS (public) ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ===\n`);

  const { rows } = await pool.query<{ tablename: string; rls: boolean }>(`
    SELECT c.relname AS tablename, c.relrowsecurity AS rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  `);

  const missing = rows.filter((r) => !r.rls);
  console.log(`Tablas public: ${rows.length} | con RLS: ${rows.length - missing.length} | SIN RLS: ${missing.length}\n`);

  for (const r of rows) {
    console.log(`  ${r.rls ? 'OK ' : 'OFF'}  ${r.tablename}`);
  }

  if (missing.length === 0) {
    console.log('\nTodas las tablas ya tienen RLS. Nada que hacer.');
    return;
  }

  console.log(`\n--- ${missing.length} tablas a habilitar ---`);
  for (const r of missing) console.log(`  ${r.tablename}`);

  if (!APPLY) {
    console.log('\nDry-run. Correr con --apply para habilitar RLS (deny-by-default para anon).');
    return;
  }

  let done = 0;
  for (const r of missing) {
    // Identifier seguro: viene de pg_class (no input de usuario). Igual lo
    // escapamos con comillas dobles por si el nombre tiene mayusculas.
    await pool.query(`ALTER TABLE public."${r.tablename}" ENABLE ROW LEVEL SECURITY`);
    done++;
    console.log(`  RLS habilitado: ${r.tablename}`);
  }
  console.log(`\nAplicado: RLS habilitado en ${done} tablas.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
