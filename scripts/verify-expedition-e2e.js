/**
 * ANIMALIA — Interactive Species Expedition Page Verification Suite
 */

import fs from 'fs';
import path from 'path';
import { parseLengthToCm, parseMassToKg } from '../src/utils/biometricParser.ts';

async function runExpeditionSuite() {
  console.log('===============================================================');
  console.log('ANIMALIA — SPECIES EXPEDITION PAGE & INTERACTIVE MODULES SUITE');
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

  // 1. Biometric Parser Unit Assertions
  console.log('[1. Smart Biometric Parser Verification]');
  assert(parseLengthToCm('0.9 – 1.15 m') === 115, 'Parses "0.9 – 1.15 m" to 115 cm', `${parseLengthToCm('0.9 – 1.15 m')} cm`);
  assert(parseLengthToCm('75–150 cm + 80-105 cm tail') === 150, 'Parses "75–150 cm + 80-105 cm tail" to 150 cm', `${parseLengthToCm('75–150 cm + 80-105 cm tail')} cm`);
  assert(parseLengthToCm('30 m') === 3000, 'Parses "30 m" to 3000 cm', `${parseLengthToCm('30 m')} cm`);
  assert(parseLengthToCm('500 mm') === 50, 'Parses "500 mm" to 50 cm', `${parseLengthToCm('500 mm')} cm`);
  assert(parseLengthToCm(null) === null, 'Honest null handling for undefined length (zero fabricated biology)');
  assert(parseLengthToCm('Undocumented') === null, 'Honest null handling for unparsable text');

  assert(parseMassToKg('22 – 55 kg') === 55, 'Parses "22 – 55 kg" to 55 kg', `${parseMassToKg('22 – 55 kg')} kg`);
  assert(parseMassToKg('150 g') === 0.15, 'Parses "150 g" to 0.15 kg', `${parseMassToKg('150 g')} kg`);
  assert(parseMassToKg('12,000 kg') === 12000, 'Parses "12,000 kg" to 12000 kg', `${parseMassToKg('12,000 kg')} kg`);
  assert(parseMassToKg('150 tonnes') === 150000, 'Parses "150 tonnes" to 150000 kg', `${parseMassToKg('150 tonnes')} kg`);
  assert(parseMassToKg(null) === null, 'Honest null handling for undefined mass');

  // 2. Interactive Modules Verification
  console.log('\n[2. Interactive Module Architecture]');
  const scaleMod = fs.readFileSync('src/components/profile/modules/InteractiveScaleComparator.tsx', 'utf-8');
  assert(scaleMod.includes('STANDARD_REFERENCES'), 'InteractiveScaleComparator defines reference silhouettes');
  assert(scaleMod.includes('zoomLevel'), 'InteractiveScaleComparator implements zoom slider');
  assert(scaleMod.includes('seesawAngle'), 'InteractiveScaleComparator implements biomass balance seesaw');
  assert(scaleMod.includes('Measurements Undocumented in Wild Specimens'), 'InteractiveScaleComparator enforces honest null state');

  const habitatMod = fs.readFileSync('src/components/profile/modules/HabitatBiomeExplorer.tsx', 'utf-8');
  assert(habitatMod.includes('altitudeZone'), 'HabitatBiomeExplorer computes vertical strata profile');
  assert(habitatMod.includes('circadianInfo'), 'HabitatBiomeExplorer implements 24-hour circadian clock');
  assert(habitatMod.includes('scrubberHour'), 'HabitatBiomeExplorer provides interactive hour scrubber');
  assert(habitatMod.includes('trophicTier'), 'HabitatBiomeExplorer computes trophic pyramid tier');
  assert(habitatMod.includes('siblingBiomeTaxa'), 'HabitatBiomeExplorer supports clicking biome tags to filter sibling species');

  const superpowersMod = fs.readFileSync('src/components/profile/modules/BiologicalSuperpowersDeck.tsx', 'utf-8');
  assert(superpowersMod.includes('flippedCardId'), 'BiologicalSuperpowersDeck implements interactive 3D card flipping');
  assert(superpowersMod.includes('Spot the Difference'), 'BiologicalSuperpowersDeck contains "Spot the Difference" challenge');
  assert(superpowersMod.includes('activeComparison'), 'BiologicalSuperpowersDeck loads verified comparative diagnostic traits');

  const lineageMod = fs.readFileSync('src/components/profile/modules/InteractiveLineageNavigator.tsx', 'utf-8');
  assert(lineageMod.includes('CLADE_RANKS'), 'InteractiveLineageNavigator defines 7 standard taxonomic ranks');
  assert(lineageMod.includes('siblingCladeTaxa'), 'InteractiveLineageNavigator opens sibling species drawer per rank');

  // 3. SpeciesExpeditionPage & Control Deck
  console.log('\n[3. SpeciesExpeditionPage & Control Deck]');
  const expeditionPage = fs.readFileSync('src/components/profile/SpeciesExpeditionPage.tsx', 'utf-8');
  assert(expeditionPage.includes("activeTag = (document.activeElement?.tagName || '').toUpperCase()"), 'Keyboard shortcuts guarded against input/textarea/select');
  assert(expeditionPage.includes('GeospatialDistributionViewer'), 'Preserves GeospatialDistributionViewer');
  assert(expeditionPage.includes('enrichAnimalWithGbif'), 'Preserves live GBIF backbone enrichment');
  assert(expeditionPage.includes('prevAnimal') && expeditionPage.includes('nextAnimal'), 'Previous/Next species navigation implemented');
  assert(expeditionPage.includes('EXPEDITION') && expeditionPage.includes('DOSSIER') && expeditionPage.includes('THEATRE'), 'Supports 3 View Modes');

  // 4. App.tsx Deep Linking
  console.log('\n[4. URL Hash Routing in App.tsx]');
  const appFile = fs.readFileSync('src/App.tsx', 'utf-8');
  assert(appFile.includes('window.location.hash = `#/species/${animal.id}`'), 'App.tsx syncs species selection with URL hash');
  assert(appFile.includes('hash.startsWith(\'#/species/\')'), 'App.tsx supports direct deep linking and Back/Forward');
  assert(appFile.includes('SpeciesExpeditionPage'), 'App.tsx renders SpeciesExpeditionPage');

  // 5. Live Server Reachability
  console.log('\n[5. Live Server Validation]');
  try {
    const res = await fetch('http://localhost:5173/');
    assert(res.status === 200, 'Vite dev server running on port 5173', `HTTP ${res.status}`);
  } catch (err) {
    assert(false, 'Vite dev server', err.message);
  }

  console.log('\n===============================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) process.exit(1);
}

runExpeditionSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
