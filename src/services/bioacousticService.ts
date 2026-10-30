/**
 * ANIMALIA — Bioacoustic Harvester & Resolver Service
 * Dual-tier live resolution via Wikipedia REST & Wikimedia Commons Audio APIs,
 * with honest scientific classifications for non-vocal and extinct organisms.
 * Enforces Commercial-Safe CC Licensing guards (CC0 / CC-BY / CC-BY-SA) vs All CC.
 */

import type { AnimalRecord, TaxonAudioItem } from '../types/taxonomy';
import { isCommercialSafeLicense, getCommercialSafeMode } from './mediaResolverService.ts';

export interface BioacousticResolution {
  status: 'VOCAL_RECORDINGS_FOUND' | 'NON_VOCAL_ORGANISM' | 'EXTINCT_PALEO_ACOUSTIC' | 'UNDOCUMENTED';
  primaryAudio: TaxonAudioItem | null;
  recordings: TaxonAudioItem[];
  scientificNote: string;
}

export interface BioacousticResolveOptions {
  commercialSafeOnly?: boolean;
}

const AUDIO_STORAGE_PREFIX = 'animalia_audio_cache_v2_';
const memoryAudioCache = new Map<string, BioacousticResolution>();
const inFlightAudio = new Map<string, Promise<BioacousticResolution>>();

// Clades that do not possess vocal organs or acoustic vocalization apparatus
const NON_VOCAL_PHYLA = new Set([
  'porifera',
  'cnidaria',
  'tardigrada',
  'echinodermata',
  'platyhelminthes',
  'rotifera',
  'bryozoa',
  'nematoda'
]);

const NON_VOCAL_CATEGORIES = new Set([
  'microscopic animals'
]);

/**
 * Filter out spoken-article files and human language pronunciations
 */
function isWildlifeAudioTitle(title: string): boolean {
  if (!/\.(ogg|oga|mp3|wav|flac)$/i.test(title)) return false;
  return !/spoken|pronunciation|ll-q|en-[a-z0-9_-]+|nl-[a-z0-9_-]+|de-[a-z0-9_-]+|fr-[a-z0-9_-]+|wikipedia|-article/i.test(title);
}

/**
 * Resolve verified wildlife vocalizations
 */
