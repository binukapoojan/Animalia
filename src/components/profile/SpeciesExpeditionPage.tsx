import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  Image as ImageIcon,
  Bookmark,
  Scale,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Camera,
  CheckCircle2,
  GitBranch,
  Layers,
  MapPin,
  Sparkles,
  Info,
  Printer
} from 'lucide-react';
import type { AnimalRecord } from '../../types/taxonomy';
import { SmartTaxonImage } from '../common/SmartTaxonImage';
import { IucnBadge } from '../common/IucnBadge';
import { DataSourceBadge } from '../common/DataSourceBadge';
import { InteractiveScaleComparator } from './modules/InteractiveScaleComparator';
import { HabitatBiomeExplorer } from './modules/HabitatBiomeExplorer';
import { BiologicalSuperpowersDeck } from './modules/BiologicalSuperpowersDeck';
import { InteractiveLineageNavigator } from './modules/InteractiveLineageNavigator';
import { HeroImageChanger } from './modules/HeroImageChanger';
import { BioacousticVocalizationDeck } from './modules/BioacousticVocalizationDeck';
import { MonographPosterExporter } from './modules/MonographPosterExporter';
import { GeospatialDistributionViewer } from '../geospatial/GeospatialDistributionViewer';
import { enrichAnimalWithGbif } from '../../services/gbifService';
import type { ResolvedTaxonMedia, TaxonMediaItem } from '../../services/mediaResolverService';

export interface SpeciesExpeditionPageProps {
  animal: AnimalRecord;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (animal: AnimalRecord) => void;
  isCompared: boolean;
  onToggleCompare: (animal: AnimalRecord) => void;
  allAnimals?: AnimalRecord[];
  onSelectAnimal: (animal: AnimalRecord) => void;
  onUpdateAnimal?: (updatedAnimal: AnimalRecord) => void;
  theme?: string;
  toggleTheme?: () => void;
  onNavigateToCompare?: () => void;
}

export type ExpeditionViewMode = 'EXPEDITION' | 'DOSSIER' | 'THEATRE';

