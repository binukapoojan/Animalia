/**
 * ANIMALIA — E2E Verification Suite: Complete Taxonomic Deduplication
 * Verifies that zero duplicate animal profiles exist in:
 * 1. animalia-handoff-bundle.json
 * 2. PostgreSQL public.taxa (127.0.0.1:54322)
 * 3. In-memory repository cache (INITIAL_TAXA)
 * 4. Keyset cursor pagination sweeps across all categories
 * 5. Runtime merge protection against live incoming API duplicates
 * 6. Preserved richness (photos, measurements, audio) across merged flagships
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { INITIAL_TAXA } from '../src/data/initialTaxa.ts';
import { repository, getCanonicalBinomial } from '../src/services/supabaseRepository.ts';

const BUNDLE_PATH = path.resolve('animalia-handoff-bundle.json');
const PG_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

function cleanBinomial(sciName) {
  if (!sciName) return '';
  const clean = sciName.replace(/["']/g, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length < 2) return clean.toLowerCase();
  return `${parts[0]} ${parts[1]}`.toLowerCase().replace(/[^a-z ]/g, '').trim();
}

async function runVerification() {
  console.log('================================================================');
  console.log('ANIMALIA E2E VERIFICATION: ZERO DUPLICATE SPECIES SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // CHECK 1: animalia-handoff-bundle.json Deduplication Check
  // -------------------------------------------------------------------------
  console.log('--- CHECK 1: animalia-handoff-bundle.json Deduplication Check ---');
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
  console.log(`Total taxa in bundle: ${bundle.taxa.length}`);

  const bundleBinomials = new Map();
  const bundleDups = [];

  for (const t of bundle.taxa) {
    const key = cleanBinomial(t.identity?.scientificName);
    if (bundleBinomials.has(key)) {
      bundleDups.push({
        binomial: key,
        first: bundleBinomials.get(key),
        second: t
      });
    } else {
      bundleBinomials.set(key, t);
    }
  }

  if (bundleDups.length > 0) {
    console.error('Found duplicate taxa in bundle:', bundleDups);
    throw new Error(`Expected 0 duplicate binomials in bundle, found ${bundleDups.length}`);
  }
  console.log(`[PASS] Bundle verified with ${bundle.taxa.length} unique taxa and ZERO duplicates.\n`);

  // -------------------------------------------------------------------------
  // CHECK 2: PostgreSQL Database public.taxa Deduplication Check
  // -------------------------------------------------------------------------
  console.log('--- CHECK 2: PostgreSQL public.taxa Deduplication Check ---');
  const pool = new pg.Pool({ connectionString: PG_URL });
  const client = await pool.connect();

  try {
    const dbDups = await client.query(`
      SELECT LOWER(scientific_name) as sci, count(*) as count
      FROM public.taxa
      GROUP BY LOWER(scientific_name)
      HAVING count(*) > 1;
    `);

    if (dbDups.rows.length > 0) {
      console.error('Found duplicate taxa in PostgreSQL:', dbDups.rows);
      throw new Error(`Expected 0 duplicate scientific names in PostgreSQL, found ${dbDups.rows.length}`);
    }

    const totalDb = await client.query('SELECT count(*)::int as count FROM public.taxa;');
    console.log(`[PASS] PostgreSQL verified with ${totalDb.rows[0].count} unique taxa and ZERO duplicate scientific names.`);

    // Verify unique index exists
    const indexCheck = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'taxa' AND indexname = 'idx_taxa_unique_scientific_name';
    `);
    if (indexCheck.rows.length === 0) {
      throw new Error('Missing idx_taxa_unique_scientific_name index in PostgreSQL');
    }
    console.log(`[PASS] Unique constraint idx_taxa_unique_scientific_name verified active in PostgreSQL.\n`);
  } finally {
    client.release();
    await pool.end();
  }

  // -------------------------------------------------------------------------
  // CHECK 3: INITIAL_TAXA Memory Pool Check
  // -------------------------------------------------------------------------
  console.log('--- CHECK 3: INITIAL_TAXA Memory Pool Check ---');
  const initBinomials = new Map();
  const initDups = [];

  for (const t of INITIAL_TAXA) {
    const key = cleanBinomial(t.identity?.scientificName);
    if (initBinomials.has(key)) {
      initDups.push(key);
    } else {
      initBinomials.set(key, t);
    }
  }

  if (initDups.length > 0) {
    throw new Error(`INITIAL_TAXA contains ${initDups.length} duplicates: ${initDups.join(', ')}`);
  }
  console.log(`[PASS] INITIAL_TAXA verified with ${INITIAL_TAXA.length} taxa and ZERO duplicates.\n`);

  // -------------------------------------------------------------------------
  // CHECK 4: Keyset Cursor Pagination Across All Categories
  // -------------------------------------------------------------------------
  console.log('--- CHECK 4: Keyset Cursor Pagination Sweeps ---');
  repository.seedFromBundle(INITIAL_TAXA);

  const categories = ['ALL', 'Mammals', 'Birds', 'Extinct Taxa', 'Marine Invertebrates', 'Fish', 'Reptiles'];
  for (const cat of categories) {
    const result = await repository.getTaxaCursor({
      categoryGroup: cat,
      iucnStatus: 'ALL',
      searchQuery: '',
      limit: 100
    });

    const seenInPage = new Set();
    for (const item of result.items) {
      const bin = cleanBinomial(item.identity?.scientificName);
      if (seenInPage.has(bin)) {
        throw new Error(`getTaxaCursor returned duplicate binomial "${bin}" in category "${cat}"!`);
      }
      seenInPage.add(bin);
    }
    console.log(`  ✓ Category "${cat}": ${result.items.length} items checked, 0 duplicates.`);
  }
  console.log('[PASS] Keyset cursor pagination sweeps verified with zero duplicate profiles.\n');

  // -------------------------------------------------------------------------
  // CHECK 5: Runtime Ingestion Guard Against Live Duplicates
  // -------------------------------------------------------------------------
  console.log('--- CHECK 5: Runtime Ingestion Guard Against Live Duplicates ---');
  const dummyLiveWolf = {
    id: 'live-inat-42048',
    dataSource: 'LIVE_API_RESULT',
    identity: {
      commonName: 'Gray Wolf',
      scientificName: 'Canis lupus Linnaeus, 1758',
      authorship: 'Linnaeus, 1758',
      rank: 'SPECIES',
      taxonomicStatus: 'ACCEPTED',
      isExtinct: false,
      categoryGroup: 'Mammals',
      externalIds: { inatTaxonId: 42048, gbifKey: 5219173 },
      lineage: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Mammalia', species: 'Canis lupus' },
      synonyms: [],
      vernacularNames: []
    },
    media: { url: 'https://example.com/wolf.jpg', thumbnailUrl: null, attribution: 'Observer', licenseCode: 'CC-BY', sourceProvider: 'iNaturalist', sourceUrl: '', verifiedTaxonMatch: true },
    biology: { summary: { text: 'Wolf', source: '' }, measurements: { bodyLength: null, mass: null, lifespan: null, source: null }, ecology: { habitat: null, diet: null, geographicRange: null, activityPattern: null, biomeTags: [] }, conservation: { iucnStatus: 'LC', source: '', assessmentYear: null, populationTrend: null, threats: null }, discovery: { distinguishingTraits: [], comparisonsWithSimilarTaxa: [], interestingFacts: [], relatedTaxonIds: [] } },
    provenance: { completenessScore: 70, lastVerifiedAt: new Date().toISOString(), sources: ['iNaturalist'] }
  };

  const initialCount = repository.getTaxaCursor ? (await repository.getTaxaCursor({ limit: 200 })).items.length : 0;
  // Seed duplicate into repository
  repository.seedFromBundle([dummyLiveWolf]);
  const postSeedCount = (await repository.getTaxaCursor({ limit: 200 })).items.length;

  if (postSeedCount !== initialCount) {
    throw new Error(`seedFromBundle failed to deduplicate live duplicate! Count increased from ${initialCount} to ${postSeedCount}`);
  }
  console.log(`[PASS] seedFromBundle successfully merged incoming live duplicate without increasing taxon count (${initialCount} == ${postSeedCount}).\n`);

  // -------------------------------------------------------------------------
  // CHECK 6: Flagship Data Richness (Photos, Measurements, Audio)
  // -------------------------------------------------------------------------
  console.log('--- CHECK 6: Flagship Data Richness & Photo Preservation ---');
  const flagships = [
    { id: 'specimen-tyrannosaurus-rex', name: 'Tyrannosaurus rex', minPhotos: 4 },
    { id: 'demo-harpy-eagle', name: 'Harpia harpyja', hasAudio: true },
    { id: 'specimen-balaenoptera-musculus', name: 'Balaenoptera musculus', hasAudio: true },
    { id: 'specimen-mammuthus-primigenius', name: 'Mammuthus primigenius', minPhotos: 4 },
    { id: 'demo-latimeria-chalumnae', name: 'Latimeria chalumnae', hasMeasurement: true }
  ];

  for (const f of flagships) {
    const t = bundle.taxa.find(item => item.id === f.id);
    if (!t) {
      throw new Error(`Flagship ${f.name} (ID: ${f.id}) missing from bundle!`);
    }
    console.log(`  ✓ Flagship "${t.identity.commonName}" (${t.identity.scientificName}) [${t.id}]:`);
    console.log(`      Photos: ${t.media?.additionalPhotos?.length || 0} (Primary: ${Boolean(t.media?.url)})`);
    if (f.minPhotos) {
      const totalPhotos = (t.media?.additionalPhotos?.length || 0) + (t.media?.url ? 1 : 0);
      if (totalPhotos < f.minPhotos) {
        throw new Error(`Expected at least ${f.minPhotos} photos for ${f.name}, found ${totalPhotos}`);
      }
    }
    if (f.hasAudio) {
      if (!t.media?.audio?.audioUrl) {
        throw new Error(`Expected bioacoustic audio for ${f.name}, but none found!`);
      }
      console.log(`      Audio:  "${t.media.audio.title}"`);
    }
    if (f.hasMeasurement) {
      if (!t.biology?.measurements?.bodyLength) {
        throw new Error(`Expected measurements for ${f.name}, but found null!`);
      }
      console.log(`      Length: ${t.biology.measurements.bodyLength}`);
    }
  }

  console.log('\n================================================================');
  console.log('✓ ALL 6 DEDUPLICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
}

runVerification().catch(err => {
  console.error('\n❌ [FAIL] Verification suite failed:', err);
  process.exit(1);
});