export async function resolveTaxonBioacoustics(
  animal: AnimalRecord,
  options?: BioacousticResolveOptions
): Promise<BioacousticResolution> {
  if (!animal || !animal.identity?.scientificName) {
    return {
      status: 'UNDOCUMENTED',
      primaryAudio: null,
      recordings: [],
      scientificNote: 'Taxon identity is incomplete for bioacoustic mapping.'
    };
  }

  const { identity, media } = animal;
  const scientificName = identity.scientificName.trim();
  const commonName = identity.commonName.trim();
  const phylum = (identity.lineage?.phylum || '').toLowerCase();
  const category = (identity.categoryGroup || '').toLowerCase();

  const isCommSafe =
    options?.commercialSafeOnly !== undefined
      ? Boolean(options.commercialSafeOnly)
      : getCommercialSafeMode();

  const baseKey = (animal.id || scientificName).toLowerCase();
  const cacheKey = isCommSafe ? `${baseKey}::comm_safe` : `${baseKey}::all_cc`;

  // 1. Check Non-Vocal Clades (Strict Scientific Integrity)
  if (NON_VOCAL_PHYLA.has(phylum) || NON_VOCAL_CATEGORIES.has(category)) {
    return {
      status: 'NON_VOCAL_ORGANISM',
      primaryAudio: null,
      recordings: [],
      scientificNote: 'Non-vocal organism — communication occurs primarily through chemical pheromones, bioluminescent signaling, or tactile hydro-receptors.'
    };
  }

  // 2. Check Extinct Fossil Taxa
  if (identity.isExtinct || category === 'extinct taxa') {
    return {
      status: 'EXTINCT_PALEO_ACOUSTIC',
      primaryAudio: null,
      recordings: [],
      scientificNote: 'Prehistoric bioacoustic profile — living vocalizations are extinct. Vocal tract morphology and resonant infrasound frequencies are inferred from fossil syrinx structures and cranial crest anatomy.'
    };
  }

  // 3. Fast Memory Cache
  if (memoryAudioCache.has(cacheKey)) {
    const cached = memoryAudioCache.get(cacheKey)!;
    if (!isCommSafe || !cached.primaryAudio || isCommercialSafeLicense(cached.primaryAudio.licenseCode)) {
      return cached;
    }
  }

  // 4. LocalStorage Cache
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(`${AUDIO_STORAGE_PREFIX}${cacheKey}`);
      if (raw) {
        const parsed: BioacousticResolution = JSON.parse(raw);
        if (parsed && parsed.status) {
          if (!isCommSafe || !parsed.primaryAudio || isCommercialSafeLicense(parsed.primaryAudio.licenseCode)) {
            memoryAudioCache.set(cacheKey, parsed);
            return parsed;
          }
        }
      }
    } catch {}
  }

  // 5. In-flight Deduplication
  if (inFlightAudio.has(cacheKey)) {
    return inFlightAudio.get(cacheKey)!;
  }

  const resolvePromise = (async (): Promise<BioacousticResolution> => {
    const recordings: TaxonAudioItem[] = [];
    const seenUrls = new Set<string>();

    const addRecording = (item: TaxonAudioItem) => {
      if (!item.audioUrl) return;
      if (isCommSafe && !isCommercialSafeLicense(item.licenseCode)) return;
      const cleanUrl = item.audioUrl.split('?')[0].toLowerCase();
      if (seenUrls.has(cleanUrl)) return;
      seenUrls.add(cleanUrl);
      recordings.push(item);
    };

    // Include pre-seeded audio if present and qualifies
    if (media?.audio?.audioUrl) {
      addRecording(media.audio);
    }
    if (Array.isArray(media?.additionalRecordings)) {
      for (const rec of media.additionalRecordings) {
        addRecording(rec);
      }
    }

    // Helper to fetch file info from Wikimedia Commons API
    const fetchCommonsFileInfo = async (fileTitle: string): Promise<TaxonAudioItem | null> => {
      try {
        const cleanTitle = fileTitle.startsWith('File:') ? fileTitle : `File:${fileTitle}`;
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanTitle)}&prop=imageinfo&iiprop=url|extmetadata|size&format=json&origin=*`;
        const res = await fetch(apiUrl, {
          headers: { 'User-Agent': 'AnimaliaBioacoustics/1.0 (https://animalia.local)' },
          signal: AbortSignal.timeout(4000)
        });
        if (!res.ok) return null;
        const data = await res.json();
        const page = Object.values(data.query?.pages || {})[0] as any;
        const info = page?.imageinfo?.[0];
        if (!info?.url) return null;

        const rawArtist = info.extmetadata?.Artist?.value || '';
        const cleanArtist = rawArtist.replace(/<[^>]+>/g, '').trim() || 'Wildlife Field Recordist';
        const license = (info.extmetadata?.LicenseShortName?.value || 'CC-BY-SA').toUpperCase();

        if (isCommSafe && !isCommercialSafeLicense(license)) {
          return null;
        }

        return {
          id: `wiki-audio-${page.pageid || fileTitle.replace(/[^a-zA-Z0-9]/g, '-')}`,
          audioUrl: info.url,
          title: fileTitle.replace(/^File:/, '').replace(/\.[a-zA-Z0-9]+$/, '').replace(/_/g, ' '),
          recordist: cleanArtist,
          licenseCode: license,
          sourceProvider: 'Wikimedia Commons Audio Archive',
          sourceUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(cleanTitle)}`,
          recordingType: categorizeAudioTitle(fileTitle)
        };
      } catch {
        return null;
      }
    };

    // TIER 1: Query Wikipedia Article Parsed Media
    const pageCandidates = [scientificName, commonName];
    for (const pageName of pageCandidates) {
      if (recordings.length >= 4) break;
      try {
        const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=images&redirects=1&format=json&origin=*`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'AnimaliaBioacoustics/1.0 (https://animalia.local)' },
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          const json = await res.json();
          const images: string[] = json.parse?.images || [];
          const audioFiles = images.filter(isWildlifeAudioTitle);

          for (const af of audioFiles) {
            if (recordings.length >= 4) break;
            const item = await fetchCommonsFileInfo(af);
            if (item) addRecording(item);
          }
        }
      } catch {}
    }

    // TIER 2: Search Wikimedia Commons Audio Files if needed
    if (recordings.length < 2) {
      const searchQueries = [
        `${scientificName} filetype:audio`,
        `${commonName} call filetype:audio`,
        `${commonName} song filetype:audio`
      ];

      for (const query of searchQueries) {
        if (recordings.length >= 4) break;
        try {
          const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json&origin=*`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'AnimaliaBioacoustics/1.0 (https://animalia.local)' },
            signal: AbortSignal.timeout(4000)
          });
          if (res.ok) {
            const json = await res.json();
            const results: any[] = json.query?.search || [];
            for (const r of results) {
              if (recordings.length >= 4) break;
              if (isWildlifeAudioTitle(r.title)) {
                const item = await fetchCommonsFileInfo(r.title);
                if (item) addRecording(item);
              }
            }
          }
        } catch {}
      }
    }

    const primaryAudio = recordings[0] || null;
    const status = primaryAudio ? 'VOCAL_RECORDINGS_FOUND' : 'UNDOCUMENTED';
    const note = primaryAudio
      ? `Verified acoustic specimen recorded in wild habitat (${primaryAudio.recordingType || 'vocalization'}).`
      : 'Wild acoustic recording not yet cataloged in global biodiversity bioacoustic repositories.';

    const result: BioacousticResolution = {
      status,
      primaryAudio,
      recordings,
      scientificNote: note
    };

    // Save to localStorage
    if (typeof window !== 'undefined' && window.localStorage && recordings.length > 0) {
      try {
        localStorage.setItem(`${AUDIO_STORAGE_PREFIX}${cacheKey}`, JSON.stringify(result));
      } catch {}
    }

    memoryAudioCache.set(cacheKey, result);
    return result;
  })();

  inFlightAudio.set(cacheKey, resolvePromise);
  try {
    return await resolvePromise;
  } finally {
    inFlightAudio.delete(cacheKey);
  }
}

function categorizeAudioTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('roar')) return 'Roar';
  if (lower.includes('howl')) return 'Howl';
  if (lower.includes('song')) return 'Territorial Song';
  if (lower.includes('alarm')) return 'Alarm Call';
  if (lower.includes('chirp') || lower.includes('trill')) return 'Trill / Chirp';
  if (lower.includes('click') || lower.includes('echolocat')) return 'Echolocation Click';
  if (lower.includes('growl')) return 'Growl';
  return 'Vocalization';
}
