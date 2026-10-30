import type { AnimalRecord } from '../types/taxonomy.ts';

export interface CladeMatchResult {
  phylum: boolean;
  class: boolean;
  order: boolean;
  family: boolean;
  genus: boolean;
  isExactMatch: boolean;
  matchCount: number; // 0 to 6 (phylum..genus + exact)
}

export interface DailyMysteryState {
  lastPlayedDate: string;
  dayNumber: number;
  streak: number;
  totalSolved: number;
  totalPlayed: number;
  todayGuesses: string[]; // taxon IDs
  todaySolved: boolean;
  todayRevealedClues: number; // 1 to 5
  guessHistory: {
    taxonId: string;
    commonName: string;
    scientificName: string;
    cladeMatches: CladeMatchResult;
  }[];
}

const EPOCH_DATE_STRING = '2026-06-10T00:00:00Z';
const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'over', 'under', 'near']);

/**
 * Calculates deterministic day number relative to epoch 2026-06-10.
 * On 2026-10-30, returns 142.
 */
export function getDailyDayNumber(dateStr?: string): number {
  const targetDate = dateStr ? new Date(`${dateStr}T00:00:00Z`) : new Date();
  const epoch = new Date(EPOCH_DATE_STRING);
  const diffMs = targetDate.getTime() - epoch.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Deterministic djb2 hash function for universal daily seeds.
 */
export function hashDateToSeed(dateStr: string): number {
  let hash = 5381;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Helper to safely extract lineage across canonical TaxonIdentity and legacy shapes.
 */
export function getTaxonLineage(taxon: AnimalRecord) {
  return taxon.identity?.lineage || (taxon as any).taxonomy || {};
}

/**
 * Selects the universal mystery animal for a given UTC date string (YYYY-MM-DD).
 */
export function getDailyMysteryTaxon(
  taxa: AnimalRecord[],
  dateStr?: string
): { taxon: AnimalRecord; dayNumber: number; dateStr: string } {
  const effectiveDate = dateStr || new Date().toISOString().slice(0, 10);
  const dayNumber = getDailyDayNumber(effectiveDate);

  // Filter pool to flagship taxa that have valid taxonomy and identity
  const flagshipPool = taxa.filter((t) => {
    const lineage = getTaxonLineage(t);
    return Boolean(
      t.identity?.commonName &&
      t.identity?.scientificName &&
      lineage.phylum
    );
  });

  const pool = flagshipPool.length > 0 ? flagshipPool : taxa;
  const seed = hashDateToSeed(effectiveDate);
  const selectedIndex = seed % pool.length;

  return {
    taxon: pool[selectedIndex],
    dayNumber,
    dateStr: effectiveDate
  };
}

/**
 * Compares two taxa across the Linnaean hierarchy and returns warm/cold matching data.
 */
export function compareClades(guess: AnimalRecord, target: AnimalRecord): CladeMatchResult {
  const normalize = (val?: string | null) => (val || '').trim().toLowerCase();
  const guessLin = getTaxonLineage(guess);
  const targetLin = getTaxonLineage(target);

  const isExactMatch =
    guess.id === target.id ||
    normalize(guess.identity?.scientificName) === normalize(target.identity?.scientificName);

  const phylum = Boolean(
    guessLin.phylum &&
    targetLin.phylum &&
    normalize(guessLin.phylum) === normalize(targetLin.phylum)
  );

  const classMatch = Boolean(
    guessLin.class &&
    targetLin.class &&
    normalize(guessLin.class) === normalize(targetLin.class)
  );

  const order = Boolean(
    guessLin.order &&
    targetLin.order &&
    normalize(guessLin.order) === normalize(targetLin.order)
  );

  const family = Boolean(
    guessLin.family &&
    targetLin.family &&
    normalize(guessLin.family) === normalize(targetLin.family)
  );

  const genus = Boolean(
    guessLin.genus &&
    targetLin.genus &&
    normalize(guessLin.genus) === normalize(targetLin.genus)
  );

  let matchCount = 0;
  if (phylum) matchCount++;
  if (classMatch) matchCount++;
  if (order) matchCount++;
  if (family) matchCount++;
  if (genus) matchCount++;
  if (isExactMatch) matchCount++;

  return {
    phylum,
    class: classMatch,
    order,
    family,
    genus,
    isExactMatch,
    matchCount
  };
}

/**
 * Rigorously redacts all biological names, constituent common words, genus, and species epithet
 * to eliminate spoilers while preserving scientific integrity.
 */
export function redactSpecimenText(text: string, target: AnimalRecord): string {
  if (!text) return '';
  let result = text;

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 1. Redact full scientific binomial first (e.g. "Panthera uncia")
  if (target.identity?.scientificName) {
    const sciPattern = new RegExp(`\\b${escapeRegExp(target.identity.scientificName)}\\b`, 'gi');
    result = result.replace(sciPattern, '[REDACTED TAXON]');
  }

  // 2. Redact full common name (e.g. "Snow Leopard")
  if (target.identity?.commonName) {
    const commonPattern = new RegExp(`\\b${escapeRegExp(target.identity.commonName)}\\b`, 'gi');
    result = result.replace(commonPattern, '[REDACTED TAXON]');
  }

  // 3. Redact genus (e.g. "Panthera")
  const targetLin = getTaxonLineage(target);
  const genus = targetLin.genus || (target.identity?.scientificName || '').split(' ')[0];
  if (genus && genus.length >= 3) {
    const genusPattern = new RegExp(`\\b${escapeRegExp(genus)}\\b`, 'gi');
    result = result.replace(genusPattern, '[REDACTED TAXON]');
  }

  // 4. Redact species epithet (e.g. "uncia")
  const speciesEpithet = (target.identity?.scientificName || '').split(' ')[1];
  if (speciesEpithet && speciesEpithet.length >= 3) {
    const speciesPattern = new RegExp(`\\b${escapeRegExp(speciesEpithet)}\\b`, 'gi');
    result = result.replace(speciesPattern, '[REDACTED TAXON]');
  }

  // 5. Redact individual constituent words of common name (e.g. "Snow", "Leopard")
  if (target.identity?.commonName) {
    const words = target.identity.commonName.split(/\s+|-/);
    for (const word of words) {
      const cleanWord = word.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
      if (cleanWord.length >= 3 && !STOP_WORDS.has(cleanWord.toLowerCase())) {
        const wordPattern = new RegExp(`\\b${escapeRegExp(cleanWord)}\\b`, 'gi');
        result = result.replace(wordPattern, '[REDACTED TAXON]');
      }
    }
  }

  // Clean up any repeated redacting markers: "[REDACTED TAXON] [REDACTED TAXON]" -> "[REDACTED TAXON]"
  result = result.replace(/(\[REDACTED TAXON\]\s*)+/g, '[REDACTED TAXON] ');
  return result.trim();
}

const CLUE_NAMES = [
  'Taxonomic Kingdom & Realm Envelope',
  'Bioacoustic Signature',
  'Morphometric Scale Silhouette',
  'Diagnostic Adaptation Superpower',
  'Macro Specimen Plate & Family'
];

/**
 * Generates the spoiler-free Wordle-style clipboard dispatch share text.
 */
export function generateDispatchShareText(
  dayNumber: number,
  dateStr: string,
  solved: boolean,
  solvedClueStage: number,
  guesses: { matchCount: number }[]
): string {
  // Generate emoji progress line from guesses
  // 6 = 🟩 (Exact), 4-5 = 🟨 (Close family/order), <= 3 = ⬜
  const emojis = guesses
    .map((g) => {
      if (g.matchCount >= 6) return '🟩';
      if (g.matchCount >= 3) return '🟨';
      return '⬜';
    })
    .join('');

  const stageClueName = CLUE_NAMES[solvedClueStage - 1] || 'Bioacoustic Signature';

  const solveLine = solved
    ? `🔊 Solved on Clue ${solvedClueStage}/5 (${stageClueName})`
    : `💀 Unsolved after 5 Clues (${stageClueName})`;

  return [
    `ANIMALIA // FIELD DISPATCH #${dayNumber} (${dateStr})`,
    `🧬 Clade Match: ${emojis}`,
    solveLine,
    `https://animalia.bio`
  ].join('\n');
}
