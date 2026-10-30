import type { AnimalRecord, TaxonSynonym, VernacularName } from '../types/taxonomy.ts';

export interface GbifSpeciesMatch {
  usageKey?: number;
  scientificName?: string;
  canonicalName?: string;
  scientificNameAuthorship?: string;
  rank?: string;
  status?: string;
  confidence?: number;
  matchType?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
}

export async function matchSpeciesGbif(scientificName: string): Promise<GbifSpeciesMatch | null> {
  try {
    const res = await fetch(
      `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}&kingdom=Animalia`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchGbifSynonyms(usageKey: number, limit: number = 8): Promise<TaxonSynonym[]> {
  try {
    const res = await fetch(`https://api.gbif.org/v1/species/${usageKey}/synonyms?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((s: any): TaxonSynonym => ({
      scientificName: s.canonicalName || s.scientificName,
      authorship: s.authorship || null,
      status: (s.taxonomicStatus || 'SYNONYM') as any,
      gbifSynonymKey: s.key || null
    }));
  } catch {
    return [];
  }
}

export async function fetchGbifVernacularNames(usageKey: number, limit: number = 10): Promise<VernacularName[]> {
  try {
    const res = await fetch(`https://api.gbif.org/v1/species/${usageKey}/vernacularNames?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((v: any): VernacularName => ({
      name: v.vernacularName,
      language: v.language || 'und',
      source: v.source || 'GBIF Backbone'
    }));
  } catch {
    return [];
  }
}

export async function enrichAnimalWithGbif(animal: AnimalRecord): Promise<AnimalRecord> {
  try {
    const sciName = animal.identity.scientificName;
    const match = await matchSpeciesGbif(sciName);
    if (!match || !match.usageKey) return animal;

    const [synonyms, vernacularNames] = await Promise.all([
      fetchGbifSynonyms(match.usageKey),
      fetchGbifVernacularNames(match.usageKey)
    ]);

    return {
      ...animal,
      identity: {
        ...animal.identity,
        authorship: animal.identity.authorship || match.scientificNameAuthorship || null,
        externalIds: {
          ...animal.identity.externalIds,
          gbifKey: match.usageKey
        },
        lineage: {
          kingdom: match.kingdom || animal.identity.lineage.kingdom || 'Animalia',
          phylum: match.phylum || animal.identity.lineage.phylum || null,
          class: match.class || animal.identity.lineage.class || null,
          order: match.order || animal.identity.lineage.order || null,
          family: match.family || animal.identity.lineage.family || null,
          genus: match.genus || animal.identity.lineage.genus || null,
          species: match.species || animal.identity.scientificName
        },
        synonyms: synonyms.length > 0 ? synonyms : animal.identity.synonyms,
        vernacularNames: vernacularNames.length > 0 ? vernacularNames : animal.identity.vernacularNames
      },
      provenance: {
        ...animal.provenance,
        sources: Array.from(new Set([...animal.provenance.sources, 'GBIF Backbone API v1'])),
        lastVerifiedAt: new Date().toISOString()
      }
    };
  } catch {
    return animal;
  }
}
