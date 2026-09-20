import 'dotenv/config';
import pg from 'pg';
const completed = [156,157,158,159,160,161,163,164,165];
const basedOnStatus = process.argv.includes('--complete-based-on') ? 'COMPLETED' : 'IN_PROGRESS';
const pool = new pg.Pool({connectionString:process.env.DIRECT_URL || process.env.DATABASE_URL});
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const before = await client.query('SELECT id, title, status FROM "FeatureRequest" WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE', [[...completed,162]]);
  if (before.rowCount !== 10) throw new Error('Se esperaban las diez solicitudes revisadas.');
  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify({before:before.rows,completed,basedOnStatus}));
    await client.query('ROLLBACK');
  } else {
    await client.query('UPDATE "FeatureRequest" SET status = \'COMPLETED\', "updatedAt" = now() WHERE id = ANY($1::int[])', [completed]);
    await client.query('UPDATE "FeatureRequest" SET status = $1::"FeatureRequestStatus", "updatedAt" = now() WHERE id = 162', [basedOnStatus]);
    const after = await client.query('SELECT id, title, status FROM "FeatureRequest" WHERE id = ANY($1::int[]) ORDER BY id', [[...completed,162]]);
    await client.query('COMMIT');
    console.log(JSON.stringify({before:before.rows,after:after.rows}));
  }
} catch(error) {
  await client.query('ROLLBACK');
  throw error;
} finally {client.release(); await pool.end();}
