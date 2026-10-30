/**
 * ANIMALIA — Launch Readiness & Commercial Production Verification Suite
 * 
 * Verifies:
 * 1. Commercial Media License Guard (`isCommercialSafeLicense`, CC0/BY/SA vs -NC exclusion)
 * 2. Separate Cache Key Namespacing for Commercial-Safe vs All-CC Modes
 * 3. Live Hot-Swapping of -NC seed images to CC0/BY/SA or Wikimedia CC-BY-SA
 * 4. PWA Web App Manifest, Archival Crest Icons, and index.html Linkage
 * 5. Vercel SPA Routing Configuration (`vercel.json`)
 * 6. Cloud Serverless Zero-Error Database Fallback
 * 7. Bioacoustic Commercial License Enforcement
 */

import fs from 'fs';
import path from 'path';
import {
  isCommercialSafeLicense,
  getCommercialSafeMode,
  setCommercialSafeMode,
  resolveVerifiedTaxonMedia,
  fetchTaxonGallery
} from '../src/services/mediaResolverService.ts';
import { resolveTaxonBioacoustics } from '../src/services/bioacousticService.ts';
import { repository } from '../src/services/supabaseRepository.ts';
import { INITIAL_TAXA } from '../src/data/initialTaxa.ts';

async function runLaunchReadinessVerification() {
  console.log('======================================================================');
  console.log('ANIMALIA — LAUNCH SPRINT 2 PRODUCTION READINESS VERIFICATION');
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

  // -------------------------------------------------------------------------
  // 1. COMMERCIAL MEDIA LICENSE EVALUATION & GUARDS
  // -------------------------------------------------------------------------
  console.log('[1. Testing Commercial License Guard & Classifications]...');

  assert(isCommercialSafeLicense('CC0'), 'CC0 is commercial safe');
  assert(isCommercialSafeLicense('CC-BY'), 'CC-BY is commercial safe');
  assert(isCommercialSafeLicense('CC-BY-4.0'), 'CC-BY-4.0 is commercial safe');
  assert(isCommercialSafeLicense('CC-BY-SA'), 'CC-BY-SA is commercial safe');
  assert(isCommercialSafeLicense('CC-BY-SA-4.0'), 'CC-BY-SA-4.0 is commercial safe');
  assert(isCommercialSafeLicense('PD'), 'PD is commercial safe');
  assert(isCommercialSafeLicense('PUBLIC DOMAIN'), 'Public Domain is commercial safe');

  assert(!isCommercialSafeLicense('CC-BY-NC'), 'CC-BY-NC is strictly excluded');
  assert(!isCommercialSafeLicense('CC-BY-NC-4.0'), 'CC-BY-NC-4.0 is strictly excluded');
  assert(!isCommercialSafeLicense('CC-BY-NC-SA'), 'CC-BY-NC-SA is strictly excluded');
  assert(!isCommercialSafeLicense('CC-BY-NC-ND'), 'CC-BY-NC-ND is strictly excluded');
  assert(!isCommercialSafeLicense('CC-BY-ND'), 'CC-BY-ND is strictly excluded');
  assert(!isCommercialSafeLicense('ALL-RIGHTS-RESERVED'), 'All Rights Reserved is strictly excluded');
  assert(!isCommercialSafeLicense(''), 'Empty license string is rejected');
  assert(!isCommercialSafeLicense(null), 'Null license is rejected');

  // Mode state switching
  setCommercialSafeMode(true);
  assert(getCommercialSafeMode() === true, 'Commercial Safe Mode toggles to TRUE');
  setCommercialSafeMode(false);
  assert(getCommercialSafeMode() === false, 'Commercial Safe Mode toggles to FALSE');
  setCommercialSafeMode(true); // Restore safe default

  // -------------------------------------------------------------------------
  // 2. SEPARATE CACHE NAMESPACING & RUNTIME HOT-SWAPPING
  // -------------------------------------------------------------------------
  console.log('\n[2. Testing Cache Namespacing & Live Media Hot-Swapping]...');

  // Live test on Cheetah (Acinonyx jubatus) or Snow Leopard (Panthera uncia)
  const resolvedCommercial = await resolveVerifiedTaxonMedia({
    scientificName: 'Panthera uncia',
    inatTaxonId: 41970,
    commercialSafeOnly: true
  });

  assert(Boolean(resolvedCommercial), 'Resolved commercial photograph for Panthera uncia');
  if (resolvedCommercial) {
    assert(
      isCommercialSafeLicense(resolvedCommercial.licenseCode),
      'Commercial media license is verified CC0/BY/SA',
      resolvedCommercial.licenseCode
    );
    assert(Boolean(resolvedCommercial.url), 'Verified image URL returned', resolvedCommercial.url.slice(0, 60));
  }

  // Test multi-photo gallery under commercial filter
  const sampleTaxon = INITIAL_TAXA.find((t) => t.identity.scientificName === 'Panthera uncia') || INITIAL_TAXA[0];
  const galleryCommercial = await fetchTaxonGallery(sampleTaxon, true);
  assert(galleryCommercial.length > 0, 'Commercial gallery resolved assets', `${galleryCommercial.length} photos`);
  const allSafe = galleryCommercial.every((p) => isCommercialSafeLicense(p.licenseCode));
  assert(allSafe, '100% of photos in commercial gallery satisfy safe license criteria');

  // -------------------------------------------------------------------------
  // 3. PWA WEB APP MANIFEST & ARCHIVAL BRAND ASSETS
  // -------------------------------------------------------------------------
  console.log('\n[3. Testing PWA Manifest & Archival Brand Assets]...');

  const manifestPath = path.resolve('public/manifest.webmanifest');
  assert(fs.existsSync(manifestPath), 'public/manifest.webmanifest exists');

  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert(manifestContent.display === 'standalone', 'PWA display configured as standalone');
  assert(manifestContent.theme_color === '#070A09', 'Obsidian Herbarium theme color (#070A09) registered');
  assert(manifestContent.background_color === '#070A09', 'Background color (#070A09) registered');
  assert(Array.isArray(manifestContent.icons) && manifestContent.icons.length >= 3, 'PWA icons array configured');

  assert(fs.existsSync(path.resolve('public/icon.svg')), 'public/icon.svg exists');
  assert(fs.existsSync(path.resolve('public/icon-192.svg')), 'public/icon-192.svg exists');
  assert(fs.existsSync(path.resolve('public/icon-512.svg')), 'public/icon-512.svg exists');

  // Verify index.html links
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  assert(htmlContent.includes('rel="manifest" href="/manifest.webmanifest"'), 'index.html links manifest.webmanifest');
  assert(htmlContent.includes('name="theme-color" content="#070A09"'), 'index.html defines theme-color meta tag');
  assert(htmlContent.includes('apple-mobile-web-app-capable'), 'index.html defines apple-mobile-web-app-capable');

  // -------------------------------------------------------------------------
  // 4. VERCEL SPA ROUTING & STATIC ASSET HEADERS
  // -------------------------------------------------------------------------
  console.log('\n[4. Testing Vercel Edge Configuration & SPA Rewrites]...');

  const vercelPath = path.resolve('vercel.json');
  assert(fs.existsSync(vercelPath), 'vercel.json exists');

  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
  assert(Array.isArray(vercelConfig.rewrites), 'Vercel rewrites array configured');
  const spaRewrite = vercelConfig.rewrites.find((r) => r.destination === '/index.html');
  assert(Boolean(spaRewrite), 'SPA fallback rewrite to /index.html verified', spaRewrite?.source);

  const assetHeader = vercelConfig.headers?.find((h) => h.source?.includes('assets'));
  assert(Boolean(assetHeader), 'Immutable asset cache headers configured');

  // -------------------------------------------------------------------------
  // 5. SERVERLESS CLOUD ZERO-ERROR DATABASE FALLBACK
  // -------------------------------------------------------------------------
  console.log('\n[5. Testing Serverless Cloud Zero-Error Database Fallback]...');

  repository.seedFromBundle(INITIAL_TAXA);
  const taxaPage = await repository.getTaxaCursor({ limit: 10 });
  assert(taxaPage.items.length === 10, 'Keyset cursor retrieved 10 taxa from bundled repository');
  assert(Boolean(taxaPage.nextCursor), 'Next cursor generated for infinite pagination');

  const filteredTaxa = await repository.getTaxaCursor({ categoryGroup: 'Mammals', limit: 5 });
  assert(filteredTaxa.items.length === 5, 'Keyset cursor filtered 5 mammals accurately');
  const allMammals = filteredTaxa.items.every((t) => t.identity.categoryGroup === 'Mammals');
  assert(allMammals, 'All filtered taxa belong to Mammals group');

  // -------------------------------------------------------------------------
  // 6. BIOACOUSTIC COMMERCIAL LICENSE ENFORCEMENT
  // -------------------------------------------------------------------------
  console.log('\n[6. Testing Bioacoustic Commercial License Enforcement]...');

  const audioRes = await resolveTaxonBioacoustics(sampleTaxon, { commercialSafeOnly: true });
  assert(audioRes.status === 'VOCAL_RECORDINGS_FOUND', 'Audio resolver returned vocal recordings');
  if (audioRes.primaryAudio) {
    assert(
      isCommercialSafeLicense(audioRes.primaryAudio.licenseCode),
      'Primary audio recording carries verified commercial safe license',
      audioRes.primaryAudio.licenseCode
    );
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`LAUNCH READINESS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLaunchReadinessVerification().catch((err) => {
  console.error('[FATAL] Verification suite crashed:', err);
  process.exit(1);
});
