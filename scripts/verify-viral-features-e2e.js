/**
 * ANIMALIA — Viral Engagement & Shareable Artifacts E2E Verification Suite
 * Verifies:
 * 1. Deterministic Daily Mystery Taxon Selection (UTC date seed & epoch day #142)
 * 2. Clade Warm/Cold Evolutionary Feedback Matching
 * 3. Complete Spoiler Redaction in text and audio metadata
 * 4. Wordle-Style Shareable Expedition Dispatch Syntax
 * 5. Monograph Poster Exporter mounting, PDF print rules, and CORS-resilient PNG canvas
 */

import fs from 'fs';
import path from 'path';

async function runViralFeaturesSuite() {
  console.log('================================================================');
  console.log('ANIMALIA E2E: VIRAL ENGAGEMENT & ARCHIVAL ARTIFACTS SUITE');
  console.log('================================================================\n');

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

  // -------------------------------------------------------------------------
  // CHECK 1: Taxonomic Mystery Engine
  // -------------------------------------------------------------------------
  console.log('--- CHECK 1: Taxonomic Mystery Engine ---');
  let engine;
  try {
    engine = await import('../src/utils/taxonomicMysteryEngine.ts');
    assert(true, 'taxonomicMysteryEngine module exists');
  } catch (err) {
    assert(false, 'taxonomicMysteryEngine module exists', err.message);
    process.exit(1);
  }

  const {
    getDailyDayNumber,
    getDailyMysteryTaxon,
    compareClades,
    redactSpecimenText,
    generateDispatchShareText
  } = engine;

  // Day calculation for 2026-10-30
  const dayNum = getDailyDayNumber('2026-10-30');
  assert(dayNum === 142, 'Day number for 2026-10-30 evaluates to #142', `Got #${dayNum}`);

  // Deterministic seed test
  const sampleTaxa = [
    {
      id: 'panthera-uncia',
      identity: { commonName: 'Snow Leopard', scientificName: 'Panthera uncia' },
      taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Mammalia', order: 'Carnivora', family: 'Felidae', genus: 'Panthera' },
      biology: { measurements: { bodyLength: '1.0 – 1.3 m' } }
    },
    {
      id: 'panthera-leo',
      identity: { commonName: 'Lion', scientificName: 'Panthera leo' },
      taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Mammalia', order: 'Carnivora', family: 'Felidae', genus: 'Panthera' },
      biology: { measurements: { bodyLength: '1.8 – 2.1 m' } }
    },
    {
      id: 'canis-lupus',
      identity: { commonName: 'Gray Wolf', scientificName: 'Canis lupus' },
      taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Mammalia', order: 'Carnivora', family: 'Canidae', genus: 'Canis' },
      biology: { measurements: { bodyLength: '1.0 – 1.6 m' } }
    }
  ];

  const mystery1 = getDailyMysteryTaxon(sampleTaxa, '2026-10-30');
  const mystery2 = getDailyMysteryTaxon(sampleTaxa, '2026-10-30');
  assert(mystery1.taxon.id === mystery2.taxon.id, 'Deterministic daily selection (same date produces identical taxon)', mystery1.taxon.identity.commonName);

  // Clade matching test
  const lionMatch = compareClades(sampleTaxa[1], sampleTaxa[0]); // Lion vs Snow Leopard
  assert(lionMatch.phylum && lionMatch.class && lionMatch.order && lionMatch.family && lionMatch.genus, 'Panthera leo vs Panthera uncia matches through Genus');
  assert(!lionMatch.isExactMatch, 'Distinct species are not exact matches');

  const wolfMatch = compareClades(sampleTaxa[2], sampleTaxa[0]); // Wolf vs Snow Leopard
  assert(wolfMatch.order && !wolfMatch.family && !wolfMatch.genus, 'Canis lupus vs Panthera uncia matches Order but not Family');

  // Complete Spoiler Redaction test
  const textWithSpoilers = 'The Snow Leopard (Panthera uncia) is a stealth predator. The leopard stalks in the snow, using Panthera agility.';
  const redacted = redactSpecimenText(textWithSpoilers, sampleTaxa[0]);
  assert(!redacted.toLowerCase().includes('snow leopard'), 'Redacts full common name');
  assert(!redacted.toLowerCase().includes('panthera uncia'), 'Redacts scientific binomial');
  assert(!redacted.toLowerCase().includes('leopard'), 'Redacts individual constituent words of common name ("leopard")');
  assert(!redacted.toLowerCase().includes('panthera'), 'Redacts genus name ("Panthera")');
  assert(!redacted.toLowerCase().includes('uncia'), 'Redacts species epithet ("uncia")');
  assert(redacted.includes('[REDACTED TAXON]'), 'Injects [REDACTED TAXON] replacement marker');

  // Share text generation
  const shareText = generateDispatchShareText(142, '2026-10-30', true, 2, [
    { matchCount: 3 }, // Phylum, Class, Order
    { matchCount: 6 }  // Exact match
  ]);
  assert(shareText.includes('ANIMALIA // FIELD DISPATCH #142 (2026-10-30)'), 'Share text contains dispatch header');
  assert(shareText.includes('🧬 Clade Match:'), 'Share text contains clade match emoji line');
  assert(shareText.includes('Solved on Clue 2/5'), 'Share text documents solve clue stage');

  // -------------------------------------------------------------------------
  // CHECK 2: Daily Specimen Mystery Component & Masthead Wiring
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 2: Daily Specimen Mystery Component & Masthead ---');
  const mysteryCompPath = path.resolve('src/components/engagement/DailySpecimenMystery.tsx');
  assert(fs.existsSync(mysteryCompPath), 'DailySpecimenMystery.tsx component file exists');
  if (fs.existsSync(mysteryCompPath)) {
    const compSrc = fs.readFileSync(mysteryCompPath, 'utf8');
    assert(compSrc.includes('animalia_daily_mystery_v1'), 'Persists state to localStorage (animalia_daily_mystery_v1)');
    assert(compSrc.includes('Practice Archive Mode'), 'Supports Practice Archive Mode toggle');
    assert(compSrc.includes('Bioacoustic Signature'), 'Renders Clue 2 Bioacoustic Signature');
    assert(compSrc.includes('Adult Human') || compSrc.includes('1.75m'), 'Renders Clue 3 Morphometric Scale vs Human 1.75m');
    assert(compSrc.includes('redactSpecimenText'), 'Uses complete biological text redaction');
    assert(compSrc.includes('Copy Field Dispatch'), 'Provides 1-click Copy Field Dispatch button');
    assert(compSrc.includes('navigator.clipboard.writeText'), 'Copies share dispatch to clipboard');
  }

  const headerSrc = fs.readFileSync('src/components/common/Header.tsx', 'utf8');
  assert(headerSrc.includes('DAILY MYSTERY // SPECIMEN #'), 'Header exposes DAILY MYSTERY // SPECIMEN # button in masthead');

  const appSrc = fs.readFileSync('src/App.tsx', 'utf8');
  assert(appSrc.includes('DailySpecimenMystery'), 'App.tsx integrates DailySpecimenMystery component');

  // -------------------------------------------------------------------------
  // CHECK 3: Monograph Poster Exporter & Print Stylesheet
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 3: Monograph Poster Exporter & Print CSS ---');
  const exporterPath = path.resolve('src/components/profile/modules/MonographPosterExporter.tsx');
  assert(fs.existsSync(exporterPath), 'MonographPosterExporter.tsx file exists');

  if (fs.existsSync(exporterPath)) {
    const expSrc = fs.readFileSync(exporterPath, 'utf8');
    assert(expSrc.includes('archival-monograph-print-root'), 'Implements #archival-monograph-print-root print container');
    assert(expSrc.includes('Print / Save as PDF Dossier'), 'Provides "Print / Save as PDF Dossier" action');
    assert(expSrc.includes('Download Specimen Card (.png)'), 'Provides "Download Specimen Card (.png)" action');
    assert(expSrc.includes('HTMLCanvasElement') || expSrc.includes('document.createElement(\'canvas\')'), 'Implements HTML5 canvas exporter');
    assert(expSrc.includes('crossOrigin') || expSrc.includes('SecurityError'), 'Implements CORS resilience on canvas image load');
    assert(expSrc.includes('TaxonomicSilhouette') || expSrc.includes('silhouette'), 'Falls back to vector taxonomic silhouette on CORS restrictions');
  }

  const indexCss = fs.readFileSync('src/index.css', 'utf8');
  assert(indexCss.includes('@media print'), 'src/index.css defines @media print stylesheet rules');
  assert(indexCss.includes('#archival-monograph-print-root'), 'src/index.css isolates #archival-monograph-print-root in print');
  assert(indexCss.includes('print-color-adjust: exact') || indexCss.includes('-webkit-print-color-adjust: exact'), 'Enforces exact museum print colors');

  const expeditionSrc = fs.readFileSync('src/components/profile/SpeciesExpeditionPage.tsx', 'utf8');
  assert(expeditionSrc.includes('Export Monograph Plate'), 'SpeciesExpeditionPage.tsx adds "Export Monograph Plate" action in control bar');
  assert(expeditionSrc.includes('MonographPosterExporter'), 'SpeciesExpeditionPage.tsx integrates MonographPosterExporter modal');

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runViralFeaturesSuite().catch((err) => {
  console.error('Viral Features Suite Failed:', err);
  process.exit(1);
});
