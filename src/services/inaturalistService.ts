import type { AnimalRecord, IucnRedListCode } from '../types/taxonomy.ts';

export function mapIconicTaxonToCategory(iconicTaxonName?: string | null, className: string = ''): string {
  const cls = (className || '').toLowerCase();
  const iconic = (iconicTaxonName || '').toLowerCase();

  if (iconic === 'mammalia' || cls === 'mammalia') return 'Mammals';
  if (iconic === 'aves' || cls === 'aves') return 'Birds';
  if (iconic === 'reptilia' || cls === 'reptilia') return 'Reptiles';
  if (iconic === 'amphibia' || cls === 'amphibia') return 'Amphibians';
  if (
    iconic === 'actinopterygii' ||
    cls.includes('actinopterygii') ||
    cls.includes('chondrichthyes') ||
    cls.includes('sarcopterygii')
  ) {
    return 'Fish';
  }
  if (iconic === 'insecta' || cls === 'insecta') return 'Insects';
  if (iconic === 'arachnida' || cls === 'arachnida') return 'Arachnids';
  if (
    iconic === 'mollusca' ||
    cls.includes('cephalopoda') ||
    cls.includes('gastropoda') ||
    cls.includes('bivalvia')
  ) {
    return 'Cephalopods & Mollusks';
  }
  if (cls.includes('malacostraca') || cls.includes('crustacea') || cls.includes('maxillopoda')) {
    return 'Crustaceans';
  }
  if (cls.includes('tardigrada') || cls.includes('rotifera')) {
    return 'Microscopic Animals';
  }
  return 'Marine Invertebrates';
}

export async function searchLiveBiodiversityGlobal(query: string): Promise<AnimalRecord[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query.trim())}&rank=species,subspecies&is_active=true&per_page=12`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`iNaturalist API returned HTTP ${res.status}`);
  }

  const data = await res.json();
  const results = (data.results || []).filter(
    (t: any) =>
      t.iconic_taxon_name &&
      !['Plantae', 'Fungi', 'Protozoa', 'Chromista'].includes(t.iconic_taxon_name)
  );

  return results.map((t: any): AnimalRecord => {
    const photo = t.default_photo || null;
    const iucnRaw = t.conservation_status?.status_name || t.conservation_status?.status || 'NE';
    const normalizedIucn: IucnRedListCode = ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD'].includes(
      String(iucnRaw).toUpperCase()
    )
      ? (String(iucnRaw).toUpperCase() as IucnRedListCode)
      : 'NE';

    return {
      id: `live-inat-${t.id}`,
      dataSource: 'LIVE_API_RESULT',
      identity: {
        commonName: t.preferred_common_name
          ? t.preferred_common_name.replace(/\b\w/g, (c: string) => c.toUpperCase())
          : t.name,
        scientificName: t.name,
        authorship: null,
        rank: (t.rank || 'SPECIES').toUpperCase() as any,
        taxonomicStatus: 'ACCEPTED',
        isExtinct: Boolean(t.extinct),
        categoryGroup: t.extinct ? 'Extinct Taxa' : mapIconicTaxonToCategory(t.iconic_taxon_name),
        externalIds: {
          gbifKey: null,
          inatTaxonId: t.id
        },
        lineage: {
          kingdom: 'Animalia',
          phylum: t.iconic_taxon_name === 'Mollusca' ? 'Mollusca' : 'Chordata / Arthropoda',
          class: t.iconic_taxon_name || 'Animalia',
          order: null,
          family: null,
          genus: t.name.split(' ')[0] || null,
          species: t.name
        },
        synonyms: [],
        vernacularNames: t.preferred_common_name
          ? [{ name: t.preferred_common_name, language: 'eng', source: 'iNaturalist' }]
          : []
      },
      media: {
        url: photo?.large_url || photo?.medium_url || null,
        thumbnailUrl: photo?.medium_url || photo?.square_url || null,
        attribution: photo?.attribution || 'iNaturalist Community Observer',
        licenseCode: (photo?.license_code || 'CC-BY-NC').toUpperCase(),
        sourceProvider: 'iNaturalist API v1',
        sourceUrl: `https://www.inaturalist.org/taxa/${t.id}`,
        verifiedTaxonMatch: true,
        additionalPhotos: (t.taxon_photos || [])
          .slice(0, 6)
          .map((tp: any) => ({
            url: tp.photo?.large_url || tp.photo?.medium_url,
            attribution: tp.photo?.attribution || 'iNaturalist',
            licenseCode: (tp.photo?.license_code || 'CC').toUpperCase()
          }))
          .filter((p: any) => Boolean(p.url))
      },
      biology: {
        summary: {
          text: t.wikipedia_summary
            ? t.wikipedia_summary.replace(/<[^>]+>/g, '')
            : `Live biodiversity record retrieved from iNaturalist (Taxon #${t.id}) with ${t.observations_count?.toLocaleString() || 0} global community observations.`,
          source: 'iNaturalist / Wikipedia Summary'
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
          biomeTags: [
            t.iconic_taxon_name || 'Biodiversity',
            `${(t.observations_count || 0).toLocaleString()} Observations`
          ]
        },
        conservation: {
          iucnStatus: t.extinct ? 'EX' : normalizedIucn,
          source: t.conservation_status?.authority || 'iNaturalist Taxon Status',
          assessmentYear: null,
          populationTrend: null,
          threats: null
        },
        discovery: {
          distinguishingTraits: [`Verified in global biodiversity index under scientific binomial ${t.name}.`],
          comparisonsWithSimilarTaxa: [],
          interestingFacts: [
            {
              fact: `Documented by ${t.observations_count?.toLocaleString() || 0} research-grade and community wildlife observations in iNaturalist.`,
              reference: `https://www.inaturalist.org/taxa/${t.id}`
            }
          ],
          relatedTaxonIds: []
        }
      },
      provenance: {
        completenessScore: 68,
        lastVerifiedAt: new Date().toISOString(),
        sources: ['iNaturalist API v1']
      }
    };
  });
}

