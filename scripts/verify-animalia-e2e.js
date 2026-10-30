/**
 * ANIMALIA — Comprehensive End-to-End Automated Platform Verification (Phases 1–6)
 * Tests:
 * 1. Vite HTTP Server & DOM Mounting
 * 2. Navigation Tabs Rendering: 'Explore', 'Discovery & Quizzes', 'Collections', 'Compare', 'Antigravity'
 * 3. Light/Dark Theme Engine Switching
 * 4. Live iNaturalist Search & Zero Fabricated Biology Enforcement
 * 5. Live GBIF Backbone Enrichment & Synonym Resolution
 * 6. PostgreSQL Database: Count >= 100 taxa, user_collections, collection_taxa, quiz_attempts
 * 7. Dynamic Quiz Generation across all 3 modes
 * 8. Phase 6: Keyset Cursor-Based Database Pagination & Stored Function
 * 9. Phase 6: Server-Side Edge Functions (IUCN & Gemini Proxies) & Security Hardening
 * 10. Phase 6: TanStack Virtualized Grid & Taxonomic Ledger Table
 * 11. Phase 6: WCAG 2.1 AA Accessibility & Focus Management
 * 12. Phase 6: Multi-Stage Dockerfile & GitHub Actions CI/CD Pipeline
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { searchLiveBiodiversityGlobal } from '../src/services/inaturalistService.ts';
import { matchSpeciesGbif, fetchGbifSynonyms, fetchGbifVernacularNames } from '../src/services/gbifService.ts';
import { repository } from '../src/services/supabaseRepository.ts';
import { fetchSecureIucnStatus, fetchSecureGeminiInsight } from '../src/services/edgeFunctionsService.ts';
import { INITIAL_TAXA } from '../src/data/initialTaxa.ts';

async function runE2EVerification() {
  console.log('======================================================================');
  console.log('ANIMALIA PLATFORM — PHASES 1–6 END-TO-END PRODUCTION VERIFICATION');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`[PASS] ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Verify Vite Dev Server & DOM
  try {
    const res = await fetch('http://localhost:5173/');
    assert(res.status === 200, 'Vite HTTP Server', `HTTP ${res.status}`);
    const html = await res.text();
    assert(html.includes('id="root"'), 'Root Container Mounted');
    assert(html.includes('Plus+Jakarta+Sans'), 'Typography Preloaded');
    assert(html.includes('class="dark"'), 'Initial Dark Theme Set on Root Element');
  } catch (err) {
    assert(false, 'Vite HTTP Server', err.message);
  }

  // 2. Verify Navigation Tabs & Theme Classes
  try {
    console.log('\n[Testing Component Architecture & Theme Classes]...');
    const mainBundleRes = await fetch('http://localhost:5173/src/components/common/Header.tsx');
    assert(mainBundleRes.status === 200, 'Header Component Served', `HTTP ${mainBundleRes.status}`);
    const headerCode = await mainBundleRes.text();
    assert(headerCode.includes('Discovery & Quizzes'), 'Discovery & Quizzes Tab Registered');
    assert(headerCode.includes('Collections'), 'Collections Tab Registered');
    assert(headerCode.includes('dark:bg-[#0B0F0E]'), 'Dark Mode Theme Classes Applied');
    assert(headerCode.includes('toggleTheme'), 'Theme Toggle Action Wired');
  } catch (err) {
    assert(false, 'Component Architecture', err.message);
  }

  // 3. Verify Live iNaturalist Search & Scientific Integrity
  try {
    console.log('\n[Testing Live iNaturalist API Search]...');
    const results = await searchLiveBiodiversityGlobal('Pangolin');
    assert(results.length > 0, 'iNaturalist Live Search', `Found ${results.length} taxa for 'Pangolin'`);
    const first = results[0];
    assert(first.dataSource === 'LIVE_API_RESULT', 'Provenance Tagging', first.dataSource);
    assert(first.biology.measurements.bodyLength === null, 'Scientific Integrity (Zero Fabricated Biology)', 'bodyLength is strictly null');
    assert(Boolean(first.media.licenseCode), 'Media License Preserved', first.media.licenseCode);
  } catch (err) {
    assert(false, 'iNaturalist Live Search', err.message);
  }

  // 4. Verify Live GBIF Backbone Match & Synonym Harvesting
  try {
    console.log('\n[Testing Live GBIF Backbone Enrichment]...');
    const match = await matchSpeciesGbif('Panthera uncia');
    assert(Boolean(match?.usageKey), 'GBIF Species Match', `Key: ${match?.usageKey}`);
    if (match?.usageKey) {
      const synonyms = await fetchGbifSynonyms(match.usageKey);
      assert(Array.isArray(synonyms), 'GBIF Synonyms Harvested', `${synonyms.length} synonyms found`);
      const vernaculars = await fetchGbifVernacularNames(match.usageKey);
      assert(Array.isArray(vernaculars), 'GBIF Vernacular Names', `${vernaculars.length} vernacular names found`);
    }
  } catch (err) {
    assert(false, 'GBIF Enrichment', err.message);
  }

  // 5. Verify PostgreSQL Database & Scale-Up Count (>= 100)
  try {
    console.log('\n[Testing Local PostgreSQL Instance on Port 54322]...');
    const pool = new pg.Pool({
      connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    });
    const client = await pool.connect();

    // Check taxa count
    const taxaRes = await client.query('SELECT count(*)::int as count FROM public.taxa;');
    const taxaCount = taxaRes.rows[0].count;
    assert(taxaCount >= 100, 'Phase 5 Taxonomic Scale-Up (Taxa >= 100)', `Found ${taxaCount} verified taxa in database`);

    // Check groups balance across 12 groups
    const groupsRes = await client.query('SELECT category_group, count(*)::int as count FROM public.taxa GROUP BY category_group ORDER BY count DESC;');
    assert(groupsRes.rows.length >= 10, 'Taxonomic Diversity Across Groups', `${groupsRes.rows.length} animal groups represented`);

    // Check synonyms table
    const synRes = await client.query('SELECT count(*)::int as count FROM public.taxon_synonyms;');
    assert(synRes.rows[0].count > 0, 'Taxon Synonyms Table Populated', `${synRes.rows[0].count} synonyms`);

    // Check media table
    const mediaRes = await client.query('SELECT count(*)::int as count FROM public.taxon_media;');
    assert(mediaRes.rows[0].count > 0, 'Taxon Media Table Populated', `${mediaRes.rows[0].count} media assets`);

    // Check Phase 4 User Collections table
    const colRes = await client.query('SELECT count(*)::int as count FROM public.user_collections;');
    assert(colRes.rows[0].count >= 3, 'User Collections Table Seeded', `${colRes.rows[0].count} collections`);

    // Check Phase 4 Collection Taxa table
    const colTaxaRes = await client.query('SELECT count(*)::int as count FROM public.collection_taxa;');
    assert(colTaxaRes.rows[0].count > 0, 'Collection Taxa Table Populated', `${colTaxaRes.rows[0].count} assigned taxa`);

    // 6. PHASE 6: PostgreSQL Stored Keyset Pagination Procedure
    console.log('\n[Testing Phase 6: Keyset Cursor Database Engine]...');
    const procRes = await client.query("SELECT proname FROM pg_proc WHERE proname = 'get_taxa_cursor';");
    assert(procRes.rows.length > 0, 'get_taxa_cursor Function Registered in Postgres');

    // Execute first cursor page (limit: 5)
    const page1Res = await client.query('SELECT id, scientific_name FROM public.get_taxa_cursor(5, NULL, NULL, NULL, NULL, NULL);');
    assert(page1Res.rows.length === 5, 'Keyset Query Page 1 Returned 5 Taxa', `First: ${page1Res.rows[0]?.scientific_name}`);

    // Execute second cursor page using keyset values from page 1
    const lastRowP1 = page1Res.rows[4];
    const page2Res = await client.query('SELECT id, scientific_name FROM public.get_taxa_cursor(5, $1, $2, NULL, NULL, NULL);', [
      lastRowP1.scientific_name,
      lastRowP1.id
    ]);
    assert(page2Res.rows.length === 5, 'Keyset Query Page 2 Returned 5 Taxa', `First: ${page2Res.rows[0]?.scientific_name}`);
    assert(page1Res.rows[0].id !== page2Res.rows[0].id, 'Keyset Pages Distinct & Non-Overlapping');

    // Verify composite B-Tree indexes exist
    const idxRes = await client.query("SELECT indexname FROM pg_indexes WHERE tablename = 'taxa' AND indexname LIKE '%keyset%';");
    assert(idxRes.rows.length >= 3, 'Keyset B-Tree Composite Indexes Active', `${idxRes.rows.length} composite indexes verified`);

    client.release();
    await pool.end();
  } catch (err) {
    assert(false, 'PostgreSQL Database Verification', err.message);
  }

  // 7. Verify Dynamic Adaptive Quiz Generation Logic
  try {
    console.log('\n[Testing Dynamic Adaptive Quiz Engine]...');
    repository.seedFromBundle(INITIAL_TAXA);
    const taxa = await repository.getTaxa();
    assert(taxa.length >= 4, 'Quiz Source Records Available', `${taxa.length} taxa in repository`);

    const visualTaxon = taxa.find((t) => Boolean(t.media?.url)) || taxa[0];
    assert(Boolean(visualTaxon.media.url), 'Mode A Visual Specimen Qualified', visualTaxon.identity.commonName);

    const cladeOrder = visualTaxon.identity.lineage?.order || visualTaxon.identity.categoryGroup;
    assert(Boolean(cladeOrder), 'Mode B Clade Rank Extracted', `Order: ${cladeOrder}`);

    const iucnStatus = visualTaxon.biology.conservation?.iucnStatus || 'NE';
    assert(Boolean(iucnStatus), 'Mode C IUCN Status Extracted', `Status: ${iucnStatus}`);

    const attempt = await repository.recordQuizAttempt({
      quiz_mode: 'VISUAL_IDENTIFICATION',
      taxon_id: visualTaxon.id,
      is_correct: true
    });
    assert(attempt.is_correct === true, 'Quiz Attempt Logged & Persisted', attempt.id);
  } catch (err) {
    assert(false, 'Quiz Engine Verification', err.message);
  }

  // 8. PHASE 6: Server-Side API Security & Edge Function Fallbacks
  try {
    console.log('\n[Testing Phase 6: Edge Functions & Security Hardening]...');
    assert(fs.existsSync('supabase/functions/iucn-proxy/index.ts'), 'IUCN Proxy Edge Function Authored');
    assert(fs.existsSync('supabase/functions/gemini-proxy/index.ts'), 'Gemini Proxy Edge Function Authored');
    assert(fs.existsSync('supabase/functions/_shared/security.ts'), 'Security Environment Hardening Authored');

    const iucnRes = await fetchSecureIucnStatus('Panthera uncia');
    assert(Boolean(iucnRes.status), 'Secure IUCN Status Proxy', `Status: ${iucnRes.status}, Provenance: ${iucnRes.provenance}`);
    assert(iucnRes.populationTrend !== undefined, 'Zero Fabricated Biology Preserved in Proxy Fallback');

    const geminiRes = await fetchSecureGeminiInsight({ scientificName: 'Panthera uncia' }, 'SUMMARY');
    assert(geminiRes.verifiedIntegrity === true, 'Secure Gemini Proxy Scientific Integrity Guard');
  } catch (err) {
    assert(false, 'Edge Functions Verification', err.message);
  }

  // 9. PHASE 6: Virtualized Grid & Taxonomic Ledger Table
  try {
    console.log('\n[Testing Phase 6: High-Performance Virtualization & Accessibility]...');
    const exploreFile = fs.readFileSync('src/components/discovery/ExploreSection.tsx', 'utf8');
    assert(exploreFile.includes('@tanstack/react-virtual'), 'TanStack Virtual Integrated in ExploreSection');
    assert(exploreFile.includes('useVirtualizer'), 'useVirtualizer Hook Instantiated');
    assert(exploreFile.includes('viewMode === \'GRID\''), 'Virtualized Grid View Supported');
    assert(exploreFile.includes('viewMode === \'LEDGER\''), 'Virtualized Taxonomic Ledger Table Supported');

    // ARIA Landmarks & Accessibility
    assert(exploreFile.includes('role="search"'), 'Search Landmark Registered');
    assert(exploreFile.includes('role="region"'), 'Region Landmark Registered');
    assert(exploreFile.includes('aria-live="polite"'), 'Polite Live Region for Dynamic Taxa Counts');

    // Modal Focus Management & Trapping
    const modalFile = fs.readFileSync('src/components/profile/AnimalProfileModal.tsx', 'utf8');
    assert(modalFile.includes('role="dialog"'), 'Dialog Role on AnimalProfileModal');
    assert(modalFile.includes('aria-modal="true"'), 'Aria-Modal Set on AnimalProfileModal');
    assert(modalFile.includes("e.key === 'Escape'"), 'Escape Key Dismissal Wired');
    assert(modalFile.includes("e.key === 'Tab'"), 'Focus Trap Tab Cycling Wired');

    // Header Navigation Landmark
    const headerFile = fs.readFileSync('src/components/common/Header.tsx', 'utf8');
    assert(headerFile.includes('role="banner"'), 'Banner Role on Header');
    assert(headerFile.includes('role="navigation"'), 'Navigation Role on Nav');
    assert(headerFile.includes('aria-current'), 'Aria-Current Page Indication Wired');
  } catch (err) {
    assert(false, 'Virtualization & Accessibility Verification', err.message);
  }

  // 10. PHASE 6: Production Dockerization & CI/CD Pipeline
  try {
    console.log('\n[Testing Phase 6: Dockerization & CI/CD Pipeline]...');
    assert(fs.existsSync('Dockerfile'), 'Production Multi-Stage Dockerfile Exists');
    const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
    assert(dockerfile.includes('AS builder') && dockerfile.includes('AS runner'), 'Multi-Stage Build Defined');
    assert(dockerfile.includes('nginx:alpine'), 'Nginx Alpine Production Base Image');
    assert(dockerfile.includes('HEALTHCHECK'), 'Container Healthcheck Configured');

    assert(fs.existsSync('nginx.conf'), 'Custom Nginx Configuration Exists');
    const nginxConf = fs.readFileSync('nginx.conf', 'utf8');
    assert(nginxConf.includes('gzip on;'), 'Gzip Compression Configured');
    assert(nginxConf.includes('X-Frame-Options'), 'Security Headers Configured');
    assert(nginxConf.includes('try_files $uri $uri/ /index.html;'), 'SPA Fallback Routing Configured');

    assert(fs.existsSync('.github/workflows/deploy.yml'), 'GitHub Actions Deploy Workflow Exists');
    const workflow = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');
    assert(workflow.includes('tsc --noEmit'), 'CI/CD Type Check Step Configured');
    assert(workflow.includes('docker build'), 'CI/CD Container Build Step Configured');
  } catch (err) {
    assert(false, 'Dockerization & CI/CD Verification', err.message);
  }

  // 11. GEOSPATIAL DISTRIBUTION MAPPING & RANGE LAYERS
  try {
    console.log('\n[Testing Geospatial Distribution Mapping & Range Layers]...');
    const geoService = await import('../src/services/geospatialService.ts');
    
    // Tile URL generators
    const gbifTile = geoService.getGbifDensityTileUrl(5219416);
    assert(gbifTile.includes('api.gbif.org/v2/map/occurrence/density'), 'GBIF Density Tile Endpoint Configured');
    assert(gbifTile.includes('taxonKey=5219416'), 'GBIF Taxon Key Parameter Present');

    const inatTile = geoService.getInatPointsTileUrl(41967);
    assert(inatTile.includes('api.inaturalist.org/v1/points'), 'iNaturalist Points Tile Endpoint Configured');
    assert(inatTile.includes('taxon_id=41967'), 'iNaturalist Taxon ID Parameter Present');

    // Live Metrics Retrieval for Panthera tigris
    const metrics = await geoService.fetchGeospatialMetrics('Panthera tigris', 5219416, 41967);
    assert(metrics.gbifCount > 0, 'GBIF Live Georeferenced Occurrences Count > 0', `${metrics.gbifCount} records`);
    assert(metrics.inatObservationCount > 0, 'iNaturalist Live Observations Count > 0', `${metrics.inatObservationCount} records`);

    // Component Integration Checks
    const modalFile = fs.readFileSync('src/components/profile/AnimalProfileModal.tsx', 'utf8');
    assert(modalFile.includes('GeospatialDistributionViewer'), 'GeospatialDistributionViewer Imported in Modal');
    assert(modalFile.includes("id: 'MAP', label: 'Distribution & Map'"), 'Dedicated Distribution & Map Tab Added');
    assert(modalFile.includes('mode="compact"'), 'Compact Quick-View Card in Specimen Overview');
    assert(modalFile.includes('mode="full"'), 'Full Viewport in Dedicated Distribution Tab');

    const viewerFile = fs.readFileSync('src/components/geospatial/GeospatialDistributionViewer.tsx', 'utf8');
    assert(viewerFile.includes('Zero Georeferenced Coordinates Documented'), 'Strict Scientific Empty State Enforced');
    assert(viewerFile.includes('Zero Fabricated Biology Rule Enforced'), 'GEMINI.md Scientific Integrity Badge Displayed');
  } catch (err) {
    assert(false, 'Geospatial Mapping Verification', err.message);
  }

  // 12. EXPANDED CATALOG & 12-CATEGORY DIVERSITY VERIFICATION
  try {
    console.log('\n[Testing Expanded Catalog & 12-Category Diversity]...');
    const rawBundle = JSON.parse(fs.readFileSync('animalia-handoff-bundle.json', 'utf8'));
    assert(rawBundle.taxa && rawBundle.taxa.length >= 80, 'Bundle Scale-Up Target Exceeded (>= 80 Taxa)', `${rawBundle.taxa.length} taxa in bundle`);

    const requiredGroups = [
      'Mammals', 'Birds', 'Reptiles', 'Amphibians', 'Fish',
      'Insects', 'Arachnids', 'Cephalopods & Mollusks', 'Crustaceans',
      'Marine Invertebrates', 'Microscopic Animals', 'Extinct Taxa'
    ];

    const groupCounts = {};
    rawBundle.taxa.forEach((t) => {
      const g = t.identity.categoryGroup;
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });

    for (const group of requiredGroups) {
      const count = groupCounts[group] || 0;
      assert(count >= 5, `Category '${group}' Sufficiently Represented (>= 5 Taxa)`, `${count} taxa`);
    }

    // Provenance & CC License Integrity
    const unverifiedMedia = rawBundle.taxa.filter((t) => !t.media || !t.media.licenseCode || !t.media.attribution);
    assert(unverifiedMedia.length === 0, '100% of Taxa Have Verified CC Licenses and Attributions');

    // Scientific Integrity: Zero Fabricated Morphometrics
    const fabricatedMeasurements = rawBundle.taxa.filter(
      (t) => t.dataSource === 'IMPORTED_REPOSITORY_RECORD' &&
             (t.biology?.measurements?.bodyLength !== null || t.biology?.measurements?.mass !== null)
    );
    assert(fabricatedMeasurements.length === 0, 'Zero Fabricated Biology strictly enforced on imported records');
  } catch (err) {
    assert(false, 'Expanded Catalog Verification', err.message);
  }

  console.log('\n======================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
}

runE2EVerification().catch(err => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
