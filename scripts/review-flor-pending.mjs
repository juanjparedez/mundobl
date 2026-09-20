import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({connectionString:process.env.DIRECT_URL || process.env.DATABASE_URL});
try {
  const series = await pool.query(`SELECT id, title, "basedOn", origin, visibility FROM "Series" WHERE lower(trim("basedOn")) IN ('gm','manga') ORDER BY "basedOn", title`);
  const feedback = await pool.query(`SELECT id, title, description, status FROM "FeatureRequest" WHERE id BETWEEN 156 AND 165 ORDER BY id`);
  console.log(JSON.stringify({series:series.rows,feedback:feedback.rows}));
} finally { await pool.end(); }