export function SpeciesExpeditionPage({
  animal,
  onClose,
  isFavorite,
  onToggleFavorite,
  isCompared,
  onToggleCompare,
  allAnimals = [],
  onSelectAnimal,
  onUpdateAnimal,
  theme = 'dark',
  toggleTheme,
  onNavigateToCompare
}: SpeciesExpeditionPageProps) {
  const [viewMode, setViewMode] = useState<ExpeditionViewMode>('EXPEDITION');
  const [isEnrichingGbif, setIsEnrichingGbif] = useState<boolean>(false);
  const [resolvedMedia, setResolvedMedia] = useState<ResolvedTaxonMedia | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [speciesGallery, setSpeciesGallery] = useState<TaxonMediaItem[]>([]);
  const [isLightboxZoomed, setIsLightboxZoomed] = useState<boolean>(false);
  const [isMonographExporterOpen, setIsMonographExporterOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { identity, media, biology, dataSource, provenance } = animal;

  // Scroll to top whenever animal changes
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setResolvedMedia(null);
    setActivePhotoIndex(0);
    setSpeciesGallery([]);
    setIsLightboxZoomed(false);
  }, [animal.id]);

  // Determine Previous & Next Species in active sequence
  const currentIndex = useMemo(() => {
    return allAnimals.findIndex((a) => a.id === animal.id);
  }, [allAnimals, animal.id]);

  const prevAnimal = useMemo(() => {
    if (allAnimals.length <= 1 || currentIndex === -1) return null;
    const prevIdx = (currentIndex - 1 + allAnimals.length) % allAnimals.length;
    return allAnimals[prevIdx];
  }, [allAnimals, currentIndex]);

  const nextAnimal = useMemo(() => {
    if (allAnimals.length <= 1 || currentIndex === -1) return null;
    const nextIdx = (currentIndex + 1) % allAnimals.length;
    return allAnimals[nextIdx];
  }, [allAnimals, currentIndex]);

  // Keyboard Shortcuts Listener with Input Guard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: Ignore shortcuts if typing in input, textarea, or select
      const activeTag = (document.activeElement?.tagName || '').toUpperCase();
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          if (prevAnimal) {
            e.preventDefault();
            onSelectAnimal(prevAnimal);
          }
          break;
        case 'ArrowRight':
          if (nextAnimal) {
            e.preventDefault();
            onSelectAnimal(nextAnimal);
          }
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          onToggleCompare(animal);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          onToggleFavorite(animal);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          setViewMode((prev) => (prev === 'THEATRE' ? 'EXPEDITION' : 'THEATRE'));
          break;
        case '[':
          if (speciesGallery.length > 1) {
            e.preventDefault();
            setActivePhotoIndex((prev) => (prev - 1 + speciesGallery.length) % speciesGallery.length);
          }
          break;
        case ']':
          if (speciesGallery.length > 1) {
            e.preventDefault();
            setActivePhotoIndex((prev) => (prev + 1) % speciesGallery.length);
          }
          break;
        case '1':
          e.preventDefault();
          setViewMode('EXPEDITION');
          break;
        case '2':
          e.preventDefault();
          setViewMode('DOSSIER');
          break;
        case '3':
          e.preventDefault();
          setViewMode('THEATRE');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, prevAnimal, nextAnimal, onSelectAnimal, onToggleCompare, onToggleFavorite, animal, speciesGallery.length]);

  // Live GBIF Enrichment
  const handleEnrichGbif = async () => {
    if (!onUpdateAnimal) return;
    setIsEnrichingGbif(true);
    try {
      const enriched = await enrichAnimalWithGbif(animal);
      onUpdateAnimal(enriched);
    } catch (err) {
      console.warn('GBIF enrichment notice:', err);
    } finally {
      setIsEnrichingGbif(false);
    }
  };

  const primaryPhotoUrl = resolvedMedia?.url || media?.url;
  const primaryThumbUrl = resolvedMedia?.thumbnailUrl || media?.thumbnailUrl;
  const activeAttribution = resolvedMedia?.attribution || media?.attribution || 'Verified Wildlife Observer';
  const activeLicense = resolvedMedia?.licenseCode || media?.licenseCode || 'CC-BY-SA';
  const activeProvider = resolvedMedia?.sourceProvider || media?.sourceProvider || 'iNaturalist API v1';

  const activeTheatrePhoto =
    speciesGallery[activePhotoIndex] ||
    (speciesGallery.length > 0 ? speciesGallery[0] : null);

  const theatrePhotoUrl = activeTheatrePhoto?.url || primaryPhotoUrl;
  const theatreThumbUrl = activeTheatrePhoto?.thumbnailUrl || primaryThumbUrl;
  const theatreAttribution = activeTheatrePhoto?.attribution || activeAttribution;
  const theatreLicense = activeTheatrePhoto?.licenseCode || activeLicense;
  const theatreProvider = activeTheatrePhoto?.sourceProvider || activeProvider;
  const theatreSourceUrl = activeTheatrePhoto?.sourceUrl || resolvedMedia?.sourceUrl || media?.sourceUrl;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#F5F2EB] dark:bg-[#070A09] text-[#141816] dark:text-[#F2EFE9] flex flex-col font-sans transition-colors duration-300 select-text archival-grain"
      role="main"
      aria-label={`Species Expedition: ${identity.commonName}`}
    >
      {/* ========================================================================= */}
      {/* 1. STICKY EXPEDITION CONTROL DECK (TOP BAR)                              */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-[#F5F2EB]/95 dark:bg-[#070A09]/95 dark:bg-[#0E1513]/90 backdrop-blur-md border-b border-[#141816]/10 dark:border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shadow-sm transition-colors">
        {/* Left: Back to Kingdom & Identity Chip */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EBE6DC] dark:bg-[#0D1210] hover:bg-amber-500 hover:text-slate-950 font-bold text-xs transition-colors shrink-0 group border border-[#141816]/10 dark:border-white/10 shadow-sm"
            title="Return to Discovery Kingdom (Esc)"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline font-serif">Kingdom Monograph</span>
            <span className="text-[10px] opacity-60 font-mono hidden md:inline">Esc</span>
          </button>

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="font-serif font-bold text-lg sm:text-2xl truncate text-[#141816] dark:text-white">
              {identity.commonName}
            </h1>
            <span className="text-xs sm:text-sm font-serif italic text-amber-700 dark:text-[#D4A359] truncate hidden lg:inline">
              ({identity.scientificName})
            </span>
            <IucnBadge status={biology.conservation?.iucnStatus} />
          </div>
        </div>

        {/* Center: View Mode Switcher Editorial Tabs */}
        <nav className="hidden md:flex items-center gap-1 border-b border-transparent">
          <button
            onClick={() => setViewMode('EXPEDITION')}
            className={`px-3 py-1.5 text-xs font-serif tracking-wider transition-all flex items-center gap-1.5 border-b-2 ${
              viewMode === 'EXPEDITION'
                ? 'border-amber-600 dark:border-[#D4A359] text-amber-800 dark:text-[#D4A359] font-bold'
                : 'border-transparent text-[#5A625E] dark:text-[#949E99] hover:text-[#141816] dark:hover:text-white font-medium'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Expedition Mode</span>
            <span className="text-[10px] opacity-60 font-mono">[1]</span>
          </button>

          <button
            onClick={() => setViewMode('DOSSIER')}
            className={`px-3 py-1.5 text-xs font-serif tracking-wider transition-all flex items-center gap-1.5 border-b-2 ${
              viewMode === 'DOSSIER'
                ? 'border-amber-600 dark:border-[#D4A359] text-amber-800 dark:text-[#D4A359] font-bold'
                : 'border-transparent text-[#5A625E] dark:text-[#949E99] hover:text-[#141816] dark:hover:text-white font-medium'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scientific Dossier</span>
            <span className="text-[10px] opacity-60 font-mono">[2]</span>
          </button>

          <button
            onClick={() => setViewMode('THEATRE')}
            className={`px-3 py-1.5 text-xs font-serif tracking-wider transition-all flex items-center gap-1.5 border-b-2 ${
              viewMode === 'THEATRE'
                ? 'border-amber-600 dark:border-[#D4A359] text-amber-800 dark:text-[#D4A359] font-bold'
                : 'border-transparent text-[#5A625E] dark:text-[#949E99] hover:text-[#141816] dark:hover:text-white font-medium'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Theatre Gallery</span>
            <span className="text-[10px] opacity-60 font-mono">[3]</span>
          </button>
        </nav>

        {/* Right: Previous / Next Species & Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Previous Species */}
          {prevAnimal && (
            <button
              onClick={() => onSelectAnimal(prevAnimal)}
              className="p-2 rounded-lg bg-[#EBE6DC] dark:bg-[#0D1210] hover:bg-black/10 dark:hover:bg-white/10 text-[#141816] dark:text-[#F2EFE9] border border-[#141816]/10 dark:border-white/10 transition-colors"
              title={`Previous: ${prevAnimal.identity.commonName} (←)`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Next Species */}
          {nextAnimal && (
            <button
              onClick={() => onSelectAnimal(nextAnimal)}
              className="p-2 rounded-lg bg-[#EBE6DC] dark:bg-[#0D1210] hover:bg-black/10 dark:hover:bg-white/10 text-[#141816] dark:text-[#F2EFE9] border border-[#141816]/10 dark:border-white/10 transition-colors"
              title={`Next: ${nextAnimal.identity.commonName} (→)`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <div className="h-5 w-[1px] bg-[#141816]/15 dark:bg-white/15 mx-1 hidden sm:block" />

          {/* Compare Button (C) */}
          <button
            onClick={() => onToggleCompare(animal)}
            className={`p-2 rounded-lg transition-all border ${
              isCompared
                ? 'bg-[#2E6F54] text-white font-bold border-emerald-400 shadow-sm'
                : 'bg-[#EBE6DC] dark:bg-[#0D1210] text-[#141816] dark:text-[#F2EFE9] border-[#141816]/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Toggle Comparison Matrix (C)"
          >
            <Scale className="w-4 h-4" />
          </button>

          {/* Save to Collection (S) */}
          <button
            onClick={() => onToggleFavorite(animal)}
            className={`p-2 rounded-lg transition-all border ${
              isFavorite
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                : 'bg-[#EBE6DC] dark:bg-[#0D1210] text-[#141816] dark:text-[#F2EFE9] border-[#141816]/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Save to Collection (S)"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>

          {/* Export Monograph Plate Action */}
          <button
            onClick={() => setIsMonographExporterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#EBE6DC] dark:bg-[#0D1210] hover:bg-amber-500 hover:text-slate-950 text-[#141816] dark:text-[#F2EFE9] border border-[#141816]/10 dark:border-white/10 transition-colors shadow-sm font-serif text-xs font-bold shrink-0"
            title="Export Archival Monograph Specimen Plate (PDF & PNG)"
          >
            <Printer className="w-3.5 h-3.5 text-amber-700 dark:text-[#D4A359]" />
            <span className="hidden sm:inline">Export Monograph Plate</span>
          </button>

          {/* Theme Toggle */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#EBE6DC] dark:bg-[#0D1210] text-[#141816] dark:text-[#F2EFE9] border border-[#141816]/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Toggle Linnaean Parchment / Obsidian Herbarium"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#141816]" />}
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. EXPEDITION BODY (VIEW MODE CONTROLLER)                                 */}
      {/* ========================================================================= */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10">
        {/* ===================================================================== */}
        {/* MODE 1: EXPEDITION MODE (Hero + Monograph Spread + Chapters)          */}
        {/* ===================================================================== */}
        {viewMode === 'EXPEDITION' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* HERO CINEMATIC MULTI-PHOTO SPECIMEN SHOWCASE */}
            <HeroImageChanger
              animal={animal}
              activePhotoIndex={activePhotoIndex}
              onActivePhotoIndexChange={setActivePhotoIndex}
              onGalleryLoaded={setSpeciesGallery}
              onMediaResolved={(res) => setResolvedMedia(res)}
              onOpenTheatre={(idx) => {
                setActivePhotoIndex(idx);
                setViewMode('THEATRE');
              }}
            />

            {/* ARCHIVAL MONOGRAPH FIELD SPREAD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
              {/* Biological Narrative with Editorial Dropcap */}
              <div className="lg:col-span-7 space-y-4">
                <div className="specimen-stamp text-amber-800 dark:text-[#D4A359] border-amber-600/30 dark:border-[#D4A359]/30 bg-amber-500/10">
                  <span>ARCHIVAL FIELD MONOGRAPH // BIOLOGICAL OVERVIEW</span>
                </div>
                <p className="editorial-dropcap font-serif text-lg sm:text-xl leading-relaxed text-[#141816]/90 dark:text-[#F2EFE9]/90 italic">
                  {biology.summary?.text || 'Verified wild specimen documented across natural range envelope with preserved biometric provenance, morphological adaptations, and cladistic classification.'}
                </p>
                {biology.discovery?.distinguishingTraits && biology.discovery.distinguishingTraits.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-[#141816]/10 dark:border-white/10">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#5A625E] dark:text-[#949E99]">
                      Key Diagnostic Traits in Wild Observations:
                    </span>
                    <ul className="space-y-1.5 text-xs font-sans text-[#141816]/80 dark:text-[#F2EFE9]/80">
                      {biology.discovery.distinguishingTraits.slice(0, 3).map((trait, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-700 dark:text-[#D4A359] font-mono mt-0.5">•</span>
                          <span>{trait}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Museum Specimen Plaque Data Table (Dotted Leaders) */}
              <div className="lg:col-span-5 bg-[#EBE6DC]/40 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 rounded-xl p-5 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-[#141816]/10 dark:border-white/10 text-[11px] uppercase tracking-wider text-amber-700 dark:text-[#D4A359] font-bold">
                  <span>Specimen Biometrics</span>
                  <span>Plate ID: {animal.id.slice(-6).toUpperCase()}</span>
                </div>

                <div className="dotted-leader">
                  <span className="text-[#5A625E] dark:text-[#949E99]">Binomial Nomenclature</span>
                  <span className="dotted-leader-fill" />
                  <span className="font-serif italic font-bold text-[#141816] dark:text-[#F2EFE9]">{identity.scientificName}</span>
                </div>

                <div className="dotted-leader">
                  <span className="text-[#5A625E] dark:text-[#949E99]">Taxonomic Family</span>
                  <span className="dotted-leader-fill" />
                  <span className="text-[#141816] dark:text-[#F2EFE9]">{identity.lineage?.family || '—'}</span>
                </div>

                <div className="dotted-leader">
                  <span className="text-[#5A625E] dark:text-[#949E99]">Adult Body Length</span>
                  <span className="dotted-leader-fill" />
                  <span className="text-amber-700 dark:text-[#D4A359] font-semibold">{biology.measurements?.bodyLength || 'Not yet documented'}</span>
                </div>

                <div className="dotted-leader">
                  <span className="text-[#5A625E] dark:text-[#949E99]">Documented Mass</span>
                  <span className="dotted-leader-fill" />
                  <span className="text-amber-700 dark:text-[#D4A359] font-semibold">{biology.measurements?.mass || 'Not yet documented'}</span>
                </div>

                <div className="dotted-leader">
                  <span className="text-[#5A625E] dark:text-[#949E99]">IUCN Red List Status</span>
                  <span className="dotted-leader-fill" />
                  <IucnBadge status={biology.conservation?.iucnStatus} />
                </div>

                <div className="dotted-leader">
                  <span className="text-[#5A625E] dark:text-[#949E99]">Dietary Niche</span>
                  <span className="dotted-leader-fill" />
                  <span className="text-[#141816] dark:text-[#F2EFE9]">{biology.ecology?.diet || biology.ecology?.habitat || 'Wild Envelope'}</span>
                </div>
              </div>
            </div>

            {/* CHAPTER 01: MORPHOMETRIC SCALE & MASS BIOMETRICS */}
            <section aria-label="Interactive Scale Comparator" className="pt-10 border-t border-[#141816]/12 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#141816]/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="specimen-stamp text-amber-800 dark:text-[#D4A359] border-amber-600/30 dark:border-[#D4A359]/30 bg-amber-500/10 font-bold">01</span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#141816] dark:text-[#F2EFE9]">
                    MORPHOMETRIC SCALE & MASS BIOMETRICS
                  </h3>
                </div>
                <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest text-[#5A625E] dark:text-[#949E99]">
                  Anthropometric & Comparative Scale
                </span>
              </div>
              <InteractiveScaleComparator animal={animal} allAnimals={allAnimals} />
            </section>

            {/* CHAPTER 02: HABITAT & BIOME ENVELOPE */}
            <section aria-label="Habitat and Biome Explorer" className="pt-10 border-t border-[#141816]/12 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#141816]/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="specimen-stamp text-[#2E6F54] dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-bold">02</span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#141816] dark:text-[#F2EFE9]">
                    HABITAT & BIOME ENVELOPE
                  </h3>
                </div>
                <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest text-[#5A625E] dark:text-[#949E99]">
                  Circadian Clock & Stratification
                </span>
              </div>
              <HabitatBiomeExplorer
                animal={animal}
                allAnimals={allAnimals}
                onSelectAnimal={onSelectAnimal}
              />
            </section>

            {/* CHAPTER 03: GEOSPATIAL OCCURRENCE & RANGE DISTRIBUTION */}
            <section aria-label="Geospatial Occurrence & Distribution" className="pt-10 border-t border-[#141816]/12 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#141816]/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="specimen-stamp text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10 font-bold">03</span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#141816] dark:text-[#F2EFE9]">
                    GEOSPATIAL OCCURRENCE & RANGE DISTRIBUTION
                  </h3>
                </div>
                <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest text-[#5A625E] dark:text-[#949E99]">
                  GBIF & iNaturalist Satellite Tiles
                </span>
              </div>
              <div className="bg-[#EBE6DC]/35 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 rounded-xl p-5 sm:p-6 space-y-3">
                <GeospatialDistributionViewer
                  animal={animal}
                  mode="full"
                  theme={theme}
                />
              </div>
            </section>

            {/* CHAPTER 04: BIOLOGICAL ADAPTATIONS & DIAGNOSTIC TRAITS */}
            <section aria-label="Biological Superpowers Deck" className="pt-10 border-t border-[#141816]/12 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#141816]/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="specimen-stamp text-amber-800 dark:text-[#D4A359] border-amber-600/30 dark:border-[#D4A359]/30 bg-amber-500/10 font-bold">04</span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#141816] dark:text-[#F2EFE9]">
                    BIOLOGICAL ADAPTATIONS & DIAGNOSTIC TRAITS
                  </h3>
                </div>
                <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest text-[#5A625E] dark:text-[#949E99]">
                  Biomechanical Specializations
                </span>
              </div>
              <BiologicalSuperpowersDeck
                animal={animal}
                onNavigateToCompare={() => {
                  onToggleCompare(animal);
                  onNavigateToCompare?.();
                }}
              />
            </section>

            {/* CHAPTER 05: TAXONOMIC LINEAGE & CLADISTIC DESCENT */}
            <section aria-label="Interactive Lineage Navigator" className="pt-10 border-t border-[#141816]/12 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#141816]/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="specimen-stamp text-[#2E6F54] dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-bold">05</span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#141816] dark:text-[#F2EFE9]">
                    TAXONOMIC LINEAGE & CLADISTIC DESCENT
                  </h3>
                </div>
                <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest text-[#5A625E] dark:text-[#949E99]">
                  Tree of Life Cladistic Descent
                </span>
              </div>
              <InteractiveLineageNavigator
                animal={animal}
                allAnimals={allAnimals}
                onSelectAnimal={onSelectAnimal}
              />
            </section>

            {/* CHAPTER 06: BIOACOUSTIC VOCALIZATION SIGNATURE */}
            <section aria-label="Bioacoustic Vocalization Studio" className="pt-10 border-t border-[#141816]/12 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#141816]/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="specimen-stamp text-amber-800 dark:text-[#D4A359] border-amber-600/30 dark:border-[#D4A359]/30 bg-amber-500/10 font-bold">06</span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#141816] dark:text-[#F2EFE9]">
                    BIOACOUSTIC VOCALIZATION SIGNATURE
                  </h3>
                </div>
                <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest text-[#5A625E] dark:text-[#949E99]">
                  60fps Frequency Spectrum & Acoustic Studio
                </span>
              </div>
              <BioacousticVocalizationDeck animal={animal} />
            </section>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODE 2: SCIENTIFIC DOSSIER (Full Taxonomic Data, GBIF Sync, Provenance) */}
        {/* ===================================================================== */}
        {viewMode === 'DOSSIER' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Dossier Header & GBIF Live Sync Button */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#EBE6DC]/40 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
              <div>
                <span className="text-xs font-mono uppercase text-amber-700 dark:text-[#D4A359] font-bold">
                  Zoological Backbone Record
                </span>
                <h3 className="text-2xl font-serif font-bold mt-1 text-[#141816] dark:text-[#F2EFE9]">
                  Scientific Dossier: {identity.scientificName}
                </h3>
                <p className="text-xs text-[#5A625E] dark:text-[#949E99] mt-1">
                  Complete taxonomic nomenclature, synonym ledger, GBIF usage keys, and IUCN Red List data.
                </p>
              </div>

              <button
                onClick={handleEnrichGbif}
                disabled={isEnrichingGbif}
                className="px-4 py-2.5 rounded-lg bg-[#D4A359] hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isEnrichingGbif ? 'animate-spin' : ''}`} />
                <span>{isEnrichingGbif ? 'Enriching with GBIF...' : 'Sync GBIF Backbone'}</span>
              </button>
            </div>

            {/* Nomenclature & External Identifiers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* External Taxonomic IDs */}
              <div className="p-6 rounded-xl bg-[#EBE6DC]/40 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 space-y-4 shadow-sm">
                <h4 className="text-xs font-mono uppercase text-[#5A625E] dark:text-[#949E99] font-bold tracking-wider">
                  External Taxonomic Identifiers
                </h4>
                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded-lg bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10">
                    <span className="text-[#5A625E] dark:text-[#949E99]">GBIF Usage Key:</span>
                    <span className="font-bold text-amber-700 dark:text-[#D4A359]">
                      {identity.externalIds?.gbifKey ? (
                        <a
                          href={`https://www.gbif.org/species/${identity.externalIds.gbifKey}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          {identity.externalIds.gbifKey} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded-lg bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10">
                    <span className="text-[#5A625E] dark:text-[#949E99]">iNaturalist Taxon ID:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {identity.externalIds?.inatTaxonId ? (
                        <a
                          href={`https://www.inaturalist.org/taxa/${identity.externalIds.inatTaxonId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          {identity.externalIds.inatTaxonId} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between p-2 rounded-lg bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10">
                    <span className="text-[#5A625E] dark:text-[#949E99]">Catalogue of Life ID:</span>
                    <span className="font-bold text-[#141816] dark:text-[#F2EFE9]">{identity.externalIds?.colId || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Conservation & Threat Profile */}
              <div className="p-6 rounded-xl bg-[#EBE6DC]/40 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 space-y-4 shadow-sm">
                <h4 className="text-xs font-mono uppercase text-[#5A625E] dark:text-[#949E99] font-bold tracking-wider">
                  IUCN Red List Assessment
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5A625E] dark:text-[#949E99]">Red List Status:</span>
                    <IucnBadge status={biology.conservation?.iucnStatus} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5A625E] dark:text-[#949E99]">Assessment Year:</span>
                    <span className="font-mono font-bold text-[#141816] dark:text-[#F2EFE9]">{biology.conservation?.assessmentYear || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5A625E] dark:text-[#949E99]">Population Trend:</span>
                    <span className="font-mono font-bold text-amber-700 dark:text-[#D4A359]">
                      {biology.conservation?.populationTrend || 'Stable / Undocumented'}
                    </span>
                  </div>
                  {biology.conservation?.threats && (
                    <div className="pt-2">
                      <span className="text-[11px] font-mono text-[#5A625E] dark:text-[#949E99]">Documented Threats:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {biology.conservation.threats.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Synonym Ledger Table */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#EBE6DC]/40 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 space-y-4 shadow-sm">
              <h4 className="text-xs font-mono uppercase text-[#5A625E] dark:text-[#949E99] font-bold tracking-wider">
                Taxonomic Synonyms Ledger ({identity.synonyms?.length || 0})
              </h4>
              {identity.synonyms && identity.synonyms.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#141816]/10 dark:border-white/10 text-[#5A625E] dark:text-[#949E99]">
                        <th className="py-2.5 font-medium">Scientific Synonym</th>
                        <th className="py-2.5 font-medium">Taxonomic Authority</th>
                        <th className="py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141816]/10 dark:divide-white/10">
                      {identity.synonyms.map((syn, idx) => (
                        <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5">
                          <td className="py-2.5 italic text-[#141816] dark:text-[#F2EFE9]">
                            {syn.scientificName}
                          </td>
                          <td className="py-2.5 text-[#5A625E] dark:text-[#949E99]">{syn.authorship || '—'}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[10px] text-[#141816] dark:text-[#F2EFE9]">
                              {syn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#5A625E] dark:text-[#949E99] italic">No scientific synonyms recorded in current backbone.</p>
              )}
            </div>

            {/* Photographic Provenance & Licensing */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#EBE6DC]/40 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#5A625E] dark:text-[#949E99]">
                <Camera className="w-4 h-4 text-amber-600 dark:text-[#D4A359]" />
                <span>Media License & Strict Provenance (Zero Fabricated Biology)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono pt-2">
                <div className="p-3 rounded-lg bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10">
                  <span className="text-[#5A625E] dark:text-[#949E99] block text-[10px]">Photographer / Attribution:</span>
                  <span className="font-bold text-[#141816] dark:text-white truncate block">
                    {activeAttribution}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10">
                  <span className="text-[#5A625E] dark:text-[#949E99] block text-[10px]">Creative Commons License:</span>
                  <span className="font-bold text-amber-700 dark:text-[#D4A359] block">{activeLicense}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10">
                  <span className="text-[#5A625E] dark:text-[#949E99] block text-[10px]">Source Provider:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{activeProvider}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODE 3: THEATRE GALLERY (Full-Screen Lightbox & Wildlife Photography)  */}
        {/* ===================================================================== */}
        {viewMode === 'THEATRE' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div
              className={`relative rounded-3xl overflow-hidden bg-black border border-slate-800 transition-all ${
                isLightboxZoomed ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl' : 'aspect-[16/10] sm:aspect-[21/9]'
              }`}
            >
              <SmartTaxonImage
                key={theatrePhotoUrl}
                scientificName={identity.scientificName}
                commonName={identity.commonName}
                inatTaxonId={identity.externalIds?.inatTaxonId}
                primaryUrl={theatrePhotoUrl}
                thumbnailUrl={theatreThumbUrl}
                licenseCode={theatreLicense}
                categoryGroup={identity.categoryGroup}
                alt={`${identity.commonName} specimen theatre view ${activePhotoIndex + 1}`}
                className="w-full h-full object-contain"
                containerClassName="w-full h-full flex items-center justify-center bg-black"
                loading="eager"
              />

              {/* Prev / Next Chevrons in Theatre Mode */}
              {speciesGallery.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIndex((prev) => (prev - 1 + speciesGallery.length) % speciesGallery.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/70 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 backdrop-blur-md transition-all shadow-xl hover:scale-105 z-20"
                    title="Previous Photo ([)"
                    aria-label="Previous Photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActivePhotoIndex((prev) => (prev + 1) % speciesGallery.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/70 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 backdrop-blur-md transition-all shadow-xl hover:scale-105 z-20"
                    title="Next Photo (])"
                    aria-label="Next Photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Lightbox Controls & Photo Counter */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                {speciesGallery.length > 1 && (
                  <div className="px-3 py-1.5 rounded-full bg-black/75 text-amber-400 border border-white/20 backdrop-blur-md text-xs font-mono font-semibold">
                    Photo {activePhotoIndex + 1} of {speciesGallery.length}
                  </div>
                )}
                <button
                  onClick={() => setIsLightboxZoomed(!isLightboxZoomed)}
                  className="p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 backdrop-blur-md transition-colors"
                  title={isLightboxZoomed ? 'Exit Full-screen (F)' : 'Expand Full-screen (F)'}
                >
                  {isLightboxZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>

              {/* 35mm Thumbnails Bar in Theatre Mode */}
              {speciesGallery.length > 1 && (
                <div className="absolute bottom-16 left-4 right-4 flex items-center justify-center gap-2 overflow-x-auto py-1.5 px-3 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 max-w-xl mx-auto z-20">
                  {speciesGallery.map((photo, idx) => (
                    <button
                      key={photo.url || idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative w-12 h-8 sm:w-14 sm:h-9 rounded-md overflow-hidden shrink-0 border transition-all ${
                        idx === activePhotoIndex
                          ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                          : 'border-white/20 opacity-60 hover:opacity-100'
                      }`}
                      title={`Photo ${idx + 1}`}
                      aria-label={`Jump to photo ${idx + 1}`}
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={`thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Image Attribution Strip */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center justify-between text-xs text-white z-20">
                <div className="flex items-center gap-2 truncate">
                  <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{theatreAttribution}</span>
                  <span className="font-mono text-amber-400">({theatreLicense})</span>
                </div>
                {theatreSourceUrl ? (
                  <a
                    href={theatreSourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[10px] font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1 shrink-0"
                  >
                    <span>Source Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    Verified Taxon Match
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-2 font-mono">
              <span>High-resolution CDN photography verified via {theatreProvider}</span>
              <button
                onClick={() => setViewMode('EXPEDITION')}
                className="text-amber-500 hover:underline flex items-center gap-1 font-sans"
              >
                <span>Return to Expedition View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE BOTTOM NAVIGATION SHEET (THUMB-FRIENDLY CONTROLS)               */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#F5F2EB]/95 dark:bg-[#070A09]/95 backdrop-blur-md border-t border-[#141816]/10 dark:border-white/10 px-4 py-2.5 flex items-center justify-around shadow-xl transition-colors">
        <button
          onClick={() => setViewMode('EXPEDITION')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            viewMode === 'EXPEDITION' ? 'text-amber-700 dark:text-[#D4A359] font-bold' : 'text-[#5A625E] dark:text-[#949E99]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Expedition</span>
        </button>

        <button
          onClick={() => setViewMode('DOSSIER')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            viewMode === 'DOSSIER' ? 'text-amber-700 dark:text-[#D4A359] font-bold' : 'text-[#5A625E] dark:text-[#949E99]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Dossier</span>
        </button>

        <button
          onClick={() => setViewMode('THEATRE')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            viewMode === 'THEATRE' ? 'text-amber-700 dark:text-[#D4A359] font-bold' : 'text-[#5A625E] dark:text-[#949E99]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Theatre</span>
        </button>

        <div className="h-5 w-[1px] bg-[#141816]/10 dark:border-white/10 mx-1" />

        {prevAnimal && (
          <button
            onClick={() => onSelectAnimal(prevAnimal)}
            className="p-1.5 text-slate-600 dark:text-slate-300"
            title="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {nextAnimal && (
          <button
            onClick={() => onSelectAnimal(nextAnimal)}
            className="p-1.5 text-slate-600 dark:text-slate-300"
            title="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </nav>

      {/* Archival Monograph Broadsheet Exporter Modal */}
      <MonographPosterExporter
        animal={animal}
        isOpen={isMonographExporterOpen}
        onClose={() => setIsMonographExporterOpen(false)}
      />
    </div>
  );
}
