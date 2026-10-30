import pg from 'pg';
import fs from 'fs';
import path from 'path';

async function applyMigration003() {
  const pool = new pg.Pool({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });

  const sqlPath = path.resolve('supabase/migrations/003_cursor_pagination.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('[Migration 003] Applying cursor pagination schema and function...');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('[Migration 003] Applied successfully!');

    // Test get_taxa_cursor function
    const testRes = await client.query('SELECT * FROM public.get_taxa_cursor(5, NULL, NULL, NULL, NULL, NULL);');
    console.log(`[Migration 003] Test cursor query returned ${testRes.rows.length} rows.`);
    if (testRes.rows.length > 0) {
      console.log(`[Migration 003] First taxon: ${testRes.rows[0].scientific_name} (ID: ${testRes.rows[0].id})`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration003().catch(err => {
  console.error('[Migration 003] Failed:', err);
  process.exit(1);
});
