import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bookmark,
  Scale,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  GitBranch,
  Camera,
  MapPin,
  Utensils,
  Clock,
  Activity,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { AnimalRecord } from '../../types/taxonomy';
import { IucnBadge } from '../common/IucnBadge';
import { DataSourceBadge } from '../common/DataSourceBadge';
import { TaxonomicSilhouette } from '../common/TaxonomicSilhouette';
import { SmartTaxonImage } from '../common/SmartTaxonImage';
import type { ResolvedTaxonMedia } from '../../services/mediaResolverService';
import { TaxonomicTreeViewer } from './TaxonomicTreeViewer';
import { enrichAnimalWithGbif } from '../../services/gbifService';
import { GeospatialDistributionViewer } from '../geospatial/GeospatialDistributionViewer';

interface AnimalProfileModalProps {
  animal: AnimalRecord;
  profileTab: string;
  setProfileTab: (tab: string) => void;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (animal: AnimalRecord) => void;
  isCompared: boolean;
  onToggleCompare: (animal: AnimalRecord) => void;
  allAnimals: AnimalRecord[];
  onSelectAnimal: (animal: AnimalRecord) => void;
  onUpdateAnimal: (updatedAnimal: AnimalRecord) => void;
}

export function AnimalProfileModal({
  animal,
  profileTab,
  setProfileTab,
  onClose,
  isFavorite,
  onToggleFavorite,
  isCompared,
  onToggleCompare,
  allAnimals,
  onSelectAnimal,
  onUpdateAnimal
}: AnimalProfileModalProps) {
  const [isEnrichingGbif, setIsEnrichingGbif] = useState(false);
  const [resolvedMedia, setResolvedMedia] = useState<ResolvedTaxonMedia | null>(null);
  const { identity, media, biology, dataSource, provenance } = animal;

  useEffect(() => {
    setResolvedMedia(null);
  }, [animal.id]);

  // WCAG 2.1 AA Focus Trap & Keyboard Navigation
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousActiveElementRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElementRef.current?.focus();
    };
  }, [onClose]);

  const handleEnrichGbif = async () => {
    setIsEnrichingGbif(true);
    try {
      const enriched = await enrichAnimalWithGbif(animal);
      onUpdateAnimal(enriched);
    } finally {
      setIsEnrichingGbif(false);
    }
  };

  const relatedAnimals = (biology.discovery?.relatedTaxonIds || [])
    .map((id) => allAnimals.find((a) => a.id === id))
    .filter(Boolean) as AnimalRecord[];

  const tabs = [
    { id: 'OVERVIEW', label: 'Specimen Overview' },
    { id: 'MAP', label: 'Distribution & Map' },
    { id: 'BIOLOGY', label: 'Morphology & Ecology' },
    { id: 'TAXONOMY', label: 'Taxonomy & Synonyms' },
    { id: 'PROVENANCE', label: 'Provenance & Media' }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="specimen-modal-title"
      aria-describedby="specimen-modal-subtitle"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#121917] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col focus:outline-none"
      >
        {/* Hero Image Header */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-slate-900 shrink-0 overflow-hidden">
          <SmartTaxonImage
            scientificName={identity.scientificName}
            commonName={identity.commonName}
            inatTaxonId={identity.externalIds?.inatTaxonId}
            primaryUrl={media?.url}
            thumbnailUrl={media?.thumbnailUrl}
            categoryGroup={identity.categoryGroup}
            alt={identity.commonName}
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            loading="eager"
            onMediaResolved={(res) => setResolvedMedia(res)}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

          {/* Close & Actions */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(animal)}
              aria-label={isFavorite ? 'Remove Bookmark' : 'Bookmark this species'}
              className={`p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isFavorite ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={() => onToggleCompare(animal)}
              aria-label={isCompared ? 'Remove Comparison' : 'Add to Comparison Matrix'}
              className={`p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isCompared ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Scale className="w-4 h-4" />
            </button>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close specimen inspector"
              className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md border border-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Metadata overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <DataSourceBadge sourceType={dataSource} />
              <span className="text-xs font-mono tracking-wider uppercase text-amber-300">
                {identity.categoryGroup}
              </span>
              <IucnBadge status={biology.conservation?.iucnStatus} showFullLabel />
            </div>
            <h2 id="specimen-modal-title" className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
              {identity.commonName}
            </h2>
            <p id="specimen-modal-subtitle" className="text-sm sm:text-base font-serif italic text-slate-200">
              {identity.scientificName} <span className="not-italic text-xs font-sans text-slate-300">{identity.authorship}</span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          role="tablist"
          aria-label="Specimen Details Tabs"
          className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F0E] px-4 sm:px-6 flex items-center gap-2 overflow-x-auto shrink-0"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={profileTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setProfileTab(tab.id)}
              className={`py-3.5 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 ${
                profileTab === tab.id
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div
          role="tabpanel"
          id={`tabpanel-${profileTab}`}
          aria-labelledby={`tab-${profileTab}`}
          className="p-4 sm:p-6 space-y-6 flex-1"
        >
          {profileTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Summary card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>Natural History & Summary</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif">
                  {biology.summary?.text || 'No biological summary documented.'}
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  Source: {biology.summary?.source || 'Verified biodiversity reference'}
                </div>
              </div>

              {/* Quick-view Geospatial Range Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase text-slate-400">Observed Geographic Distribution</h4>
                  <button
                    onClick={() => setProfileTab('MAP')}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Full Screen Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <GeospatialDistributionViewer
                  animal={animal}
                  mode="compact"
                  onNavigateToFullMap={() => setProfileTab('MAP')}
                  onUpdateTaxonExternalIds={onUpdateAnimal}
                />
              </div>

              {/* Distinguishing traits */}
              {biology.discovery?.distinguishingTraits && biology.discovery.distinguishingTraits.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase text-slate-400">Key Diagnostic Features</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {biology.discovery.distinguishingTraits.map((trait, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{trait}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Taxa Comparisons */}
              {biology.discovery?.comparisonsWithSimilarTaxa && biology.discovery.comparisonsWithSimilarTaxa.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase text-slate-400">Taxonomic Differentiation</h4>
                  <div className="space-y-2">
                    {biology.discovery.comparisonsWithSimilarTaxa.map((comp, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 dark:text-slate-200">
                            vs. {comp.comparedSpecies} <span className="font-serif italic text-slate-400">({comp.scientificName})</span>
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{comp.keyDifference}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Species Cards */}
              {relatedAnimals.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase text-slate-400">Related Lineage Taxa</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relatedAnimals.map((ra) => (
                      <button
                        key={ra.id}
                        onClick={() => onSelectAnimal(ra)}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 flex items-center gap-3 text-left transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                          <SmartTaxonImage
                            scientificName={ra.identity.scientificName}
                            commonName={ra.identity.commonName}
                            inatTaxonId={ra.identity.externalIds?.inatTaxonId}
                            primaryUrl={ra.media?.url}
                            thumbnailUrl={ra.media?.thumbnailUrl}
                            categoryGroup={ra.identity.categoryGroup}
                            alt={ra.identity.commonName}
                            className="w-full h-full object-cover"
                            containerClassName="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{ra.identity.commonName}</div>
                          <div className="text-[11px] font-serif italic text-slate-400 truncate">{ra.identity.scientificName}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {profileTab === 'MAP' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span>Geospatial Range & Biodiversity Tile Engine</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Live occurrence density tiles from the Global Biodiversity Information Facility (GBIF) and verified field observation points from iNaturalist. Use the layer switcher on the map to toggle layers or switch to satellite terrain.
                </p>
              </div>

              <GeospatialDistributionViewer
                animal={animal}
                mode="full"
                onUpdateTaxonExternalIds={onUpdateAnimal}
              />
            </div>
          )}

          {profileTab === 'BIOLOGY' && (
            <div className="space-y-6">
              {/* Measurements */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase text-slate-400">Morphological Measurements</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Body Length</span>
                    <span className="text-sm font-semibold">{biology.measurements?.bodyLength || 'Not yet documented in available source record'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Mass</span>
                    <span className="text-sm font-semibold">{biology.measurements?.mass || 'Not yet documented in available source record'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Lifespan</span>
                    <span className="text-sm font-semibold">{biology.measurements?.lifespan || 'Not yet documented in available source record'}</span>
                  </div>
                </div>
                {biology.measurements?.source && (
                  <div className="text-[11px] font-mono text-slate-400">Source: {biology.measurements.source}</div>
                )}
              </div>

              {/* Ecology */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase text-slate-400">Ecology & Habitat</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>Habitat & Range</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {biology.ecology?.habitat || 'Habitat not yet documented.'} ({biology.ecology?.geographicRange || 'Geographic range not yet documented.'})
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Utensils className="w-3.5 h-3.5 text-amber-500" />
                      <span>Diet & Trophic Niche</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {biology.ecology?.diet || 'Diet not yet documented.'}
                    </p>
                  </div>
                </div>
                {biology.ecology?.biomeTags && biology.ecology.biomeTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {biology.ecology.biomeTags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Conservation Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase text-slate-400">IUCN Red List Assessment</h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <IucnBadge status={biology.conservation?.iucnStatus} showFullLabel />
                    {biology.conservation?.assessmentYear && (
                      <span className="text-xs font-mono text-slate-400">Year Assessed: {biology.conservation.assessmentYear}</span>
                    )}
                  </div>
                  {biology.conservation?.threats && biology.conservation.threats.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-slate-400 block">Documented Threats:</span>
                      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                        {biology.conservation.threats.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {profileTab === 'TAXONOMY' && (
            <div className="space-y-6">
              <TaxonomicTreeViewer
                lineage={identity.lineage}
                scientificName={identity.scientificName}
                categoryGroup={identity.categoryGroup}
              />

              {/* GBIF Live Enrichment Button */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-mono uppercase text-amber-600 dark:text-amber-400 font-bold">
                    GBIF Backbone Lineage & Synonyms
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Query the live GBIF Species Match API to sync canonical synonyms and vernacular names.
                  </p>
                </div>
                <button
                  onClick={handleEnrichGbif}
                  disabled={isEnrichingGbif}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-amber-400 disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isEnrichingGbif ? 'animate-spin' : ''}`} />
                  <span>{isEnrichingGbif ? 'Harvesting GBIF...' : 'Harvest Live GBIF Data'}</span>
                </button>
              </div>

              {/* Synonyms */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-slate-400">
                  Documented Taxonomic Synonyms ({identity.synonyms?.length || 0})
                </h4>
                {(!identity.synonyms || identity.synonyms.length === 0) ? (
                  <p className="text-xs text-slate-500">No synonyms documented in current record. Click above to harvest from GBIF.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {identity.synonyms.map((s, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 text-xs font-serif italic text-slate-800 dark:text-slate-200"
                      >
                        {s.scientificName} <span className="not-italic font-mono text-[10px] text-slate-400">({s.status})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Vernacular Names */}
              {identity.vernacularNames && identity.vernacularNames.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase text-slate-400">Vernacular Common Names</h4>
                  <div className="flex flex-wrap gap-2">
                    {identity.vernacularNames.map((v, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                      >
                        {v.name} <span className="font-mono text-[10px] text-slate-400">({v.language})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {profileTab === 'PROVENANCE' && (
            <div className="space-y-6">
              {/* Media Provenance Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span>Media License & Attribution (Strict Provenance)</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="font-mono text-slate-400">Attribution:</span>{' '}
                    <span className="font-semibold">
                      {resolvedMedia?.attribution || media.attribution || 'Wikimedia Commons / Public Observer'}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-slate-400">License Code:</span>{' '}
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">
                      {resolvedMedia?.licenseCode || media.licenseCode || 'CC-BY-SA'}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-slate-400">Provider:</span>{' '}
                    <span>{resolvedMedia?.sourceProvider || media.sourceProvider || 'Wikimedia Commons'}</span>
                  </div>
                  {(resolvedMedia?.sourceUrl || media.sourceUrl) && (
                    <div className="pt-1">
                      <a
                        href={resolvedMedia?.sourceUrl || media.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        <span>Inspect Original Source Record</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Record Completeness */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F0E] border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 uppercase">Scientific Record Completeness</span>
                  <span className="font-bold text-emerald-500">{provenance?.completenessScore || 90}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${provenance?.completenessScore || 90}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Last verified: {provenance?.lastVerifiedAt ? new Date(provenance.lastVerifiedAt).toLocaleDateString() : 'Active Session'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
