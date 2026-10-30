import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' });

async function fixPostgresDuplicates() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find duplicates by scientific_name
    const dupsRes = await client.query(`
      SELECT scientific_name, array_agg(id ORDER BY created_at ASC) as ids
      FROM public.taxa
      GROUP BY scientific_name
      HAVING count(*) > 1;
    `);

    console.log(`Found ${dupsRes.rows.length} duplicate species in Postgres:`);

    for (const row of dupsRes.rows) {
      const keepId = row.ids[0];
      const removeIds = row.ids.slice(1);
      console.log(`\nFixing ${row.scientific_name}: keeping ${keepId}, removing [${removeIds.join(', ')}]`);

      for (const removeId of removeIds) {
        // Move media records
        await client.query(`
          UPDATE public.taxon_media
          SET taxon_id = $1
          WHERE taxon_id = $2
          AND image_url NOT IN (SELECT image_url FROM public.taxon_media WHERE taxon_id = $1);
        `, [keepId, removeId]);

        // Delete any remaining duplicate media
        await client.query(`DELETE FROM public.taxon_media WHERE taxon_id = $1;`, [removeId]);

        // Move collection taxa
        await client.query(`
          UPDATE public.collection_taxa
          SET taxon_id = $1
          WHERE taxon_id = $2
          AND collection_id NOT IN (SELECT collection_id FROM public.collection_taxa WHERE taxon_id = $1);
        `, [keepId, removeId]);
        await client.query(`DELETE FROM public.collection_taxa WHERE taxon_id = $1;`, [removeId]);

        // Move discovery history
        await client.query(`UPDATE public.discovery_history SET taxon_id = $1 WHERE taxon_id = $2;`, [keepId, removeId]);

        // Move quiz attempts
        await client.query(`UPDATE public.quiz_attempts SET taxon_id = $1 WHERE taxon_id = $2;`, [keepId, removeId]);

        // Delete duplicate taxon
        await client.query(`DELETE FROM public.taxa WHERE id = $1;`, [removeId]);
        console.log(`  ✓ Removed duplicate taxon ${removeId}`);
      }
    }

    // Add unique constraint on LOWER(scientific_name)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_taxa_unique_scientific_name ON public.taxa (LOWER(scientific_name));
    `);
    console.log(`\n✓ Unique index idx_taxa_unique_scientific_name created.`);

    await client.query('COMMIT');
    console.log('PostgreSQL deduplication committed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PostgreSQL deduplication failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

fixPostgresDuplicates().catch(console.error);
