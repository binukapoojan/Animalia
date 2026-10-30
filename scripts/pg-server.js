import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import fs from 'fs';
import path from 'path';

async function startServer() {
  const dbDir = path.resolve('.pgdata');
  const db = new PGlite(dbDir);
  await db.waitReady;
  console.log('[PGlite] Database engine initialized at', dbDir);

  // 1. Run Migration 001: Biodiversity Backbone
  const migration001Sql = fs.readFileSync('supabase/migrations/001_animalia_biodiversity_backbone.sql', 'utf-8');
  const adapted001 = migration001Sql
    .replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/g, '')
    .replace(/CREATE EXTENSION IF NOT EXISTS "ltree";/g, '')
    .replace(/CREATE EXTENSION IF NOT EXISTS "pg_trgm";/g, '')
    .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()')
    .replace(/lineage_path ltree,/g, 'lineage_path TEXT,')
    .replace(/CREATE INDEX idx_taxa_scientific_trgm ON public.taxa USING GIN \(scientific_name gin_trgm_ops\);/g, 'CREATE INDEX IF NOT EXISTS idx_taxa_scientific ON public.taxa (scientific_name);')
    .replace(/CREATE INDEX idx_taxa_common_trgm ON public.taxa USING GIN \(common_name gin_trgm_ops\);/g, 'CREATE INDEX IF NOT EXISTS idx_taxa_common ON public.taxa (common_name);')
    .replace(/CREATE INDEX idx_taxa_lineage_gist ON public.taxa USING GIST \(lineage_path\);/g, 'CREATE INDEX IF NOT EXISTS idx_taxa_lineage ON public.taxa (lineage_path);')
    .replace(/CREATE INDEX idx_synonyms_name_trgm ON public.taxon_synonyms USING GIN \(synonym_scientific_name gin_trgm_ops\);/g, 'CREATE INDEX IF NOT EXISTS idx_synonyms_name ON public.taxon_synonyms (synonym_scientific_name);');

  try {
    await db.exec(adapted001);
    console.log('[PGlite] Migration 001_animalia_biodiversity_backbone.sql applied.');
  } catch (err) {
    if (!err.message.includes('already exists')) {
      console.error('[PGlite] Migration 001 error:', err.message);
    }
  }

  // Ensure unique index for idempotent media upserts
  try {
    await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_taxon_media_taxon_url ON public.taxon_media(taxon_id, image_url);');
    await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_taxa_unique_scientific_name ON public.taxa (LOWER(scientific_name));');
  } catch (err) {}

  // 2. Run Migration 002: Engagement & Collections
  if (fs.existsSync('supabase/migrations/002_engagement_and_collections.sql')) {
    const migration002Sql = fs.readFileSync('supabase/migrations/002_engagement_and_collections.sql', 'utf-8');
    try {
      await db.exec(migration002Sql);
      console.log('[PGlite] Migration 002_engagement_and_collections.sql applied.');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.error('[PGlite] Migration 002 error:', err.message);
      }
    }
  }

  // 2b. Run Migration 003: Cursor Pagination
  if (fs.existsSync('supabase/migrations/003_cursor_pagination.sql')) {
    const migration003Sql = fs.readFileSync('supabase/migrations/003_cursor_pagination.sql', 'utf-8');
    try {
      await db.exec(migration003Sql);
      console.log('[PGlite] Migration 003_cursor_pagination.sql applied.');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.error('[PGlite] Migration 003 error:', err.message);
      }
    }
  }

  // 3. Seed initial verified reference taxa if table is empty
  const countRes = await db.query('SELECT count(*)::int as count FROM public.taxa;');
  const count = countRes.rows[0]?.count || 0;
  console.log(`[PGlite] Current taxa count in DB: ${count}`);

  if (count === 0 && fs.existsSync('animalia-handoff-bundle.json')) {
    console.log('[PGlite] Seeding reference taxa from animalia-handoff-bundle.json...');
    const bundleRaw = fs.readFileSync('animalia-handoff-bundle.json', 'utf-8');
    const bundle = JSON.parse(bundleRaw);
    const taxaList = bundle.taxa || [];

    for (const animal of taxaList) {
      const { id, identity, media, biology, provenance } = animal;
      const gbifKey = identity.externalIds?.gbifKey ? parseInt(identity.externalIds.gbifKey, 10) : null;
      const inatId = identity.externalIds?.inatTaxonId ? parseInt(identity.externalIds.inatTaxonId, 10) : null;
      const rank = (identity.rank || 'SPECIES').toUpperCase();
      const status = (identity.taxonomicStatus || 'ACCEPTED').toUpperCase();
      const iucn = biology.conservation?.iucnStatus || 'NE';
      const lineagePath = [
        identity.lineage?.kingdom,
        identity.lineage?.phylum,
        identity.lineage?.class,
        identity.lineage?.order,
        identity.lineage?.family,
        identity.lineage?.genus,
        identity.lineage?.species
      ].filter(Boolean).map(s => s.replace(/[^a-zA-Z0-9_]/g, '_')).join('.');

      // Insert Taxon
      const taxonInsertSql = `
        INSERT INTO public.taxa (
          gbif_usage_key, inat_taxon_id, scientific_name, authorship, common_name,
          rank, status, is_extinct, category_group, lineage_path, lineage_json,
          biology_profile, iucn_status, iucn_assessment_year, completeness_score
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6::taxonomic_rank, $7::taxonomic_status, $8, $9, $10, $11,
          $12, $13::iucn_red_list_code, $14, $15
        ) ON CONFLICT (gbif_usage_key) DO UPDATE SET
          scientific_name = EXCLUDED.scientific_name,
          common_name = EXCLUDED.common_name,
          biology_profile = EXCLUDED.biology_profile
        RETURNING id;
      `;

      try {
        const taxonRes = await db.query(taxonInsertSql, [
          gbifKey,
          inatId,
          identity.scientificName,
          identity.authorship || null,
          identity.commonName,
          rank,
          status,
          Boolean(identity.isExtinct),
          identity.categoryGroup,
          lineagePath,
          JSON.stringify(identity.lineage || {}),
          JSON.stringify(biology || {}),
          iucn,
          biology.conservation?.assessmentYear || null,
          provenance?.completenessScore || 95
        ]);

        const taxonDbId = taxonRes.rows[0]?.id;

        // Insert Synonyms
        if (identity.synonyms && identity.synonyms.length > 0 && taxonDbId) {
          for (const syn of identity.synonyms) {
            const synSql = `
              INSERT INTO public.taxon_synonyms (
                accepted_taxon_id, synonym_scientific_name, authorship, status, gbif_synonym_key
              ) VALUES ($1, $2, $3, $4::taxonomic_status, $5)
              ON CONFLICT (accepted_taxon_id, synonym_scientific_name) DO NOTHING;
            `;
            await db.query(synSql, [
              taxonDbId,
              syn.scientificName,
              syn.authorship || null,
              syn.status || 'SYNONYM',
              syn.gbifSynonymKey || null
            ]);
          }
        }

        // Insert Media
        if (media && media.url && taxonDbId) {
          const mediaSql = `
            INSERT INTO public.taxon_media (
              taxon_id, image_url, thumbnail_url, attribution, license_code,
              source_provider, source_url, is_primary, verified_taxon_match
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (taxon_id, image_url) DO UPDATE SET attribution = EXCLUDED.attribution;
          `;
          await db.query(mediaSql, [
            taxonDbId,
            media.url,
            media.thumbnailUrl || null,
            media.attribution || 'Wikimedia Commons',
            media.licenseCode || 'CC-BY-SA',
            media.sourceProvider || 'Wikimedia Commons',
            media.sourceUrl || media.url,
            true,
            Boolean(media.verifiedTaxonMatch)
          ]);
        }
      } catch (err) {
        console.warn(`[PGlite] Failed to insert taxon ${identity.scientificName}:`, err.message);
      }
    }

    const finalCount = await db.query('SELECT count(*)::int as count FROM public.taxa;');
    console.log(`[PGlite] Seeding complete! Total taxa in database: ${finalCount.rows[0]?.count}`);
  }

  // 4. Seed initial default collections if empty
  try {
    const colCountRes = await db.query('SELECT count(*)::int as count FROM public.user_collections;');
    if ((colCountRes.rows[0]?.count || 0) === 0) {
      console.log('[PGlite] Seeding curated user collections...');
      const colIns = await db.query(`
        INSERT INTO public.user_collections (name, description, icon_name)
        VALUES 
          ('Apex Predators', 'Global apex carnivores regulating trophic cascades across terrestrial & marine biomes.', 'Flame'),
          ('Living Fossils & Ancient Relicts', 'Evolutionary relicts exhibiting morphological stasis over geological epochs.', 'Hourglass'),
          ('Abyssal Zone & Deep Ocean Specialists', 'Fauna adapted to crushing hydrostatic pressures and eternal darkness.', 'Waves')
        RETURNING id, name;
      `);

      // Assign initial sample taxa to collections
      const taxaSamples = await db.query('SELECT id, scientific_name FROM public.taxa LIMIT 10;');
      for (const col of colIns.rows) {
        const sampleTaxon = taxaSamples.rows.find(t => 
          (col.name.includes('Apex') && (t.scientific_name.includes('Panthera') || t.scientific_name.includes('Balaeniceps'))) ||
          (col.name.includes('Fossil') && t.scientific_name.includes('Latimeria')) ||
          (col.name.includes('Abyssal') && t.scientific_name.includes('Architeuthis'))
        ) || taxaSamples.rows[0];

        if (sampleTaxon) {
          await db.query(`
            INSERT INTO public.collection_taxa (collection_id, taxon_id, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING;
          `, [col.id, sampleTaxon.id, `Featured reference specimen for ${col.name}`]);
        }
      }
      console.log('[PGlite] User collections seeded.');
    }
  } catch (err) {
    console.warn('[PGlite] Collection seeding warning:', err.message);
  }

  // 5. Start PostgreSQL Wire Socket Server on 127.0.0.1:54322
  const server = new PGLiteSocketServer({
    db,
    port: 54322,
    host: '127.0.0.1'
  });

  await server.start();
  console.log('[PGlite Server] Listening on 127.0.0.1:54322 for Postgres MCP connections.');

  const shutdown = async () => {
    console.log('[PGlite Server] Shutting down...');
    clearInterval(keepAlive);
    await server.stop();
    await db.close();
    process.exit(0);
  };

  const keepAlive = setInterval(() => {}, 1000 * 60 * 60);

  process.on('uncaughtException', (err) => {
    if (err?.code === 'ECONNRESET' || err?.message?.includes('ECONNRESET') || err?.message?.includes('socket')) {
      // Harmless client disconnect - keep server running
      return;
    }
    console.error('[PGlite Server] Uncaught exception:', err);
  });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch(err => {
  console.error('[PGlite Server] Startup error:', err);
  process.exit(1);
});
