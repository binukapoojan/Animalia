import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

async function test() {
  const db = new PGlite();
  console.log('PGlite started');
  let sql = fs.readFileSync('supabase/migrations/001_animalia_biodiversity_backbone.sql', 'utf-8');
  
  // In PGlite/modern postgres, uuid_generate_v4() can be aliased to gen_random_uuid() if uuid-ossp extension is omitted
  try {
    await db.exec(sql);
    console.log('Migration executed successfully without changes!');
  } catch (err) {
    console.log('Direct migration note:', err.message);
    // If extensions are not present in WASM build, adapt gracefully
    const adapted = sql
      .replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/g, '')
      .replace(/CREATE EXTENSION IF NOT EXISTS "ltree";/g, '')
      .replace(/CREATE EXTENSION IF NOT EXISTS "pg_trgm";/g, '')
      .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()')
      .replace(/lineage_path ltree,/g, 'lineage_path TEXT,')
      .replace(/CREATE INDEX idx_taxa_scientific_trgm ON public.taxa USING GIN \(scientific_name gin_trgm_ops\);/g, 'CREATE INDEX idx_taxa_scientific ON public.taxa (scientific_name);')
      .replace(/CREATE INDEX idx_taxa_common_trgm ON public.taxa USING GIN \(common_name gin_trgm_ops\);/g, 'CREATE INDEX idx_taxa_common ON public.taxa (common_name);')
      .replace(/CREATE INDEX idx_taxa_lineage_gist ON public.taxa USING GIST \(lineage_path\);/g, 'CREATE INDEX idx_taxa_lineage ON public.taxa (lineage_path);')
      .replace(/CREATE INDEX idx_synonyms_name_trgm ON public.taxon_synonyms USING GIN \(synonym_scientific_name gin_trgm_ops\);/g, 'CREATE INDEX idx_synonyms_name ON public.taxon_synonyms (synonym_scientific_name);');
    
    await db.exec(adapted);
    console.log('Adapted migration executed successfully!');
  }

  const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
  console.log('Tables created:', tables.rows);
}

test().catch(console.error);
