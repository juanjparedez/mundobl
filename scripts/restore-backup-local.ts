import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { Pool } from 'pg';

// Rehearsal only: refuse remote targets and databases containing any app data.
async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('La restauración de prueba solo permite localhost.');
  }
  const file = process.argv[2];
  if (!file) throw new Error('Indicar archivo JSON de backup.');
  const backup: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    throw new Error('Formato de backup inválido.');
  }
  const data = backup as Record<string, unknown>;
  const pool = new Pool({ connectionString: url.href });
  const client = await pool.connect();
  const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
  try {
    await client.query('BEGIN');
    const tables = await client.query<{ name: string }>(
      `SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename`
    );
    const names = tables.rows.map((row) => row.name);
    if (JSON.stringify(names) !== JSON.stringify(Object.keys(data).sort())) {
      throw new Error(
        'Las tablas del backup no coinciden con la base destino.'
      );
    }
    for (const name of names) {
      if (!Array.isArray(data[name]))
        throw new Error('Tabla inválida: ' + name);
      await client.query(
        `LOCK TABLE public.${quote(name)} IN ACCESS EXCLUSIVE MODE`
      );
      const count = await client.query<{ count: string }>(
        `SELECT count(*) FROM public.${quote(name)}`
      );
      if (count.rows[0].count !== '0')
        throw new Error('La base destino debe estar vacía: ' + name);
    }
    const foreignKeys = await client.query<{ child: string; parent: string }>(
      `SELECT child.relname AS child, parent.relname AS parent
       FROM pg_constraint c JOIN pg_class child ON child.oid = c.conrelid
       JOIN pg_class parent ON parent.oid = c.confrelid
       JOIN pg_namespace n ON n.oid = child.relnamespace
       WHERE c.contype = 'f' AND n.nspname = 'public' AND child.oid <> parent.oid`
    );
    const pending = new Set(names);
    while (pending.size) {
      const ready = [...pending].filter(
        (name) =>
          !foreignKeys.rows.some(
            (fk) => fk.child === name && pending.has(fk.parent)
          )
      );
      if (!ready.length)
        throw new Error(
          'Dependencias circulares entre tablas; revisar restauración.'
        );
      for (const name of ready) {
        await client.query(
          `INSERT INTO public.${quote(name)} SELECT * FROM json_populate_recordset(NULL::public.${quote(name)}, $1::json)`,
          [JSON.stringify(data[name])]
        );
        pending.delete(name);
      }
    }
    const sequences = await client.query<{
      table_name: string;
      column_name: string;
      sequence: string;
    }>(
      `SELECT table_name, column_name,
        pg_get_serial_sequence(format('%I.%I', table_schema, table_name), column_name) AS sequence
       FROM information_schema.columns WHERE table_schema = 'public'
       AND (column_default LIKE 'nextval(%' OR is_identity = 'YES')`
    );
    for (const row of sequences.rows) {
      await client.query(
        `SELECT setval($1::regclass, COALESCE(max(${quote(row.column_name)}), 1), max(${quote(row.column_name)}) IS NOT NULL) FROM public.${quote(row.table_name)}`,
        [row.sequence]
      );
    }
    await client.query('COMMIT');
    console.log(
      `Restauración local correcta: ${names.length} tablas, restricciones activas.`
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
