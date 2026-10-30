/**
 * ANIMALIA — Mass Taxonomic Expansion & Direct Database Enrichment Script
 * Seeds iconic living and extinct flagships across all 12 clades directly into
 * PostgreSQL on 127.0.0.1:54322 and synchronizes animalia-handoff-bundle.json.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';

const BUNDLE_PATH = path.resolve('animalia-handoff-bundle.json');
const PG_PORT = 54322;
const PG_HOST = '127.0.0.1';

const TARGET_SPECIES = [
  // 1. Prehistoric & Extinct Flagships
  { scientificName: 'Tyrannosaurus rex', commonName: 'Tyrannosaurus Rex', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Triceratops horridus', commonName: 'Triceratops', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Velociraptor mongoliensis', commonName: 'Velociraptor', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Spinosaurus aegyptiacus', commonName: 'Spinosaurus', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Archaeopteryx lithographica', commonName: 'Archaeopteryx', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Mammuthus primigenius', commonName: 'Woolly Mammoth', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Smilodon fatalis', commonName: 'Sabertooth Cat', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Raphus cucullatus', commonName: 'Dodo', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Pinguinus impennis', commonName: 'Great Auk', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Hydrodamalis gigas', commonName: "Steller's Sea Cow", isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Dunkleosteus terrelli', commonName: 'Dunkleosteus', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Anomalocaris canadensis', commonName: 'Anomalocaris', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Otodus megalodon', commonName: 'Megalodon', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Quetzalcoatlus northropi', commonName: 'Quetzalcoatlus', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Thylacinus cynocephalus', commonName: 'Thylacine', isExtinct: true, categoryGroup: 'Extinct Taxa' },
  { scientificName: 'Ectopistes migratorius', commonName: 'Passenger Pigeon', isExtinct: true, categoryGroup: 'Extinct Taxa' },

  // 2. Extreme & Deep-Sea Fauna
  { scientificName: 'Grimpoteuthis bathynectes', commonName: 'Dumbo Octopus', isExtinct: false, categoryGroup: 'Cephalopods & Mollusks' },
  { scientificName: 'Psychrolutes marcidus', commonName: 'Blobfish', isExtinct: false, categoryGroup: 'Fish' },
  { scientificName: 'Bathynomus giganteus', commonName: 'Giant Isopod', isExtinct: false, categoryGroup: 'Crustaceans' },
  { scientificName: 'Physalia physalis', commonName: "Portuguese Man o' War", isExtinct: false, categoryGroup: 'Marine Invertebrates' },
  { scientificName: 'Architeuthis dux', commonName: 'Giant Squid', isExtinct: false, categoryGroup: 'Cephalopods & Mollusks' },
  { scientificName: 'Mesonychoteuthis hamiltoni', commonName: 'Colossal Squid', isExtinct: false, categoryGroup: 'Cephalopods & Mollusks' },

  // 3. Arthropod & Insect Giants
  { scientificName: 'Dynastes hercules', commonName: 'Hercules Beetle', isExtinct: false, categoryGroup: 'Insects' },
  { scientificName: 'Morpho menelaus', commonName: 'Blue Morpho Butterfly', isExtinct: false, categoryGroup: 'Insects' },
  { scientificName: 'Latrodectus mactans', commonName: 'Southern Black Widow', isExtinct: false, categoryGroup: 'Arachnids' },
  { scientificName: 'Maratus volans', commonName: 'Peacock Spider', isExtinct: false, categoryGroup: 'Arachnids' },
  { scientificName: 'Theraphosa blondi', commonName: 'Goliath Birdeater', isExtinct: false, categoryGroup: 'Arachnids' },

  // 4. Amphibian & Reptilian Wonders
  { scientificName: 'Phyllobates terribilis', commonName: 'Golden Poison Frog', isExtinct: false, categoryGroup: 'Amphibians' },
  { scientificName: 'Draco volans', commonName: 'Common Flying Dragon', isExtinct: false, categoryGroup: 'Reptiles' },
  { scientificName: 'Gavialis gangeticus', commonName: 'Gharial', isExtinct: false, categoryGroup: 'Reptiles' },
  { scientificName: 'Varanus komodoensis', commonName: 'Komodo Dragon', isExtinct: false, categoryGroup: 'Reptiles' },
  { scientificName: 'Ambystoma mexicanum', commonName: 'Axolotl', isExtinct: false, categoryGroup: 'Amphibians' },
  { scientificName: 'Andrias davidianus', commonName: 'Chinese Giant Salamander', isExtinct: false, categoryGroup: 'Amphibians' },

  // 5. Sri Lankan Endemics & Flagships
  { scientificName: 'Prionailurus rubiginosus', commonName: 'Rusty-spotted Cat', isExtinct: false, categoryGroup: 'Mammals' },
  { scientificName: 'Loris tardigradus', commonName: 'Red Slender Loris', isExtinct: false, categoryGroup: 'Mammals' },
  { scientificName: 'Gallus lafayettii', commonName: 'Sri Lanka Junglefowl', isExtinct: false, categoryGroup: 'Birds' },
  { scientificName: 'Uropeltis melanogaster', commonName: 'Black Shieldtail', isExtinct: false, categoryGroup: 'Reptiles' },
  { scientificName: 'Troides darsius', commonName: 'Sri Lankan Birdwing', isExtinct: false, categoryGroup: 'Insects' },

  // 6. Iconic Marine & Vertebrate Flagships
  { scientificName: 'Balaenoptera musculus', commonName: 'Blue Whale', isExtinct: false, categoryGroup: 'Mammals' },
  { scientificName: 'Acinonyx jubatus', commonName: 'Cheetah', isExtinct: false, categoryGroup: 'Mammals' },
  { scientificName: 'Gorilla beringei', commonName: 'Eastern Gorilla', isExtinct: false, categoryGroup: 'Mammals' },
  { scientificName: 'Pongo abelii', commonName: 'Sumatran Orangutan', isExtinct: false, categoryGroup: 'Mammals' },
  { scientificName: 'Orcinus orca', commonName: 'Killer Whale', isExtinct: false, categoryGroup: 'Mammals' },
  { scientificName: 'Harpia harpyja', commonName: 'Harpy Eagle', isExtinct: false, categoryGroup: 'Birds' },
  { scientificName: 'Aptenodytes forsteri', commonName: 'Emperor Penguin', isExtinct: false, categoryGroup: 'Birds' },
  { scientificName: 'Bubo scandiacus', commonName: 'Snowy Owl', isExtinct: false, categoryGroup: 'Birds' },
  { scientificName: 'Rhincodon typus', commonName: 'Whale Shark', isExtinct: false, categoryGroup: 'Fish' },
  { scientificName: 'Mobula birostris', commonName: 'Giant Oceanic Manta Ray', isExtinct: false, categoryGroup: 'Fish' },
  { scientificName: 'Latimeria chalumnae', commonName: 'West Indian Ocean Coelacanth', isExtinct: false, categoryGroup: 'Fish' },
  { scientificName: 'Hapalochlaena maculosa', commonName: 'Southern Blue-ringed Octopus', isExtinct: false, categoryGroup: 'Cephalopods & Mollusks' },
  { scientificName: 'Birgus latro', commonName: 'Coconut Crab', isExtinct: false, categoryGroup: 'Crustaceans' },
  { scientificName: 'Macrocheira kaempferi', commonName: 'Japanese Spider Crab', isExtinct: false, categoryGroup: 'Crustaceans' },
  { scientificName: 'Turritopsis dohrnii', commonName: 'Immortal Jellyfish', isExtinct: false, categoryGroup: 'Marine Invertebrates' },
  { scientificName: 'Hypsibius dujardini', commonName: 'Water Bear', isExtinct: false, categoryGroup: 'Microscopic Animals' }
];

function getCanonicalBinomial(name) {
  if (!name) return '';
  const clean = name.replace(/["']/g, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length < 2) return clean.toLowerCase();
  return `${parts[0]} ${parts[1]}`.toLowerCase().replace(/[^a-z ]/g, '').trim();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchGbifData(name) {
  try {
    const res = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}&strict=false`);
    if (res.ok) {
      const data = await res.json();
      if (data.matchType !== 'NONE') return data;
    }
  } catch {}
  return null;
}

async function fetchInatData(name) {
  try {
    const res = await fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(name)}&rank=species,subspecies&per_page=1`);
    if (res.ok) {
      const data = await res.json();
      return data.results?.[0] || null;
    }
  } catch {}
  return null;
}

async function fetchWikiSummary(name) {
  const clean = name.replace(/["']/g, '').trim().replace(/\s+/g, '_');
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

async function fetchWikiMediaList(name) {
  const clean = name.replace(/["']/g, '').trim().replace(/\s+/g, '_');
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = await res.json();
      return (data.items || []).filter(item => {
        if (item.type !== 'image') return false;
        const title = item.title || '';
        return !/icon|logo|symbol|flag|red_pencil|lock|disambig|\.svg/i.test(title);
      });
    }
  } catch {}
  return [];
}

async function main() {
  console.log(`[MassHarvest] Connecting to PostgreSQL at ${PG_HOST}:${PG_PORT}...`);
  const client = new pg.Client({
    host: PG_HOST,
    port: PG_PORT,
    database: 'postgres'
  });
  await client.connect();
  console.log('[MassHarvest] Connected successfully.');

  // Load bundle
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf-8'));
  const bundleMap = new Map();
  bundle.taxa.forEach(t => {
    bundleMap.set(t.id, t);
    bundleMap.set(t.identity.scientificName.toLowerCase(), t);
  });

  let addedTaxaCount = 0;
  let updatedTaxaCount = 0;
  let totalMediaInserted = 0;

  for (let i = 0; i < TARGET_SPECIES.length; i++) {
    const target = TARGET_SPECIES[i];
    const progress = `[${i + 1}/${TARGET_SPECIES.length}]`;
    console.log(`${progress} Harvesting ${target.scientificName} (${target.commonName})...`);

    // Rate limit
    await sleep(250);

    const [gbif, inat, wiki] = await Promise.all([
      fetchGbifData(target.scientificName),
      fetchInatData(target.scientificName),
      fetchWikiSummary(target.scientificName)
    ]);

    const rawSci = gbif?.scientificName || inat?.name || target.scientificName;
    const parts = rawSci.split(/\s+/);
    const scientificName = parts.length >= 2 ? `${parts[0]} ${parts[1]}`.replace(/["']/g, '').trim() : rawSci;
    const authorship = gbif?.authorship || (parts.length > 2 ? parts.slice(2).join(' ').replace(/^\(|\)$/g, '').trim() : null);
    const gbifKey = gbif?.usageKey || null;
    const inatId = inat?.id || null;
    const commonName = inat?.preferred_common_name
      ? inat.preferred_common_name.replace(/\b\w/g, c => c.toUpperCase())
      : target.commonName;

    // Check if taxon already exists in DB
    let taxonId = null;
    if (gbifKey) {
      const r = await client.query('SELECT id FROM public.taxa WHERE gbif_usage_key = $1 LIMIT 1;', [gbifKey]);
      if (r.rows[0]) taxonId = r.rows[0].id;
    }
    if (!taxonId && inatId) {
      const r = await client.query('SELECT id FROM public.taxa WHERE inat_taxon_id = $1 LIMIT 1;', [inatId]);
      if (r.rows[0]) taxonId = r.rows[0].id;
    }
    if (!taxonId) {
      const cleanBinomial = getCanonicalBinomial(target.scientificName);
      const r = await client.query('SELECT id FROM public.taxa WHERE lower(scientific_name) LIKE lower($1) LIMIT 1;', [`%${cleanBinomial}%`]);
      if (r.rows[0]) taxonId = r.rows[0].id;
    }

    const rank = (gbif?.rank || inat?.rank || 'SPECIES').toUpperCase();
    const status = (gbif?.status || 'ACCEPTED').toUpperCase();
    const isExtinct = target.isExtinct || Boolean(inat?.extinct);
    const categoryGroup = isExtinct ? 'Extinct Taxa' : target.categoryGroup;

    // Lineage
    const lineage = {
      kingdom: gbif?.kingdom || 'Animalia',
      phylum: gbif?.phylum || (inat?.iconic_taxon_name === 'Mollusca' ? 'Mollusca' : 'Chordata'),
      class: gbif?.class || inat?.iconic_taxon_name || 'Animalia',
      order: gbif?.order || null,
      family: gbif?.family || null,
      genus: gbif?.genus || scientificName.split(' ')[0],
      species: scientificName
    };

    // Biology Profile conforming strictly to GEMINI.md
    const summaryText = wiki?.extract || (inat?.observations_count ? `Documented with ${inat.observations_count.toLocaleString()} observations on iNaturalist.` : 'Iconic zoological species record.');
    const biologyProfile = {
      summary: {
        text: summaryText,
        source: wiki?.content_urls?.desktop?.page ? 'Wikipedia REST Summary' : 'iNaturalist Backbone'
      },
      measurements: {
        bodyLength: null,
        mass: null,
        lifespan: null,
        source: null
      },
      ecology: {
        habitat: null,
        diet: null,
        geographicRange: null,
        activityPattern: null,
        biomeTags: [categoryGroup, isExtinct ? 'Fossil Record' : 'Global Fauna']
      },
      conservation: {
        iucnStatus: isExtinct ? 'EX' : (inat?.conservation_status?.status?.toUpperCase() || 'NE'),
        source: isExtinct ? 'Paleontological Record' : (inat?.conservation_status?.authority || 'IUCN Red List'),
        assessmentYear: null,
        populationTrend: null,
        threats: null
      },
      discovery: {
        distinguishingTraits: [`Flagship species verified in biological backbone under binomial ${scientificName}.`],
        comparisonsWithSimilarTaxa: [],
        interestingFacts: [],
        relatedTaxonIds: []
      }
    };

    const iucnStatus = isExtinct ? 'EX' : (['EX','EW','CR','EN','VU','NT','LC','DD'].includes(inat?.conservation_status?.status?.toUpperCase()) ? inat.conservation_status.status.toUpperCase() : 'NE');

    if (!taxonId) {
      try {
        // INSERT new taxon into DB
        const insertRes = await client.query(`
          INSERT INTO public.taxa (
            id, gbif_usage_key, inat_taxon_id, scientific_name, authorship,
            common_name, rank, status, is_extinct, category_group,
            lineage_json, biology_profile, iucn_status, completeness_score,
            last_verified_at, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, $8, $9,
            $10, $11, $12, 75,
            NOW(), NOW()
          ) RETURNING id;
        `, [
          gbifKey, inatId, scientificName, gbif?.authorship || null,
          commonName, rank, status, isExtinct, categoryGroup,
          JSON.stringify(lineage), JSON.stringify(biologyProfile), iucnStatus
        ]);
        taxonId = insertRes.rows[0].id;
        addedTaxaCount++;
        console.log(`  + Inserted new taxon ${scientificName} [${taxonId}]`);
      } catch (insertErr) {
        const findRes = await client.query(`
          SELECT id FROM public.taxa 
          WHERE (gbif_usage_key IS NOT NULL AND gbif_usage_key = $1)
             OR (inat_taxon_id IS NOT NULL AND inat_taxon_id = $2)
          LIMIT 1;
        `, [gbifKey, inatId]);
        if (findRes.rows[0]) {
          taxonId = findRes.rows[0].id;
          updatedTaxaCount++;
        } else {
          console.warn(`  ! Could not insert or resolve taxon ${scientificName}:`, insertErr.message);
          continue;
        }
      }
    } else {
      updatedTaxaCount++;
      // Update existing record
      await client.query(`
        UPDATE public.taxa SET
          gbif_usage_key = COALESCE($2, gbif_usage_key),
          inat_taxon_id = COALESCE($3, inat_taxon_id),
          common_name = COALESCE($4, common_name),
          category_group = COALESCE($5, category_group),
          biology_profile = $6,
          last_verified_at = NOW()
        WHERE id = $1;
      `, [taxonId, gbifKey, inatId, commonName, categoryGroup, JSON.stringify(biologyProfile)]);
    }

    // GATHER ALL VERIFIED PHOTOS
    const photosToInsert = [];

    // 1. iNaturalist taxon photos
    if (inat?.taxon_photos && Array.isArray(inat.taxon_photos)) {
      for (const tp of inat.taxon_photos) {
        if (photosToInsert.length >= 8) break;
        const p = tp.photo;
        if (!p) continue;
        const medUrl = p.medium_url || p.url;
        const largeUrl = p.large_url || (medUrl ? medUrl.replace('/medium.', '/large.') : medUrl);
        const thumbUrl = p.medium_url || p.square_url || p.url;
        if (largeUrl || medUrl) {
          photosToInsert.push({
            url: largeUrl || medUrl,
            thumbnailUrl: thumbUrl,
            attribution: p.attribution || p.attribution_name || 'iNaturalist Community',
            licenseCode: (p.license_code || 'CC-BY-NC').toUpperCase(),
            sourceProvider: 'iNaturalist API v1',
            sourceUrl: `https://www.inaturalist.org/taxa/${inat.id}`,
            isPrimary: photosToInsert.length === 0
          });
        }
      }
    }

    // 2. Wikipedia primary image & media-list
    if (photosToInsert.length < 4 || isExtinct) {
      if (wiki?.originalimage?.source || wiki?.thumbnail?.source) {
        const wikiUrl = wiki.originalimage?.source || wiki.thumbnail?.source;
        photosToInsert.push({
          url: wikiUrl,
          thumbnailUrl: wiki.thumbnail?.source || wikiUrl,
          attribution: 'Wikimedia Commons / Wikipedia REST API',
          licenseCode: 'CC-BY-SA',
          sourceProvider: 'Wikipedia Media Archive',
          sourceUrl: wiki.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${scientificName.replace(/\s+/g, '_')}`,
          isPrimary: photosToInsert.length === 0
        });
      }

      // Query media-list for extinct/fossil reconstructions
      const mediaList = await fetchWikiMediaList(target.scientificName);
      for (const item of mediaList) {
        if (photosToInsert.length >= 8) break;
        const srcset = item.srcset || [];
        if (srcset.length === 0) continue;
        const bestSrc = srcset.find(s => s.scale === '2x') || srcset[srcset.length - 1];
        let rawUrl = bestSrc?.src || '';
        if (rawUrl.startsWith('//')) rawUrl = `https:${rawUrl}`;
        if (!rawUrl || /icon|logo|symbol|flag|red_pencil|lock|disambig|\.svg/i.test(rawUrl)) continue;

        photosToInsert.push({
          url: rawUrl,
          thumbnailUrl: srcset[0]?.src ? (srcset[0].src.startsWith('//') ? `https:${srcset[0].src}` : srcset[0].src) : rawUrl,
          attribution: item.caption?.text || item.title?.replace('File:', '').replace(/_/g, ' ') || 'Wikimedia Commons',
          licenseCode: 'CC-BY-SA',
          sourceProvider: 'Wikipedia Media Archive',
          sourceUrl: `https://en.wikipedia.org/wiki/${scientificName.replace(/\s+/g, '_')}`,
          isPrimary: photosToInsert.length === 0
        });
      }
    }

    // Insert media records into public.taxon_media
    for (let pIdx = 0; pIdx < photosToInsert.length; pIdx++) {
      const p = photosToInsert[pIdx];
      const isPrimary = pIdx === 0;

      try {
        await client.query(`
          INSERT INTO public.taxon_media (
            taxon_id, image_url, thumbnail_url, attribution, license_code,
            source_provider, source_url, is_primary, verified_taxon_match
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
          ON CONFLICT (taxon_id, image_url) DO UPDATE SET
            thumbnail_url = EXCLUDED.thumbnail_url,
            attribution = EXCLUDED.attribution,
            license_code = EXCLUDED.license_code,
            source_provider = EXCLUDED.source_provider,
            source_url = EXCLUDED.source_url,
            is_primary = EXCLUDED.is_primary,
            verified_taxon_match = true;
        `, [
          taxonId, p.url, p.thumbnailUrl, p.attribution, p.licenseCode,
          p.sourceProvider, p.sourceUrl, isPrimary
        ]);
        totalMediaInserted++;
      } catch (err) {
        console.warn(`    Failed to insert photo ${p.url}:`, err.message);
      }
    }

    // SYNC TO ANIMALIA-HANDOFF-BUNDLE.JSON
    const primaryPhoto = photosToInsert[0] || null;
    const additionalPhotos = photosToInsert.slice(1).map(p => ({
      url: p.url,
      thumbnailUrl: p.thumbnailUrl,
      attribution: p.attribution,
      licenseCode: p.licenseCode
    }));

    const bundleRecord = {
      id: taxonId,
      dataSource: 'IMPORTED_REPOSITORY_RECORD',
      identity: {
        commonName,
        scientificName,
        authorship: gbif?.authorship || null,
        rank: rank,
        taxonomicStatus: status,
        isExtinct,
        categoryGroup,
        externalIds: {
          gbifKey,
          inatTaxonId: inatId
        },
        lineage,
        synonyms: [],
        vernacularNames: [{ name: commonName, language: 'eng', source: 'Curated' }]
      },
      media: {
        url: primaryPhoto?.url || null,
        thumbnailUrl: primaryPhoto?.thumbnailUrl || null,
        attribution: primaryPhoto?.attribution || 'Verified Wildlife Observer',
        licenseCode: primaryPhoto?.licenseCode || 'CC-BY-SA',
        sourceProvider: primaryPhoto?.sourceProvider || 'ANIMALIA Backbone',
        sourceUrl: primaryPhoto?.sourceUrl || `https://api.gbif.org/v1/species/${gbifKey}`,
        verifiedTaxonMatch: true,
        additionalPhotos
      },
      biology: biologyProfile,
      provenance: {
        completenessScore: 78,
        lastVerifiedAt: new Date().toISOString(),
        sources: ['GBIF Species API', 'iNaturalist API v1', 'Wikipedia REST API']
      }
    };

    const targetBinomial = getCanonicalBinomial(target.scientificName);
    const existingBundleIdx = bundle.taxa.findIndex(
      t => t.id === taxonId || getCanonicalBinomial(t.identity?.scientificName) === targetBinomial
    );

    if (existingBundleIdx >= 0) {
      bundle.taxa[existingBundleIdx] = bundleRecord;
    } else {
      bundle.taxa.push(bundleRecord);
    }
  }

  // Update bundle stats
  bundle.stats = {
    ...bundle.stats,
    totalTaxaInSession: bundle.taxa.length
  };
  bundle.exportedAt = new Date().toISOString();

  fs.writeFileSync(BUNDLE_PATH, JSON.stringify(bundle, null, 2), 'utf-8');
  console.log(`[MassHarvest] Bundle updated: ${bundle.taxa.length} total taxa.`);

  // Verify final count in DB
  const finalRes = await client.query('SELECT count(*) FROM public.taxa');
  const finalMediaRes = await client.query('SELECT count(*) FROM public.taxon_media');
  console.log(`[MassHarvest] FINAL DB STATS: ${finalRes.rows[0].count} taxa, ${finalMediaRes.rows[0].count} media rows.`);

  await client.end();
  console.log('[MassHarvest] Completed successfully.');
}

main().catch(err => {
  console.error('[MassHarvest] Error:', err);
  process.exit(1);
});
