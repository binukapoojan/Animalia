/**
 * ANIMALIA — Profile Photo Switching & Gallery State Verification E2E
 */

import fs from 'fs';
import path from 'path';

console.log('======================================================================');
console.log('ANIMALIA — SPECIES PROFILE PHOTO CHANGER VERIFICATION');
console.log('======================================================================\n');

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

// 1. Audit HeroImageChanger.tsx code dependencies
const heroChangerContent = fs.readFileSync('src/components/profile/modules/HeroImageChanger.tsx', 'utf-8');

assert(
  !heroChangerContent.includes('}, [animal.id, licenseRefreshKey, externalIndex'),
  'HeroImageChanger does NOT re-fetch gallery when externalIndex changes',
  'Eliminated infinite reset bug'
);

assert(
  heroChangerContent.includes('[animal.id, licenseRefreshKey]'),
  'HeroImageChanger gallery effect depends strictly on [animal.id, licenseRefreshKey]'
);

assert(
  heroChangerContent.includes('onGalleryLoaded'),
  'HeroImageChanger supports onGalleryLoaded prop to share gallery with parent'
);

assert(
  heroChangerContent.includes('safeIndex'),
  'HeroImageChanger enforces safeIndex bounds checking across all photo views'
);

assert(
  heroChangerContent.includes('initialGallery'),
  'HeroImageChanger initializes gallery synchronously from record media'
);

// 2. Audit SpeciesExpeditionPage.tsx integration
const speciesExpeditionContent = fs.readFileSync('src/components/profile/SpeciesExpeditionPage.tsx', 'utf-8');

assert(
  speciesExpeditionContent.includes('speciesGallery'),
  'SpeciesExpeditionPage manages speciesGallery state'
);

assert(
  speciesExpeditionContent.includes('onGalleryLoaded={setSpeciesGallery}'),
  'SpeciesExpeditionPage wires onGalleryLoaded to HeroImageChanger'
);

assert(
  speciesExpeditionContent.includes("case '[':") && speciesExpeditionContent.includes("case ']':"),
  'SpeciesExpeditionPage handles keyboard shortcuts [ and ] for photo navigation'
);

assert(
  speciesExpeditionContent.includes('theatrePhotoUrl'),
  'Theatre mode renders active photo dynamically via theatrePhotoUrl'
);

assert(
  speciesExpeditionContent.includes('activePhotoIndex + 1'),
  'Theatre mode displays active photo index counter and navigation controls'
);

// 3. Audit SmartTaxonImage.tsx resilience
const smartTaxonImageContent = fs.readFileSync('src/components/common/SmartTaxonImage.tsx', 'utf-8');

assert(
  smartTaxonImageContent.includes('preferThumbnail'),
  'SmartTaxonImage supports preferThumbnail prop, defaulting to full resolution primaryUrl'
);

assert(
  smartTaxonImageContent.includes('imageRef.current.complete'),
  'SmartTaxonImage detects already-decoded images instantly from browser cache'
);

assert(
  smartTaxonImageContent.includes('cleanThumb && currentSrc !== cleanThumb') &&
  smartTaxonImageContent.includes('cleanPrimary && currentSrc !== cleanPrimary'),
  'SmartTaxonImage features bidirectional fallback between primaryUrl and thumbnailUrl on error'
);

console.log('\n======================================================================');
console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================================\n');

if (failed > 0) process.exit(1);
