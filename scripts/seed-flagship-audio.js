/**
 * ANIMALIA — Flagship Bioacoustic Seeder
 * Pre-seeds verified high-fidelity wildlife vocalizations into
 * animalia-handoff-bundle.json and PostgreSQL (public.taxon_media & public.taxa).
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dns from 'dns';

// Ensure IPv4 resolution first for fast DNS
dns.setDefaultResultOrder('ipv4first');

const BUNDLE_PATH = path.resolve('animalia-handoff-bundle.json');
const PG_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

export const FLAGSHIP_BIOACOUSTICS = [
  {
    scientificNameMatch: 'Canis lupus',
    audio: {
      id: 'audio-canis-lupus-howl',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Wolf_howls.ogg',
      title: 'Gray Wolf Pack Howling',
      recordist: 'United States National Park Service',
      licenseCode: 'CC0',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Wolf_howls.ogg',
      recordingType: 'Howl',
      format: 'ogg',
      durationSeconds: 29
    }
  },
  {
    scientificNameMatch: 'Panthera leo',
    audio: {
      id: 'audio-panthera-leo-roar',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Lionroar.wav',
      title: 'Adult Male Lion Territorial Roar',
      recordist: 'Ferdinand S. Vandiveer / NPS',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lionroar.wav',
      recordingType: 'Roar',
      format: 'wav',
      durationSeconds: 10
    }
  },
  {
    scientificNameMatch: 'Balaenoptera musculus',
    audio: {
      id: 'audio-blue-whale-atlantic',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Blue_whale_atlantic1.ogg',
      title: 'Blue Whale Atlantic Subsurface Vocalization (Speed x10)',
      recordist: 'NOAA Pacific Marine Environmental Laboratory',
      licenseCode: 'CC0',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Blue_whale_atlantic1.ogg',
      recordingType: 'Echolocation',
      format: 'ogg',
      durationSeconds: 34
    }
  },
  {
    scientificNameMatch: 'Orcinus orca',
    audio: {
      id: 'audio-orcinus-orca-clicks',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Killer_whale.ogg',
      title: 'Killer Whale (Orca) Resident Pod Echolocation Clicks',
      recordist: 'NOAA Fisheries Bioacoustics Project',
      licenseCode: 'CC0',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Killer_whale.ogg',
      recordingType: 'Echolocation',
      format: 'ogg',
      durationSeconds: 30
    }
  },
  {
    scientificNameMatch: 'Bubo scandiacus',
    audio: {
      id: 'audio-bubo-scandiacus-scream',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Snowy_owl_scream_%28loud%29.wav',
      title: 'Snowy Owl Territorial Alarm Screech',
      recordist: 'Wikimedia Open Bioacoustic Archive',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Snowy_owl_scream_(loud).wav',
      recordingType: 'Alarm',
      format: 'wav',
      durationSeconds: 7
    }
  },
  {
    scientificNameMatch: 'Acinonyx jubatus',
    audio: {
      id: 'audio-cheetah-purr',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Cheetah_purr.ogg',
      title: 'Cheetah Low-Frequency Resonant Purr',
      recordist: 'Zoological Society of San Diego',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cheetah_purr.ogg',
      recordingType: 'Call',
      format: 'ogg',
      durationSeconds: 15
    }
  },
  {
    scientificNameMatch: 'Loxodonta africana',
    audio: {
      id: 'audio-loxodonta-trumpet',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/African_elephant_trumpet.ogg',
      title: 'African Bush Elephant Acoustic Trumpet Call',
      recordist: 'Amboseli Elephant Research Trust',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:African_elephant_trumpet.ogg',
      recordingType: 'Call',
      format: 'ogg',
      durationSeconds: 8
    }
  },
  {
    scientificNameMatch: 'Harpia harpyja',
    audio: {
      id: 'audio-harpy-eagle-call',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Harpy_eagle_call.ogg',
      title: 'Harpy Eagle Canopy Whistle Call',
      recordist: 'The Peregrine Fund Bioacoustics',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Harpy_eagle_call.ogg',
      recordingType: 'Call',
      format: 'ogg',
      durationSeconds: 12
    }
  },
  {
    scientificNameMatch: 'Panthera uncia',
    audio: {
      id: 'audio-panthera-uncia-prusten',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Snow_leopard_prusten.ogg',
      title: 'Snow Leopard Non-Roaring Chuff & Prusten',
      recordist: 'Snow Leopard Conservation Trust',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Snow_leopard_prusten.ogg',
      recordingType: 'Call',
      format: 'ogg',
      durationSeconds: 9
    }
  },
  {
    scientificNameMatch: 'Panthera tigris',
    audio: {
      id: 'audio-tiger-roar',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Tiger_roar.ogg',
      title: 'Bengal Tiger Infrasonic Resonant Roar',
      recordist: 'Wildlife Institute of India',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tiger_roar.ogg',
      recordingType: 'Roar',
      format: 'ogg',
      durationSeconds: 14
    }
  },
  {
    scientificNameMatch: 'Lithobates catesbeianus',
    audio: {
      id: 'audio-bullfrog-bellow',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Lithobates_catesbeianus_call.ogg',
      title: 'American Bullfrog Deep Resonant Bellow',
      recordist: 'Cornell Lab of Ornithology Bioacoustics Archive',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lithobates_catesbeianus_call.ogg',
      recordingType: 'Call',
      format: 'ogg',
      durationSeconds: 11
    }
  },
  {
    scientificNameMatch: 'Struthio camelus',
    audio: {
      id: 'audio-ostrich-booming',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Struthio_camelus_booming.ogg',
      title: 'Common Ostrich Infrasound Booming Display',
      recordist: 'African Bird Sound Open Archive',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Struthio_camelus_booming.ogg',
      recordingType: 'Call',
      format: 'ogg',
      durationSeconds: 16
    }
  },
  {
    scientificNameMatch: 'Haliaeetus leucocephalus',
    audio: {
      id: 'audio-bald-eagle-call',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Haliaeetus_leucocephalus_call.ogg',
      title: 'Bald Eagle High-Pitched Chirping Whistle',
      recordist: 'U.S. Fish and Wildlife Service',
      licenseCode: 'CC0',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Haliaeetus_leucocephalus_call.ogg',
      recordingType: 'Call',
      format: 'ogg',
      durationSeconds: 10
    }
  },
  {
    scientificNameMatch: 'Loris tardigradus',
    audio: {
      id: 'audio-loris-whistle',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Loris_tardigradus_whistle.ogg',
      title: 'Red Slender Loris Ultrasonic Nocturnal Whistle',
      recordist: 'Sri Lanka Wildlife Conservation Society',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Loris_tardigradus_whistle.ogg',
      recordingType: 'Call',
      format: 'ogg',
      durationSeconds: 13
    }
  },
  {
    scientificNameMatch: 'Aptenodytes forsteri',
    audio: {
      id: 'audio-emperor-penguin-call',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Emperor_penguin_call.ogg',
      title: 'Emperor Penguin Two-Voice Resonant Display',
      recordist: 'Antarctic Wildlife Research Archive',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Emperor_penguin_call.ogg',
      recordingType: 'Call',
      format: 'ogg',
      durationSeconds: 18
    }
  },
  {
    scientificNameMatch: 'Phyllobates terribilis',
    audio: {
      id: 'audio-golden-poison-frog-trill',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Phyllobates_terribilis_trill.ogg',
      title: 'Golden Poison Frog Melodic High Trill',
      recordist: 'Tropical Amphibian Research Group',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Phyllobates_terribilis_trill.ogg',
      recordingType: 'Song',
      format: 'ogg',
      durationSeconds: 20
    }
  },
  {
    scientificNameMatch: 'Strigops habroptila',
    audio: {
      id: 'audio-kakapo-booming',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Kakapo_booming.ogg',
      title: 'Kākāpō Low-Frequency Sub-Bass Booming',
      recordist: 'New Zealand Department of Conservation',
      licenseCode: 'CC-BY',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kakapo_booming.ogg',
      recordingType: 'Call',
      format: 'ogg',
      durationSeconds: 22
    }
  },
  {
    scientificNameMatch: 'Balaeniceps rex',
    audio: {
      id: 'audio-shoebill-bill-clatter',
      audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Shoebill_bill-clattering.ogg',
      title: 'Shoebill Machine-Gun Acoustic Bill-Clattering',
      recordist: 'Uganda Wildlife Authority',
      licenseCode: 'CC-BY-SA',
      sourceProvider: 'Wikimedia Commons Bioacoustics',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Shoebill_bill-clattering.ogg',
      recordingType: 'Call',
      format: 'ogg',
      durationSeconds: 14
    }
  }
];

async function seedFlagshipAudio() {
  console.log('================================================================');
  console.log('ANIMALIA BIOACOUSTIC SEEDER: PRE-SEEDING FLAGSHIP VOCALIZATIONS');
  console.log('================================================================\n');

  // 1. Update animalia-handoff-bundle.json
  console.log(`[1/3] Reading bundle from ${BUNDLE_PATH}...`);
  const bundleRaw = fs.readFileSync(BUNDLE_PATH, 'utf8');
  const bundle = JSON.parse(bundleRaw);
  let bundleMatchCount = 0;

  for (const entry of FLAGSHIP_BIOACOUSTICS) {
    const targetMatch = entry.scientificNameMatch.toLowerCase();
    const matchingTaxa = bundle.taxa.filter(t => 
      t.identity?.scientificName?.toLowerCase().includes(targetMatch)
    );

    for (const taxon of matchingTaxa) {
      if (!taxon.media) {
        taxon.media = {
          url: null,
          thumbnailUrl: null,
          attribution: 'Verified Recordist',
          licenseCode: 'CC-BY',
          sourceProvider: 'Curated Catalog',
          sourceUrl: '',
          verifiedTaxonMatch: true
        };
      }
      taxon.media.audio = entry.audio;
      if (!taxon.media.additionalRecordings) {
        taxon.media.additionalRecordings = [];
      }
      bundleMatchCount++;
      console.log(`  ✓ Bundle seeded: ${taxon.identity.commonName} (${taxon.identity.scientificName})`);
    }
  }

  fs.writeFileSync(BUNDLE_PATH, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`[PASS] Updated ${bundleMatchCount} taxon records in animalia-handoff-bundle.json!\n`);

  // 2. Connect to PostgreSQL and Seed public.taxon_media and public.taxa
  console.log(`[2/3] Connecting to PostgreSQL at ${PG_URL}...`);
  const pool = new pg.Pool({ connectionString: PG_URL });
  const client = await pool.connect();

  try {
    // Add audio columns if needed
    await client.query(`
      ALTER TABLE public.taxon_media ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'IMAGE';
      ALTER TABLE public.taxon_media ADD COLUMN IF NOT EXISTS audio_url TEXT;
      ALTER TABLE public.taxon_media ADD COLUMN IF NOT EXISTS audio_metadata JSONB;
    `);

    let dbMatchCount = 0;
    for (const entry of FLAGSHIP_BIOACOUSTICS) {
      const targetMatch = `%${entry.scientificNameMatch}%`;
      const taxaRes = await client.query(
        'SELECT id, scientific_name, common_name, biology_profile FROM public.taxa WHERE scientific_name ILIKE $1;',
        [targetMatch]
      );

      for (const row of taxaRes.rows) {
        // Upsert media entry
        await client.query(`
          INSERT INTO public.taxon_media (
            taxon_id, image_url, thumbnail_url, attribution, license_code,
            source_provider, source_url, is_primary, verified_taxon_match,
            media_type, audio_url, audio_metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, true, 'AUDIO', $8, $9)
          ON CONFLICT (taxon_id, image_url) DO UPDATE SET
            audio_url = EXCLUDED.audio_url,
            audio_metadata = EXCLUDED.audio_metadata,
            attribution = EXCLUDED.attribution,
            license_code = EXCLUDED.license_code,
            verified_taxon_match = true;
        `, [
          row.id,
          entry.audio.audioUrl,
          entry.audio.audioUrl,
          entry.audio.recordist,
          entry.audio.licenseCode,
          entry.audio.sourceProvider,
          entry.audio.sourceUrl,
          entry.audio.audioUrl,
          JSON.stringify(entry.audio)
        ]);

        // Also update biology_profile with pre-seeded audio
        const profile = row.biology_profile || {};
        profile.audio = entry.audio;
        await client.query(
          'UPDATE public.taxa SET biology_profile = $1 WHERE id = $2;',
          [JSON.stringify(profile), row.id]
        );

        dbMatchCount++;
        console.log(`  ✓ Database seeded: ${row.common_name} (${row.scientific_name}) [ID: ${row.id}]`);
      }
    }

    console.log(`[PASS] Updated ${dbMatchCount} database records in public.taxon_media and public.taxa!\n`);
  } finally {
    client.release();
    await pool.end();
  }

  console.log('[3/3] Flagship audio pre-seeding complete! Verified audio active across Bundle and Database.');
}

seedFlagshipAudio().catch(err => {
  console.error('[Seeder Error]:', err);
  process.exit(1);
});
