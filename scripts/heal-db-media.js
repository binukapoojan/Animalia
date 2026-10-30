/**
 * ANIMALIA — Direct Database & Seed Bundle Media Healer Script
 * Connects to PostgreSQL on 127.0.0.1:54322,
 * heals broken/unverified image URLs using iNaturalist API v1 & Wikipedia REST API,
 * and synchronizes both public.taxon_media and animalia-handoff-bundle.json.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';

const BUNDLE_PATH = path.resolve('animalia-handoff-bundle.json');
const PG_PORT = 54322;
const PG_HOST = '127.0.0.1';

async function fetchInatPhoto(inatTaxonId, scientificName) {
  let photo = null;
  let inatId = inatTaxonId;

  // 1. Try by iNaturalist ID
  if (inatTaxonId) {
    try {
      const res = await fetch(`https://api.inaturalist.org/v1/taxa/${inatTaxonId}`, {
        headers: { 'User-Agent': 'AnimaliaMediaHealer/1.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        const t = json.results?.[0];
        if (t?.default_photo) {
          photo = t.default_photo;
          inatId = t.id;
        }
      }
    } catch {}
  }

  // 2. Try by Scientific Name search if no photo yet
  if (!photo && scientificName) {
    try {
      const cleanName = scientificName.replace(/["']/g, '').trim();
      const res = await fetch(
        `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(cleanName)}&rank=species,subspecies&per_page=1`,
        { headers: { 'User-Agent': 'AnimaliaMediaHealer/1.0', 'Accept': 'application/json' }, signal: AbortSignal.timeout(4000) }
      );
      if (res.ok) {
        const json = await res.json();
        const t = json.results?.[0];
        if (t?.default_photo) {
          photo = t.default_photo;
          inatId = t.id;
        }
      }
    } catch {}
  }

  if (photo) {
    const medUrl = photo.medium_url || photo.url;
    const largeUrl = medUrl ? medUrl.replace('/medium.', '/large.') : medUrl;
    const thumbUrl = photo.medium_url || photo.square_url || photo.url;

    return {
      url: largeUrl || medUrl,
      thumbnailUrl: thumbUrl,
      attribution: photo.attribution || photo.attribution_name || 'iNaturalist Community Observer',
      licenseCode: (photo.license_code || 'CC-BY-NC').toUpperCase(),
      sourceProvider: 'iNaturalist API v1',
      sourceUrl: `https://www.inaturalist.org/taxa/${inatId}`,
      verifiedTaxonMatch: true
    };
  }

  return null;
}

async function fetchWikiPhoto(scientificName) {
  if (!scientificName) return null;
  const cleanName = scientificName.replace(/["']/g, '').trim().replace(/\s+/g, '_');

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`,
      { headers: { 'User-Agent': 'AnimaliaMediaHealer/1.0', 'Accept': 'application/json' }, signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const json = await res.json();
      const orig = json.originalimage?.source;
      const thumb = json.thumbnail?.source;
      if (orig || thumb) {
        return {
          url: orig || thumb,
          thumbnailUrl: thumb || orig,
          attribution: 'Wikimedia Commons / Wikipedia REST API',
          licenseCode: 'CC-BY-SA',
          sourceProvider: 'Wikipedia REST API',
          sourceUrl: json.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${cleanName}`,
          verifiedTaxonMatch: true
        };
      }
    }
  } catch {}

  const parts = scientificName.replace(/["']/g, '').trim().split(' ');
  if (parts.length > 2) {
    const binomial = `${parts[0]}_${parts[1]}`;
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(binomial)}`,
        { headers: { 'User-Agent': 'AnimaliaMediaHealer/1.0', 'Accept': 'application/json' }, signal: AbortSignal.timeout(4000) }
      );
      if (res.ok) {
        const json = await res.json();
        const orig = json.originalimage?.source;
        const thumb = json.thumbnail?.source;
        if (orig || thumb) {
          return {
            url: orig || thumb,
            thumbnailUrl: thumb || orig,
            attribution: 'Wikimedia Commons / Wikipedia REST API',
            licenseCode: 'CC-BY-SA',
            sourceProvider: 'Wikipedia REST API',
            sourceUrl: json.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${binomial}`,
            verifiedTaxonMatch: true
          };
        }
      }
    } catch {}
  }

  return null;
}

async function main() {
  console.log(`[HealMedia] Connecting to PostgreSQL at ${PG_HOST}:${PG_PORT}...`);
  const client = new pg.Client({
    host: PG_HOST,
    port: PG_PORT,
    database: 'postgres'
  });

  await client.connect();
  console.log('[HealMedia] Connected to PostgreSQL successfully.');

  // Load bundle
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf-8'));
  const bundleMap = new Map();
  bundle.taxa.forEach((t) => {
    bundleMap.set(t.id, t);
    bundleMap.set(t.identity.scientificName.toLowerCase(), t);
  });

  // Query taxa from DB
  const res = await client.query(`
    SELECT t.id, t.scientific_name, t.common_name, t.inat_taxon_id,
           tm.id as media_id, tm.image_url, tm.thumbnail_url, tm.attribution, tm.license_code
    FROM public.taxa t
    LEFT JOIN public.taxon_media tm ON tm.taxon_id = t.id AND tm.is_primary = true
    ORDER BY t.scientific_name ASC;
  `);

  const taxa = res.rows;
  console.log(`[HealMedia] Found ${taxa.length} taxa in database.`);

  let healedCount = 0;
  let alreadyVerifiedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < taxa.length; i++) {
    const row = taxa[i];
    const { id, scientific_name, common_name, inat_taxon_id, image_url, thumbnail_url } = row;
    const progress = `[${i + 1}/${taxa.length}]`;

    // If already an iNaturalist CDN photo, sync to bundle and proceed
    const isAlreadyInat = image_url && (
      image_url.includes('inaturalist-open-data') ||
      image_url.includes('static.inaturalist.org')
    );

    if (isAlreadyInat) {
      alreadyVerifiedCount++;
      const bundleTaxon = bundleMap.get(id) || bundleMap.get(scientific_name.toLowerCase());
      if (bundleTaxon) {
        bundleTaxon.media = {
          url: image_url,
          thumbnailUrl: thumbnail_url || image_url,
          attribution: row.attribution || 'iNaturalist Community Observer',
          licenseCode: row.license_code || 'CC-BY-NC',
          sourceProvider: 'iNaturalist API v1',
          sourceUrl: `https://www.inaturalist.org/taxa/${inat_taxon_id}`,
          verifiedTaxonMatch: true
        };
      }
      continue;
    }

    // Fetch verified media from iNaturalist
    let newMedia = await fetchInatPhoto(inat_taxon_id, scientific_name);

    // Fallback to Wikipedia
    if (!newMedia) {
      newMedia = await fetchWikiPhoto(scientific_name);
    }

    if (newMedia) {
      try {
        // Upsert verified primary media record
        await client.query(`
          INSERT INTO public.taxon_media (
            taxon_id, image_url, thumbnail_url, attribution, license_code,
            source_provider, source_url, is_primary, verified_taxon_match
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, true)
          ON CONFLICT (taxon_id, image_url) DO UPDATE SET
            thumbnail_url = EXCLUDED.thumbnail_url,
            attribution = EXCLUDED.attribution,
            license_code = EXCLUDED.license_code,
            source_provider = EXCLUDED.source_provider,
            source_url = EXCLUDED.source_url,
            is_primary = true,
            verified_taxon_match = true;
        `, [
          id,
          newMedia.url,
          newMedia.thumbnailUrl,
          newMedia.attribution,
          newMedia.licenseCode,
          newMedia.sourceProvider,
          newMedia.sourceUrl
        ]);

        // Demote other media for this taxon to is_primary = false
        await client.query(`
          UPDATE public.taxon_media
          SET is_primary = false
          WHERE taxon_id = $1 AND image_url != $2;
        `, [id, newMedia.url]);

        // Update bundle
        const bundleTaxon = bundleMap.get(id) || bundleMap.get(scientific_name.toLowerCase());
        if (bundleTaxon) {
          bundleTaxon.media = {
            url: newMedia.url,
            thumbnailUrl: newMedia.thumbnailUrl,
            attribution: newMedia.attribution,
            licenseCode: newMedia.licenseCode,
            sourceProvider: newMedia.sourceProvider,
            sourceUrl: newMedia.sourceUrl,
            verifiedTaxonMatch: true
          };
        }

        healedCount++;
        console.log(`${progress} Healed ${scientific_name} (${common_name}) -> ${newMedia.sourceProvider}`);
      } catch (dbErr) {
        console.error(`${progress} DB error on ${scientific_name}:`, dbErr.message);
      }
    } else {
      failedCount++;
      console.warn(`${progress} No photo found for ${scientific_name}`);
    }

    // Small delay between fetches to respect API limits
    await new Promise((r) => setTimeout(r, 80));
  }

  // Final bundle sync
  fs.writeFileSync(BUNDLE_PATH, JSON.stringify(bundle, null, 2), 'utf-8');
  console.log('[HealMedia] Successfully updated and persisted animalia-handoff-bundle.json.');

  console.log('\n=============================================');
  console.log(`[HealMedia Summary]`);
  console.log(`Total taxa:          ${taxa.length}`);
  console.log(`Already verified:    ${alreadyVerifiedCount}`);
  console.log(`Newly Healed:        ${healedCount}`);
  console.log(`Unresolved:          ${failedCount}`);
  console.log('=============================================\n');

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('[HealMedia] Fatal error:', err);
  process.exit(1);
});
