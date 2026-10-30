import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  Globe2,
  Layers,
  MapPin,
  ExternalLink,
  RotateCcw,
  Maximize2,
  Minimize2,
  Info,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Key,
  X,
  Check
} from 'lucide-react';
import { AnimalRecord } from '../../types/taxonomy';
import {
  fetchGeospatialMetrics,
  getGbifDensityTileUrl,
  getInatPointsTileUrl,
  getBasemapDefinitions,
  getCartoApiKey,
  setCartoApiKey,
  GeospatialTaxonMetrics
} from '../../services/geospatialService';

interface GeospatialDistributionViewerProps {
  animal: AnimalRecord;
  mode?: 'compact' | 'full';
  theme?: 'dark' | 'light' | string;
  onNavigateToFullMap?: () => void;
  onUpdateTaxonExternalIds?: (updated: AnimalRecord) => void;
}

export function GeospatialDistributionViewer({
  animal,
  mode = 'full',
  theme = 'dark',
  onNavigateToFullMap,
  onUpdateTaxonExternalIds
}: GeospatialDistributionViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const basemapLayerRef = useRef<L.TileLayer | null>(null);
  const referenceLayerRef = useRef<L.TileLayer | null>(null);
  const gbifLayerRef = useRef<L.TileLayer | null>(null);
  const inatLayerRef = useRef<L.TileLayer | null>(null);

  // Layer States
  const [activeBasemap, setActiveBasemap] = useState<'theme' | 'satellite' | 'osm'>('theme');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showGbifLayer, setShowGbifLayer] = useState<boolean>(true);
  const [showInatLayer, setShowInatLayer] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [cartoKeyInput, setCartoKeyInput] = useState<string>(() => getCartoApiKey());
  const [savedKeySuccess, setSavedKeySuccess] = useState<boolean>(false);
  const [basemapDefinitions, setBasemapDefinitions] = useState(() => getBasemapDefinitions());

  // Metrics State
  const [metrics, setMetrics] = useState<GeospatialTaxonMetrics>({
    gbifCount: 0,
    gbifHasCoordinates: false,
    gbifUsageKey: animal.identity.externalIds.gbifKey,
    inatObservationCount: 0,
    inatResearchGradeCount: 0,
    inatTaxonId: animal.identity.externalIds.inatTaxonId,
    latestObservationDate: null,
    isLoading: true,
    error: null
  });

  // Fetch real occurrence counts & resolve IDs
  useEffect(() => {
    let isMounted = true;
    setMetrics((prev) => ({ ...prev, isLoading: true, error: null }));

    fetchGeospatialMetrics(
      animal.identity.scientificName,
      animal.identity.externalIds.gbifKey,
      animal.identity.externalIds.inatTaxonId
    ).then((res) => {
      if (!isMounted) return;
      setMetrics(res);

      // If IDs were newly resolved and parent callback exists, propagate updates
      if (
        onUpdateTaxonExternalIds &&
        (res.gbifUsageKey !== animal.identity.externalIds.gbifKey ||
          res.inatTaxonId !== animal.identity.externalIds.inatTaxonId)
      ) {
        const updated = {
          ...animal,
          identity: {
            ...animal.identity,
            externalIds: {
              ...animal.identity.externalIds,
              gbifKey: res.gbifUsageKey ?? animal.identity.externalIds.gbifKey,
              inatTaxonId: res.inatTaxonId ?? animal.identity.externalIds.inatTaxonId
            }
          }
        };
        onUpdateTaxonExternalIds(updated);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [animal.id, animal.identity.scientificName, animal.identity.externalIds.gbifKey, animal.identity.externalIds.inatTaxonId]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset container if previously initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: mode === 'compact' ? 1 : 2,
      minZoom: 1,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true
    });

    // Custom positioned zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    // Ensure Leaflet recalculates dimensions once mounted
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mode]);

  // Update Basemap & Reference Boundary Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (basemapLayerRef.current) {
      map.removeLayer(basemapLayerRef.current);
      basemapLayerRef.current = null;
    }
    if (referenceLayerRef.current) {
      map.removeLayer(referenceLayerRef.current);
      referenceLayerRef.current = null;
    }

    let config = basemapDefinitions.dark;
    if (activeBasemap === 'satellite') {
      config = basemapDefinitions.satellite;
    } else if (activeBasemap === 'osm') {
      config = basemapDefinitions.osm;
    } else if (theme === 'light') {
      config = basemapDefinitions.light;
    }

    const layer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: config.subdomains || 'abcd',
      zIndex: 1
    });

    layer.addTo(map);
    basemapLayerRef.current = layer;
    layer.bringToBack();

    // If basemap includes a reference boundary/label layer and labels are enabled
    if (config.referenceUrl && showLabels && activeBasemap === 'theme') {
      const refLayer = L.tileLayer(config.referenceUrl, {
        maxZoom: config.maxZoom,
        opacity: 0.85,
        zIndex: 25
      });
      refLayer.addTo(map);
      referenceLayerRef.current = refLayer;
    }
  }, [activeBasemap, theme, showLabels, basemapDefinitions]);

  // Update GBIF Density Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (gbifLayerRef.current) {
      map.removeLayer(gbifLayerRef.current);
      gbifLayerRef.current = null;
    }

    if (showGbifLayer && metrics.gbifUsageKey) {
      const tileUrl = getGbifDensityTileUrl(metrics.gbifUsageKey);
      const layer = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.gbif.org" target="_blank" rel="noreferrer">GBIF Occurrence Backbone</a>',
        opacity: 0.85,
        maxZoom: 16,
        zIndex: 10
      });
      layer.addTo(map);
      gbifLayerRef.current = layer;
    }
  }, [showGbifLayer, metrics.gbifUsageKey]);

  // Update iNaturalist Points Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (inatLayerRef.current) {
      map.removeLayer(inatLayerRef.current);
      inatLayerRef.current = null;
    }

    if (showInatLayer && metrics.inatTaxonId) {
      const tileUrl = getInatPointsTileUrl(metrics.inatTaxonId);
      const layer = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.inaturalist.org" target="_blank" rel="noreferrer">iNaturalist Observations</a>',
        opacity: 0.9,
        maxZoom: 16,
        zIndex: 20
      });
      layer.addTo(map);
      inatLayerRef.current = layer;
    }
  }, [showInatLayer, metrics.inatTaxonId]);

  const handleResetView = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([20, 0], mode === 'compact' ? 1 : 2);
    }
  }, [mode]);

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);
  };

  const hasZeroOccurrences =
    !metrics.isLoading && metrics.gbifCount === 0 && metrics.inatObservationCount === 0;

  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 ${
        isFullscreen
          ? 'fixed inset-4 z-50 shadow-2xl bg-slate-950'
          : mode === 'compact'
          ? 'h-80 w-full'
          : 'h-[580px] w-full'
      }`}
    >
      {/* HUD Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 dark:bg-[#121917]/95 backdrop-blur-md border-b border-slate-200/10 dark:border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            {mode === 'compact' ? 'Geospatial Range Quick View' : 'Global Distribution & Occurrence Range'}
          </span>
          {metrics.isLoading && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full animate-pulse">
              Querying GBIF & iNat...
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {mode === 'compact' && onNavigateToFullMap && (
            <button
              onClick={onNavigateToFullMap}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
              title="Open full interactive distribution tab"
            >
              <span>Full Map Tab</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reset to World View"
            aria-label="Reset to World View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {mode === 'full' && (
            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Map Canvas Viewport */}
      <div className="relative flex-1 w-full h-full bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" tabIndex={0} aria-label="Geospatial distribution map" />

        {/* Floating Layer Switcher & Legends (Full Mode) */}
        {mode === 'full' && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 max-w-xs sm:max-w-sm pointer-events-auto">
            {/* Layer Toggles Card */}
            <div className="bg-slate-900/90 dark:bg-[#121917]/95 backdrop-blur-md border border-slate-700/60 dark:border-slate-800 rounded-xl p-2.5 shadow-xl text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-slate-700/40 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Active Map Layers
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Direct Tile Sync</span>
              </div>

              {/* GBIF Toggle */}
              <button
                onClick={() => setShowGbifLayer((prev) => !prev)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all ${
                  showGbifLayer
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                    : 'bg-slate-800/40 border-transparent text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-red-500 shrink-0" />
                  <span>GBIF Occurrence Density</span>
                </div>
                {showGbifLayer ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              {/* iNaturalist Toggle */}
              <button
                onClick={() => setShowInatLayer((prev) => !prev)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all ${
                  showInatLayer
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium'
                    : 'bg-slate-800/40 border-transparent text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>iNat Observation Points</span>
                </div>
                {showInatLayer ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              {/* Basemap Selection */}
              <div className="pt-2 border-t border-slate-700/40 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Basemap:</span>
                  <div className="flex bg-slate-950/80 rounded-lg p-0.5 border border-slate-700/60">
                    <button
                      onClick={() => setActiveBasemap('theme')}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                        activeBasemap === 'theme'
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      title="High-contrast dark canvas for occurrence visibility (Zero API key required)"
                    >
                      Canvas
                    </button>
                    <button
                      onClick={() => setActiveBasemap('satellite')}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                        activeBasemap === 'satellite'
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      title="Esri Satellite Photographic Imagery (Free)"
                    >
                      Satellite
                    </button>
                    <button
                      onClick={() => setActiveBasemap('osm')}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                        activeBasemap === 'osm'
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      title="OpenStreetMap Standard Global Map (Free)"
                    >
                      Street
                    </button>
                  </div>
                </div>

                {/* Boundary & Region Labels (for Canvas mode) */}
                {activeBasemap === 'theme' && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                    <span className="text-slate-400">Boundary Labels:</span>
                    <button
                      onClick={() => setShowLabels((prev) => !prev)}
                      className={`px-2 py-0.5 rounded border transition-colors ${
                        showLabels
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-medium'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      {showLabels ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                )}

                {/* Tile Provider & Optional Carto API Key Info */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                  <span className="text-slate-400">Tile Provider:</span>
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1"
                    title="View map providers and optional Carto API key settings"
                  >
                    <Key className="w-2.5 h-2.5" />
                    <span>{getCartoApiKey() ? 'Carto Key Active' : 'Esri & OSM (Free)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Heatmap Legend */}
            {showGbifLayer && (
              <div className="bg-slate-900/90 dark:bg-[#121917]/95 backdrop-blur-md border border-slate-700/60 dark:border-slate-800 rounded-xl p-2 shadow-xl text-[10px] text-slate-300 space-y-1">
                <div className="flex justify-between items-center text-slate-400">
                  <span>GBIF Hex Density</span>
                  <span>Low &rarr; High</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600" />
              </div>
            )}
          </div>
        )}

        {/* Empty State Overlay for Taxa with Zero Occurrences */}
        {hasZeroOccurrences && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm pointer-events-none">
            <div className="max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-5 text-center shadow-2xl pointer-events-auto">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-100 mb-1">
                Zero Georeferenced Coordinates Documented
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                No verified GPS-referenced occurrence points exist in the GBIF or iNaturalist repositories for{' '}
                <em className="text-amber-300 not-italic font-medium">{animal.identity.scientificName}</em>.
                In adherence to our strict scientific integrity guidelines, no simulated or fabricated locations are rendered.
              </p>
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Fabricated Biology Rule Enforced</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Geospatial HUD Footer */}
      <div className="px-4 py-2.5 bg-slate-900/95 dark:bg-[#121917]/95 border-t border-slate-200/10 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        <div className="flex flex-wrap items-center gap-3">
          {/* GBIF Metric */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">GBIF Records:</span>
            <span className="font-semibold text-slate-100">
              {metrics.isLoading ? '...' : metrics.gbifCount.toLocaleString()}
            </span>
            {metrics.gbifUsageKey && (
              <a
                href={`https://www.gbif.org/species/${metrics.gbifUsageKey}`}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 hover:underline inline-flex items-center gap-0.5 ml-0.5 text-[10px]"
                title="View GBIF Specimen Backbone"
              >
                <span>GBIF</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* iNaturalist Metric */}
          <div className="flex items-center gap-1.5 border-l border-slate-700/60 pl-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">iNat Observations:</span>
            <span className="font-semibold text-slate-100">
              {metrics.isLoading ? '...' : metrics.inatObservationCount.toLocaleString()}
            </span>
            {metrics.inatResearchGradeCount > 0 && (
              <span className="text-[10px] text-emerald-400/90 font-medium">
                ({metrics.inatResearchGradeCount.toLocaleString()} research-grade)
              </span>
            )}
            {metrics.inatTaxonId && (
              <a
                href={`https://www.inaturalist.org/taxa/${metrics.inatTaxonId}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-0.5 ml-0.5 text-[10px]"
                title="View iNaturalist Taxon Page"
              >
                <span>iNat</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* Latest Recorded Observation */}
          {metrics.latestObservationDate && (
            <div className="hidden sm:flex items-center gap-1 border-l border-slate-700/60 pl-3 text-slate-400 text-[11px]">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Latest Record:</span>
              <span className="text-slate-200">
                {new Date(metrics.latestObservationDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real Upstream Vectors</span>
        </div>
      </div>

      {/* Map Providers & API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl relative text-slate-200">
            <button
              onClick={() => {
                setShowApiKeyModal(false);
                setSavedKeySuccess(false);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Basemap & Occurrence Providers</h3>
                <p className="text-[11px] text-slate-400">Zero-configuration open biodiversity infrastructure</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3">
                <div className="flex items-center gap-2 text-emerald-300 font-medium mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No API Key Required for ANIMALIA</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  ANIMALIA runs completely key-free using verified open endpoints from <strong>GBIF</strong> (Occurrence Density maps), <strong>iNaturalist</strong> (Observation GPS points), <strong>Esri</strong> (Dark Canvas & Satellite), and <strong>OpenStreetMap</strong>.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-medium text-slate-400">
                  Optional Carto Developer API Key:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cartoKeyInput}
                    onChange={(e) => setCartoKeyInput(e.target.value)}
                    placeholder="Paste Carto key (e.g. carto_...)"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    onClick={() => {
                      setCartoApiKey(cartoKeyInput);
                      setBasemapDefinitions(getBasemapDefinitions());
                      setSavedKeySuccess(true);
                      setTimeout(() => setSavedKeySuccess(false), 2500);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                  >
                    Save
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Carto recently began requiring keys for <code className="text-slate-300">basemaps.cartocdn.com</code>. If you prefer Carto Dark Matter, you can obtain a free key at <a href="https://carto.com/basemaps/apikey" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">carto.com/basemaps/apikey</a>.
                </p>
              </div>

              {savedKeySuccess && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-2.5 py-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Basemap configuration saved successfully!</span>
                </div>
              )}

              {getCartoApiKey() && (
                <button
                  onClick={() => {
                    setCartoApiKey('');
                    setCartoKeyInput('');
                    setBasemapDefinitions(getBasemapDefinitions());
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline pt-1 block"
                >
                  Clear custom key & revert to default Esri Dark Canvas
                </button>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  setSavedKeySuccess(false);
                }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
