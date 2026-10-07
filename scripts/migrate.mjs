import pg from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'disable' ? false : undefined });
const dir = path.resolve('migrations');
await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
const applied = new Set((await pool.query('SELECT id FROM schema_migrations')).rows.map(r => r.id));
const files = (await fs.readdir(dir)).filter(f => f.endsWith('.sql')).sort();
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = await fs.readFile(path.join(dir, file), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(id) VALUES($1)', [file]);
    await client.query('COMMIT');
    console.log('Applied', file);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
}

// v0.17.665: ensure presentation inventory for the Sofia/Sofia demo shop on every start.
// Unlike one-time migrations, this safely retries if the shop was created after an earlier deploy.
const sofiaDemoSeedPath = path.resolve('scripts', 'ensure-sofia-demo.sql');
const sofiaDemoSeedSql = await fs.readFile(sofiaDemoSeedPath, 'utf8');
await pool.query(sofiaDemoSeedSql);
const sofiaDemoStatus = await pool.query(`
  SELECT s.id, s.name,
    (SELECT count(*)::int FROM equipment_rental_items r WHERE r.shop_id=s.id AND r.deleted_at IS NULL AND r.sku LIKE 'SOFIA-DEMO-R-%') AS rental_demo_count,
    (SELECT count(*)::int FROM equipment_sale_items x WHERE x.shop_id=s.id AND x.deleted_at IS NULL AND x.sku LIKE 'SOFIA-DEMO-S-%') AS sale_demo_count
  FROM equipment_rental_shops s
  WHERE s.name ILIKE '%صوفیا%' OR s.name ILIKE '%صوفيا%' OR s.name ILIKE '%سوفیا%' OR s.name ILIKE '%سوفيا%'
     OR s.name ILIKE '%sofia%' OR s.name ILIKE '%sophia%' OR s.slug ILIKE '%sofia%' OR s.slug ILIKE '%sophia%'
  ORDER BY s.created_at DESC LIMIT 1
`);
if (sofiaDemoStatus.rows[0]) {
  const row = sofiaDemoStatus.rows[0];
  console.log(`[sofia-demo] ${row.name}: rental=${row.rental_demo_count}, sale=${row.sale_demo_count}`);
} else {
  console.warn('[sofia-demo] shop not found yet; demo seed will retry on next startup');
}

await pool.end();
