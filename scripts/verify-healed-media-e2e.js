/**
 * ANIMALIA — Verified Media & Workflows End-to-End Suite
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { resolveVerifiedTaxonMedia } from '../src/services/mediaResolverService.ts';

async function runSuite() {
  console.log('===============================================================');
  console.log('ANIMALIA — MEDIA RESOLVER & WORKFLOW VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`[PASS] ${name} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // 1. Verify Workflow Files
  console.log('[1. Workflows Verification]');
  const fixMediaWorkflowPath = path.resolve('.agents/workflows/fix-media.md');
  const uxPolishWorkflowPath = path.resolve('.agents/workflows/ux-polish.md');

  assert(fs.existsSync(fixMediaWorkflowPath), 'fix-media.md exists in .agents/workflows/');
  if (fs.existsSync(fixMediaWorkflowPath)) {
    const content = fs.readFileSync(fixMediaWorkflowPath, 'utf-8');
    assert(content.includes('name: fix-media'), 'fix-media.md has valid name frontmatter');
    assert(content.includes('api.inaturalist.org'), 'fix-media.md references iNaturalist API');
    assert(content.includes('en.wikipedia.org'), 'fix-media.md references Wikipedia API');
  }

  assert(fs.existsSync(uxPolishWorkflowPath), 'ux-polish.md exists in .agents/workflows/');
  if (fs.existsSync(uxPolishWorkflowPath)) {
    const content = fs.readFileSync(uxPolishWorkflowPath, 'utf-8');
    assert(content.includes('name: ux-polish'), 'ux-polish.md has valid name frontmatter');
    assert(content.includes('naturalWidth > 0'), 'ux-polish.md specifies naturalWidth audit');
    assert(content.includes('1440'), 'ux-polish.md specifies responsive viewports');
  }

  // 2. Component Integration Verification
  console.log('\n[2. Component Refactoring & SmartTaxonImage]');
  const smartImageFile = path.resolve('src/components/common/SmartTaxonImage.tsx');
  assert(fs.existsSync(smartImageFile), 'SmartTaxonImage.tsx created');
  if (fs.existsSync(smartImageFile)) {
    const content = fs.readFileSync(smartImageFile, 'utf-8');
    assert(content.includes('referrerPolicy="no-referrer"'), 'SmartTaxonImage uses referrerPolicy="no-referrer"');
    assert(!content.includes('crossOrigin="anonymous"'), 'SmartTaxonImage avoids hardcoded crossOrigin="anonymous"');
    assert(content.includes('onMediaResolved'), 'SmartTaxonImage supports onMediaResolved callback');
    assert(content.includes('TaxonomicSilhouette'), 'SmartTaxonImage falls back to TaxonomicSilhouette');
    assert(content.includes('animate-pulse'), 'SmartTaxonImage renders botanical shimmer skeleton');
  }

  const animalCardFile = fs.readFileSync('src/components/discovery/AnimalCard.tsx', 'utf-8');
  assert(animalCardFile.includes('SmartTaxonImage'), 'AnimalCard.tsx uses SmartTaxonImage');
  assert(animalCardFile.includes('onMediaResolved'), 'AnimalCard.tsx wires onMediaResolved for attribution');

  const exploreSectionFile = fs.readFileSync('src/components/discovery/ExploreSection.tsx', 'utf-8');
  assert(exploreSectionFile.includes('SmartTaxonImage'), 'ExploreSection.tsx uses SmartTaxonImage in ledger view');

  const profileModalFile = fs.readFileSync('src/components/profile/AnimalProfileModal.tsx', 'utf-8');
  assert(profileModalFile.includes('SmartTaxonImage'), 'AnimalProfileModal.tsx uses SmartTaxonImage');
  assert(profileModalFile.includes('onMediaResolved'), 'AnimalProfileModal.tsx wires onMediaResolved callback');

  const comparisonMatrixFile = fs.readFileSync('src/components/compare/ComparisonMatrix.tsx', 'utf-8');
  assert(comparisonMatrixFile.includes('SmartTaxonImage'), 'ComparisonMatrix.tsx uses SmartTaxonImage');

  // 3. Database Records in PostgreSQL
  console.log('\n[3. PostgreSQL Database Audit on 127.0.0.1:54322]');
  const client = new pg.Client({ host: '127.0.0.1', port: 54322, database: 'postgres' });
  try {
    await client.connect();
    const dbRes = await client.query(`
      SELECT count(*) as total_taxa,
             count(tm.id) as total_media,
             count(CASE WHEN tm.image_url LIKE '%inaturalist%' THEN 1 END) as inat_count
      FROM public.taxa t
      LEFT JOIN public.taxon_media tm ON tm.taxon_id = t.id AND tm.is_primary = true;
    `);
    const stats = dbRes.rows[0];
    assert(parseInt(stats.total_taxa, 10) >= 140, 'Database has complete taxa backbone', `${stats.total_taxa} rows`);
    assert(parseInt(stats.inat_count, 10) >= 140, 'Database has verified iNaturalist CDN photography', `${stats.inat_count} verified`);
    await client.end();
  } catch (err) {
    assert(false, 'Database Connection', err.message);
  }

  // 4. Sample Verification of Seed Bundle URLs
  console.log('\n[4. Seed Bundle & URL Health Audit]');
  const bundle = JSON.parse(fs.readFileSync('animalia-handoff-bundle.json', 'utf-8'));
  const sampleTaxa = bundle.taxa.slice(0, 20);
  let sampleOk = 0;
  for (const t of sampleTaxa) {
    if (t.media?.url) {
      try {
        const res = await fetch(t.media.url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'AnimaliaTest/1.0' },
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          sampleOk++;
        } else {
          const getRes = await fetch(t.media.url, {
            headers: { 'User-Agent': 'AnimaliaTest/1.0', Range: 'bytes=0-10' },
            signal: AbortSignal.timeout(6000)
          });
          if (getRes.ok) sampleOk++;
        }
      } catch {
        try {
          const getRes = await fetch(t.media.url, {
            headers: { 'User-Agent': 'AnimaliaTest/1.0', Range: 'bytes=0-10' },
            signal: AbortSignal.timeout(6000)
          });
          if (getRes.ok) sampleOk++;
        } catch {}
      }
    }
  }
  assert(sampleOk >= 18, 'Sample bundle wildlife image URLs respond HTTP 200', `${sampleOk}/${sampleTaxa.length} healthy`);

  // 5. Test Live Self-Healing Resolver
  console.log('\n[5. Live Self-Healing Engine Test]');
  try {
    const healed = await resolveVerifiedTaxonMedia({
      scientificName: 'Panthera tigris',
      inatTaxonId: 41968
    });
    assert(Boolean(healed?.url), 'mediaResolverService resolves live iNaturalist photo', healed?.url);
    assert(Boolean(healed?.attribution), 'mediaResolverService extracts attribution', healed?.attribution);
    assert(Boolean(healed?.licenseCode), 'mediaResolverService extracts CC license', healed?.licenseCode);
  } catch (err) {
    assert(false, 'Live Self-Healing Engine', err.message);
  }

  console.log('\n===============================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