export const CATEGORY_ICONIC_MAP: Record<string, number | number[]> = {
  'Mammals': 40151,
  'Birds': 3,
  'Reptiles': 26036,
  'Amphibians': 20978,
  'Fish': [47178, 47273],
  'Insects': 47158,
  'Arachnids': 47119,
  'Cephalopods & Mollusks': 47115,
  'Crustaceans': 47125,
  'Marine Invertebrates': 1,
  'Microscopic Animals': 1,
  'ALL': 1
};

/**
 * Fetch a paginated stream of species from iNaturalist API or GBIF Species API for extinct taxa
 */
export async function fetchGlobalCladeTaxaPage(
  categoryGroup: string,
  page: number,
  perPage: number = 24
): Promise<AnimalRecord[]> {
  // If extinct category selected, query GBIF Extinct species and enrich with Wikipedia
  if (categoryGroup === 'Extinct Taxa') {
    const offset = (page - 1) * perPage;
    const gbifUrl = `https://api.gbif.org/v1/species/search?datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&status=ACCEPTED&isExtinct=true&rank=SPECIES&highertaxonKey=1&limit=${perPage}&offset=${offset}`;
    try {
      const res = await fetch(gbifUrl);
      if (!res.ok) throw new Error(`GBIF Species API returned HTTP ${res.status}`);
      const data = await res.json();
      const results = data.results || [];

      const enrichedRecords: AnimalRecord[] = [];
      for (const item of results) {
        const cleanName = (item.scientificName || '').split(' ')[0] + ' ' + ((item.scientificName || '').split(' ')[1] || '');
        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName.replace(/\s+/g, '_'))}`).catch(() => null);
        const wikiData = wikiRes && wikiRes.ok ? await wikiRes.json().catch(() => null) : null;

        const photoUrl = wikiData?.originalimage?.source || wikiData?.thumbnail?.source || null;

        enrichedRecords.push({
          id: `gbif-extinct-${item.key}`,
          dataSource: 'LIVE_API_RESULT',
          identity: {
            commonName: item.vernacularName || wikiData?.title || cleanName.trim(),
            scientificName: item.scientificName || cleanName.trim(),
            authorship: item.authorship || null,
            rank: 'SPECIES',
            taxonomicStatus: 'ACCEPTED',
            isExtinct: true,
            categoryGroup: 'Extinct Taxa',
            externalIds: {
              gbifKey: item.key,
              inatTaxonId: null
            },
            lineage: {
              kingdom: item.kingdom || 'Animalia',
              phylum: item.phylum || null,
              class: item.class || null,
              order: item.order || null,
              family: item.family || null,
              genus: item.genus || null,
              species: item.scientificName
            },
            synonyms: [],
            vernacularNames: item.vernacularName ? [{ name: item.vernacularName, language: 'eng', source: 'GBIF' }] : []
          },
          media: {
            url: photoUrl,
            thumbnailUrl: wikiData?.thumbnail?.source || photoUrl,
            attribution: photoUrl ? 'Wikimedia Commons / Wikipedia REST' : 'Specimen Silhouette',
            licenseCode: 'CC-BY-SA',
            sourceProvider: 'Wikipedia Media Archive',
            sourceUrl: wikiData?.content_urls?.desktop?.page || `https://www.gbif.org/species/${item.key}`,
            verifiedTaxonMatch: Boolean(photoUrl),
            additionalPhotos: []
          },
          biology: {
            summary: {
              text: wikiData?.extract || `Extinct biological taxon documented in GBIF paleontological record (Key #${item.key}).`,
              source: wikiData?.content_urls?.desktop?.page ? 'Wikipedia REST Summary' : 'GBIF Backbone Taxonomy'
            },
            measurements: { bodyLength: null, mass: null, lifespan: null, source: null },
            ecology: { habitat: null, diet: null, geographicRange: null, activityPattern: null, biomeTags: ['Extinct Lineage', 'Paleontological Specimen'] },
            conservation: { iucnStatus: 'EX', source: 'GBIF Fossil Record', assessmentYear: null, populationTrend: null, threats: null },
            discovery: { distinguishingTraits: [`Fossil taxon cataloged in GBIF under key ${item.key}.`], comparisonsWithSimilarTaxa: [], interestingFacts: [], relatedTaxonIds: [] }
          },
          provenance: {
            completenessScore: 70,
            lastVerifiedAt: new Date().toISOString(),
            sources: ['GBIF Species API', 'Wikipedia REST API']
          }
        });
      }
      return enrichedRecords;
    } catch (err) {
      console.warn('[inaturalistService] Failed to fetch extinct taxa from GBIF:', err);
      return [];
    }
  }

  // Standard living categories via iNaturalist API
  const iconicTarget = CATEGORY_ICONIC_MAP[categoryGroup] || 1;
  const iconicParam = Array.isArray(iconicTarget) ? iconicTarget.join(',') : iconicTarget;

  const url = `https://api.inaturalist.org/v1/taxa?taxon_id=${iconicParam}&rank=species&is_active=true&per_page=${perPage}&page=${page}&order=desc&order_by=observations_count`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`iNaturalist API returned HTTP ${res.status}`);
  }

  const data = await res.json();
  const results = (data.results || []).filter(
    (t: any) =>
      t.iconic_taxon_name &&
      !['Plantae', 'Fungi', 'Protozoa', 'Chromista'].includes(t.iconic_taxon_name)
  );

  return results.map((t: any): AnimalRecord => {
    const photo = t.default_photo || null;
    const iucnRaw = t.conservation_status?.status_name || t.conservation_status?.status || 'NE';
    const normalizedIucn: IucnRedListCode = ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD'].includes(
      String(iucnRaw).toUpperCase()
    )
      ? (String(iucnRaw).toUpperCase() as IucnRedListCode)
      : 'NE';

    return {
      id: `live-inat-${t.id}`,
      dataSource: 'LIVE_API_RESULT',
      identity: {
        commonName: t.preferred_common_name
          ? t.preferred_common_name.replace(/\b\w/g, (c: string) => c.toUpperCase())
          : t.name,
        scientificName: t.name,
        authorship: null,
        rank: (t.rank || 'SPECIES').toUpperCase() as any,
        taxonomicStatus: 'ACCEPTED',
        isExtinct: Boolean(t.extinct),
        categoryGroup: t.extinct ? 'Extinct Taxa' : mapIconicTaxonToCategory(t.iconic_taxon_name),
        externalIds: {
          gbifKey: null,
          inatTaxonId: t.id
        },
        lineage: {
          kingdom: 'Animalia',
          phylum: t.iconic_taxon_name === 'Mollusca' ? 'Mollusca' : 'Chordata / Arthropoda',
          class: t.iconic_taxon_name || 'Animalia',
          order: null,
          family: null,
          genus: t.name.split(' ')[0] || null,
          species: t.name
        },
        synonyms: [],
        vernacularNames: t.preferred_common_name
          ? [{ name: t.preferred_common_name, language: 'eng', source: 'iNaturalist' }]
          : []
      },
      media: {
        url: photo?.large_url || photo?.medium_url || null,
        thumbnailUrl: photo?.medium_url || photo?.square_url || null,
        attribution: photo?.attribution || 'iNaturalist Community Observer',
        licenseCode: (photo?.license_code || 'CC-BY-NC').toUpperCase(),
        sourceProvider: 'iNaturalist API v1',
        sourceUrl: `https://www.inaturalist.org/taxa/${t.id}`,
        verifiedTaxonMatch: true,
        additionalPhotos: (t.taxon_photos || [])
          .slice(0, 6)
          .map((tp: any) => ({
            url: tp.photo?.large_url || tp.photo?.medium_url,
            attribution: tp.photo?.attribution || 'iNaturalist',
            licenseCode: (tp.photo?.license_code || 'CC').toUpperCase()
          }))
          .filter((p: any) => Boolean(p.url))
      },
      biology: {
        summary: {
          text: t.wikipedia_summary
            ? t.wikipedia_summary.replace(/<[^>]+>/g, '')
            : `Live biodiversity record retrieved from iNaturalist (Taxon #${t.id}) with ${(t.observations_count || 0).toLocaleString()} global observations.`,
          source: 'iNaturalist / Wikipedia Summary'
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
          biomeTags: [
            t.iconic_taxon_name || 'Biodiversity',
            `${(t.observations_count || 0).toLocaleString()} Observations`
          ]
        },
        conservation: {
          iucnStatus: t.extinct ? 'EX' : normalizedIucn,
          source: t.conservation_status?.authority || 'iNaturalist Taxon Status',
          assessmentYear: null,
          populationTrend: null,
          threats: null
        },
        discovery: {
          distinguishingTraits: [`Verified in global biodiversity index under scientific binomial ${t.name}.`],
          comparisonsWithSimilarTaxa: [],
          interestingFacts: [
            {
              fact: `Documented by ${(t.observations_count || 0).toLocaleString()} research-grade and community observations.`,
              reference: `https://www.inaturalist.org/taxa/${t.id}`
            }
          ],
          relatedTaxonIds: []
        }
      },
      provenance: {
        completenessScore: 72,
        lastVerifiedAt: new Date().toISOString(),
        sources: ['iNaturalist API v1']
      }
    };
  });
}
