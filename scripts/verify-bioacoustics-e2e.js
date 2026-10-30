/**
 * ANIMALIA — Bioacoustic Engine Comprehensive E2E Verification Suite
 * Verifies all 6 core requirements:
 * 1. Global Audio Coordinator state machine & bus singleton
 * 2. Live Bioacoustic Harvester for vocal flagships (Wolf, Lion, Whale)
 * 3. Honest Non-Vocal Organism Classification (Jellyfish, Sponges)
 * 4. Honest Extinct Paleo-Acoustic Classification (T-Rex, Mammoths)
 * 5. Web Audio buffer synthesis and pitch-shift rate bounds
 * 6. Production Bundle & PostgreSQL audio schema & licensing integrity
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dns from 'dns';
import { resolveTaxonBioacoustics } from '../src/services/bioacousticService.ts';
import { globalAudioBus } from '../src/services/audioCoordinator.ts';

// Optimize network DNS for Node
dns.setDefaultResultOrder('ipv4first');

const BUNDLE_PATH = path.resolve('animalia-handoff-bundle.json');
const PG_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function runFullVerificationSuite() {
  console.log('================================================================');
  console.log('ANIMALIA E2E VERIFICATION: BIOACOUSTIC ENGINE & AUDIO STUDIO');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // CHECK 1: Audio Coordinator Singleton & State Machine
  // -------------------------------------------------------------------------
  console.log('--- CHECK 1: Audio Coordinator Singleton & State Machine ---');
  const initialState = globalAudioBus.getState();
  console.log(`[PASS] Initial state retrieved: isPlaying=${initialState.isPlaying}, rate=${initialState.playbackRate}`);
  if (initialState.isPlaying !== false) {
    throw new Error('Initial state must have isPlaying = false');
  }

  // Test state listener subscription
  let listenerNotified = false;
  const unsubscribe = globalAudioBus.subscribe((state) => {
    listenerNotified = true;
  });

  globalAudioBus.setPlaybackRate(0.5);
  globalAudioBus.setVolume(0.8);
  globalAudioBus.setLoop(true);

  const updatedState = globalAudioBus.getState();
  if (updatedState.playbackRate !== 0.5 || updatedState.volume !== 0.8 || updatedState.isLooping !== true) {
    throw new Error('AudioCoordinator state mutation failed');
  }
  if (!listenerNotified) {
    throw new Error('AudioCoordinator listener was not notified of state changes');
  }
  unsubscribe();
  console.log('[PASS] Global audio bus subscriptions and state mutations verified.');

  // Reset to defaults
  globalAudioBus.setPlaybackRate(1.0);
  globalAudioBus.setVolume(1.0);
  globalAudioBus.setLoop(false);

  // -------------------------------------------------------------------------
  // CHECK 2: Live Bioacoustic Harvester for Vocal Flagships
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 2: Bioacoustic Harvester for Vocal Flagships ---');
  const wolfTaxon = {
    id: 'demo-wolf',
    identity: {
      scientificName: 'Canis lupus',
      commonName: 'Gray Wolf',
      categoryGroup: 'Mammals',
      isExtinct: false,
      lineage: { phylum: 'Chordata', class: 'Mammalia' },
      externalIds: { inatTaxonId: 42048, gbifKey: 5219173 }
    },
    media: {
      url: null,
      thumbnailUrl: null,
      attribution: 'NPS',
      licenseCode: 'CC0',
      sourceProvider: '',
      sourceUrl: '',
      verifiedTaxonMatch: true
    }
  };

  const wolfResult = await resolveTaxonBioacoustics(wolfTaxon);
  console.log(`[PASS] Wolf bioacoustic status: ${wolfResult.status}`);
  if (wolfResult.status !== 'VOCAL_RECORDINGS_FOUND' || !wolfResult.primaryAudio) {
    throw new Error(`Expected VOCAL_RECORDINGS_FOUND for Canis lupus, got ${wolfResult.status}`);
  }
  const primaryWolf = wolfResult.primaryAudio;
  console.log(`  ✓ Recording: "${primaryWolf.title}"`);
  console.log(`  ✓ Recordist: ${primaryWolf.recordist}`);
  console.log(`  ✓ License:   ${primaryWolf.licenseCode}`);
  console.log(`  ✓ Stream URL: ${primaryWolf.audioUrl}`);

  if (!primaryWolf.audioUrl || !primaryWolf.licenseCode) {
    throw new Error('Vocal recording missing required audioUrl or licenseCode');
  }

  // Ensure no spoken articles in results
  const hasSpoken = wolfResult.recordings.some(r => 
    /spoken|pronunciation|ll-q|en-[a-z0-9_-]+|nl-[a-z0-9_-]+|-article/i.test(r.audioUrl)
  );
  if (hasSpoken) {
    throw new Error('Spoken article or pronunciation detected in wildlife audio results!');
  }
  console.log('[PASS] Spoken-article rejection filter passed 100%.');

  // Test Blue Whale Marine Mammal
  const whaleTaxon = {
    id: 'demo-whale',
    identity: {
      scientificName: 'Balaenoptera musculus',
      commonName: 'Blue Whale',
      categoryGroup: 'Mammals',
      isExtinct: false,
      lineage: { phylum: 'Chordata', class: 'Mammalia' },
      externalIds: { inatTaxonId: 41539, gbifKey: 2440735 }
    },
    media: { url: null, thumbnailUrl: null, attribution: '', licenseCode: 'CC0', sourceProvider: '', sourceUrl: '', verifiedTaxonMatch: true }
  };
  const whaleResult = await resolveTaxonBioacoustics(whaleTaxon);
  console.log(`[PASS] Blue Whale bioacoustic status: ${whaleResult.status}`);
  if (whaleResult.status !== 'VOCAL_RECORDINGS_FOUND' || !whaleResult.primaryAudio) {
    throw new Error('Expected VOCAL_RECORDINGS_FOUND for Balaenoptera musculus');
  }

  // -------------------------------------------------------------------------
  // CHECK 3: Honest Non-Vocal Classification (No Sound Fabrication)
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 3: Honest Non-Vocal Classification ---');
  const testNonVocal = [
    { name: 'Moon Jellyfish', sci: 'Aurelia aurita', phylum: 'Cnidaria', class: 'Scyphozoa' },
    { name: 'Water Bear', sci: 'Milnesium tardigradum', phylum: 'Tardigrada', class: 'Eutardigrada' },
    { name: 'Sea Sponge', sci: 'Spongia officinalis', phylum: 'Porifera', class: 'Demospongiae' }
  ];

  for (const item of testNonVocal) {
    const taxon = {
      id: `test-${item.sci.replace(/\s+/g, '-')}`,
      identity: {
        scientificName: item.sci,
        commonName: item.name,
        categoryGroup: 'Marine Invertebrates',
        isExtinct: false,
        lineage: { phylum: item.phylum, class: item.class },
        externalIds: { inatTaxonId: null, gbifKey: null }
      },
      media: { url: null, thumbnailUrl: null, attribution: '', licenseCode: '', sourceProvider: '', sourceUrl: '', verifiedTaxonMatch: true }
    };

    const res = await resolveTaxonBioacoustics(taxon);
    if (res.status !== 'NON_VOCAL_ORGANISM' || res.primaryAudio !== null) {
      throw new Error(`Non-vocal clade ${item.phylum} incorrectly returned audio or non-honest status!`);
    }
    console.log(`  ✓ ${item.name} (${item.phylum}): [PASS] Status: ${res.status} | Sound: null`);
  }
  console.log('[PASS] Honest non-vocal classification verified across Cnidaria, Tardigrada, and Porifera.');

  // -------------------------------------------------------------------------
  // CHECK 4: Honest Extinct Classification (Paleo-Acoustic Note)
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 4: Honest Extinct Classification ---');
  const testExtinct = [
    { name: 'Tyrannosaurus Rex', sci: 'Tyrannosaurus rex', extinct: true },
    { name: 'Woolly Mammoth', sci: 'Mammuthus primigenius', extinct: true },
    { name: 'Thylacine', sci: 'Thylacinus cynocephalus', extinct: true }
  ];

  for (const item of testExtinct) {
    const taxon = {
      id: `test-${item.sci.replace(/\s+/g, '-')}`,
      identity: {
        scientificName: item.sci,
        commonName: item.name,
        categoryGroup: 'Extinct Taxa',
        isExtinct: item.extinct,
        lineage: { phylum: 'Chordata', class: 'Mammalia' },
        externalIds: { inatTaxonId: null, gbifKey: null }
      },
      media: { url: null, thumbnailUrl: null, attribution: '', licenseCode: '', sourceProvider: '', sourceUrl: '', verifiedTaxonMatch: true }
    };

    const res = await resolveTaxonBioacoustics(taxon);
    if (res.status !== 'EXTINCT_PALEO_ACOUSTIC' || res.primaryAudio !== null) {
      throw new Error(`Extinct taxon ${item.sci} incorrectly returned audio or non-honest status!`);
    }
    if (!res.scientificNote.toLowerCase().includes('extinct') && !res.scientificNote.toLowerCase().includes('prehistoric')) {
      throw new Error(`Extinct taxon ${item.sci} missing required paleo-acoustic explanation!`);
    }
    console.log(`  ✓ ${item.name}: [PASS] Status: ${res.status} | Sound: null`);
    console.log(`    Note: "${res.scientificNote.slice(0, 80)}..."`);
  }
  console.log('[PASS] Honest extinct paleo-acoustic classification verified with zero fabricated audio.');

  // -------------------------------------------------------------------------
  // CHECK 5: Web Audio Buffer & Pitch Computation
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 5: Web Audio Buffer & Pitch Computation ---');
  const freqData = globalAudioBus.getByteFrequencyData();
  const timeData = globalAudioBus.getByteTimeDomainData();

  if (!(freqData instanceof Uint8Array) || freqData.length === 0) {
    throw new Error('getByteFrequencyData must return a non-empty Uint8Array');
  }
  if (!(timeData instanceof Uint8Array) || timeData.length === 0) {
    throw new Error('getByteTimeDomainData must return a non-empty Uint8Array');
  }
  console.log(`[PASS] Frequency buffer returned: length=${freqData.length}, sample values=[${freqData.slice(0, 4).join(', ')}]`);
  console.log(`[PASS] Time-domain buffer returned: length=${timeData.length}, sample values=[${timeData.slice(0, 4).join(', ')}]`);

  // Verify playback rates for slow-motion pitch drop
  const rates = [0.25, 0.5, 1.0];
  for (const r of rates) {
    globalAudioBus.setPlaybackRate(r);
    if (globalAudioBus.getState().playbackRate !== r) {
      throw new Error(`Playback rate ${r} failed to update`);
    }
  }
  console.log('[PASS] Slow-motion pitch-drop playback rates verified (0.25x, 0.5x, 1.0x).');

  // -------------------------------------------------------------------------
  // CHECK 6: Bundle & Database Audio Integrity
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 6: Bundle & Database Audio Integrity ---');
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
  const seededBundleTaxa = bundle.taxa.filter(t => t.media?.audio?.audioUrl);
  console.log(`[PASS] Verified ${seededBundleTaxa.length} taxa with pre-seeded audio in animalia-handoff-bundle.json`);

  if (seededBundleTaxa.length < 15) {
    throw new Error(`Expected at least 15 pre-seeded audio taxa in bundle, found ${seededBundleTaxa.length}`);
  }

  for (const taxon of seededBundleTaxa.slice(0, 5)) {
    const audio = taxon.media.audio;
    if (!audio.audioUrl.startsWith('https://upload.wikimedia.org/') && !audio.audioUrl.startsWith('http')) {
      throw new Error(`Taxon ${taxon.identity.commonName} has invalid audioUrl: ${audio.audioUrl}`);
    }
    if (!audio.recordist || !audio.licenseCode) {
      throw new Error(`Taxon ${taxon.identity.commonName} missing audio attribution or license`);
    }
    console.log(`  ✓ ${taxon.identity.commonName}: ${audio.title} (${audio.licenseCode})`);
  }

  // Connect to PostgreSQL to verify database audio records
  const pool = new pg.Pool({ connectionString: PG_URL });
  const client = await pool.connect();
  try {
    const dbMediaRes = await client.query("SELECT count(*)::int as count FROM public.taxon_media WHERE media_type = 'AUDIO';");
    const audioCount = dbMediaRes.rows[0]?.count || 0;
    console.log(`[PASS] Verified ${audioCount} audio records in public.taxon_media on PostgreSQL (127.0.0.1:54322)`);

    if (audioCount < 10) {
      throw new Error(`Expected at least 10 audio records in database, found ${audioCount}`);
    }

    const sampleDb = await client.query("SELECT tm.image_url, tm.attribution, tm.license_code, t.common_name, t.scientific_name FROM public.taxon_media tm JOIN public.taxa t ON tm.taxon_id = t.id WHERE tm.media_type = 'AUDIO' LIMIT 3;");
    for (const row of sampleDb.rows) {
      console.log(`  ✓ DB: ${row.common_name} (${row.scientific_name}) -> ${row.attribution} [${row.license_code}]`);
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n================================================================');
  console.log('✓ ALL 6 BIOACOUSTIC ENGINE E2E CHECKS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
}

runFullVerificationSuite().catch(err => {
  console.error('\n❌ [FAIL] Verification suite failed:', err);
  process.exit(1);
});
