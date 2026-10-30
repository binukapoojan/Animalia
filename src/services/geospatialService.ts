/**
 * ANIMALIA — Geospatial Distribution & Occurrence Mapping Service
 * Integrates GBIF Maps API v2 and iNaturalist v1 Tile Servers
 * Strictly follows GEMINI.md scientific integrity rules (zero fabricated coordinates).
 */

import { matchSpeciesGbif } from './gbifService.ts';

export interface GeospatialTaxonMetrics {
  gbifCount: number;
  gbifHasCoordinates: boolean;
  gbifUsageKey: number | null;
  inatObservationCount: number;
  inatResearchGradeCount: number;
  inatTaxonId: number | null;
  latestObservationDate: string | null;
  isLoading: boolean;
  error: string | null;
}

export type BasemapId = 'dark' | 'light' | 'osm' | 'satellite' | 'carto';

export interface BasemapOption {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
  referenceUrl?: string;
}

/**
 * Resolves optional Carto API Key from localStorage or Vite environment variable.
 * Default is empty string (which uses watermark-free Esri Canvas & OSM basemaps).
 */
export function getCartoApiKey(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem('animalia_carto_api_key');
    if (stored) return stored.trim();
  }
  return (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CARTO_API_KEY) || '';
}

export function setCartoApiKey(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (key && key.trim()) {
      localStorage.setItem('animalia_carto_api_key', key.trim());
    } else {
      localStorage.removeItem('animalia_carto_api_key');
    }
  }
}

/**
 * Returns active basemap definitions.
 * When no Carto API key is present, uses Esri Dark/Light Gray Canvas & OSM (100% free, zero watermarks).
 * When Carto API key is present, incorporates CartoDB Dark Matter / Positron.
 */
export function getBasemapDefinitions(): Record<string, BasemapOption> {
  const cartoKey = getCartoApiKey();

  return {
    dark: cartoKey
      ? {
          id: 'carto-dark',
          name: 'CartoDB Dark Matter',
          url: `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${cartoKey}`,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
          maxZoom: 19,
          subdomains: 'abcd'
        }
      : {
          id: 'esri-dark-gray',
          name: 'Esri Dark Canvas',
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          referenceUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 16
        },
    light: cartoKey
      ? {
          id: 'carto-light',
          name: 'CartoDB Positron',
          url: `https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${cartoKey}`,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
          maxZoom: 19,
          subdomains: 'abcd'
        }
      : {
          id: 'esri-light-gray',
          name: 'Esri Light Canvas',
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          referenceUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 16
        },
    osm: {
      id: 'osm-standard',
      name: 'OpenStreetMap',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19
    },
    satellite: {
      id: 'satellite',
      name: 'Esri Satellite Imagery',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      maxZoom: 18
    }
  };
}

export const BASEMAP_DEFINITIONS: Record<string, BasemapOption> = getBasemapDefinitions();

/**
 * Constructs the GBIF occurrence density raster tile URL.
 * Uses official GBIF Map API v2 with hex density binning.
 */
export function getGbifDensityTileUrl(
  gbifUsageKey: number,
  style: string = 'classic.poly',
  bin: string = 'hex',
  hexPerTile: number = 51
): string {
  return `https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@1x.png?taxonKey=${gbifUsageKey}&bin=${bin}&hexPerTile=${hexPerTile}&style=${style}`;
}

/**
 * Constructs the iNaturalist observation point raster tile URL.
 * Uses official iNaturalist v1 API.
 */
export function getInatPointsTileUrl(inatTaxonId: number): string {
  return `https://api.inaturalist.org/v1/points/{z}/{x}/{y}.png?taxon_id=${inatTaxonId}`;
}

/**
 * Dynamically resolves missing GBIF usage key or iNaturalist taxon ID
 * using real upstream backbone matching by scientific name.
 */
export async function resolveTaxonExternalIds(
  scientificName: string,
  existingGbifKey: number | null,
  existingInatId: number | null
): Promise<{ gbifKey: number | null; inatId: number | null }> {
  let gbifKey = existingGbifKey;
  let inatId = existingInatId;

  const promises: Promise<void>[] = [];

  if (!gbifKey) {
    promises.push(
      (async () => {
        try {
          const match = await matchSpeciesGbif(scientificName);
          if (match?.usageKey) {
            gbifKey = match.usageKey;
          }
        } catch {
          // Leave null on network or match failure
        }
      })()
    );
  }

  if (!inatId) {
    promises.push(
      (async () => {
        try {
          const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&rank=species,subspecies&per_page=1`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              inatId = data.results[0].id;
            }
          }
        } catch {
          // Leave null on network failure
        }
      })()
    );
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  return { gbifKey, inatId };
}

/**
 * Fetches real upstream georeferenced metrics for a taxon from GBIF and iNaturalist.
 */
export async function fetchGeospatialMetrics(
  scientificName: string,
  gbifUsageKey: number | null,
  inatTaxonId: number | null
): Promise<GeospatialTaxonMetrics> {
  const result: GeospatialTaxonMetrics = {
    gbifCount: 0,
    gbifHasCoordinates: false,
    gbifUsageKey,
    inatObservationCount: 0,
    inatResearchGradeCount: 0,
    inatTaxonId,
    latestObservationDate: null,
    isLoading: false,
    error: null
  };

  try {
    // Resolve any missing keys first
    const resolved = await resolveTaxonExternalIds(scientificName, gbifUsageKey, inatTaxonId);
    result.gbifUsageKey = resolved.gbifKey;
    result.inatTaxonId = resolved.inatId;

    const tasks: Promise<void>[] = [];

    // Query GBIF occurrence count with coordinates
    if (result.gbifUsageKey) {
      const gbifKey = result.gbifUsageKey;
      tasks.push(
        (async () => {
          try {
            const url = `https://api.gbif.org/v1/occurrence/search?taxonKey=${gbifKey}&hasCoordinate=true&limit=1`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              result.gbifCount = data.count || 0;
              result.gbifHasCoordinates = result.gbifCount > 0;
              if (data.results && data.results.length > 0 && data.results[0].eventDate) {
                result.latestObservationDate = data.results[0].eventDate;
              }
            }
          } catch {
            // Keep default zeros
          }
        })()
      );
    }

    // Query iNaturalist observation counts
    if (result.inatTaxonId) {
      const inatId = result.inatTaxonId;
      tasks.push(
        (async () => {
          try {
            const [totalRes, researchRes] = await Promise.all([
              fetch(`https://api.inaturalist.org/v1/observations?taxon_id=${inatId}&has[]=geo&per_page=0`),
              fetch(`https://api.inaturalist.org/v1/observations?taxon_id=${inatId}&quality_grade=research&has[]=geo&per_page=0`)
            ]);

            if (totalRes.ok) {
              const totalData = await totalRes.json();
              result.inatObservationCount = totalData.total_results || 0;
            }

            if (researchRes.ok) {
              const researchData = await researchRes.json();
              result.inatResearchGradeCount = researchData.total_results || 0;
            }
          } catch {
            // Keep default zeros
          }
        })()
      );
    }

    await Promise.all(tasks);
  } catch (err: any) {
    result.error = err?.message || 'Failed to retrieve distribution metrics';
  }

  return result;
}
