/**
 * ANIMALIA — ExploreSection (Phase 6 Production Virtualized Grid & Taxonomic Ledger)
 * 
 * Features:
 * - High-performance 60fps virtualization via @tanstack/react-virtual
 * - Responsive multi-column grid & compact Taxonomic Ledger table
 * - WCAG 2.1 AA accessibility (ARIA landmarks, focus rings, live regions)
 * - Dynamic container resize measurement and recycling
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Globe,
  RefreshCw,
  Compass,
  LayoutGrid,
  List,
  Eye,
  Bookmark,
  Scale,
  Sparkles
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimalRecord } from '../../types/taxonomy.ts';
import { ANIMAL_CATEGORIES } from '../../constants/categories.ts';
import { searchLiveBiodiversityGlobal, fetchGlobalCladeTaxaPage } from '../../services/inaturalistService.ts';
import { getCanonicalBinomial } from '../../services/supabaseRepository.ts';
import { AnimalCard } from './AnimalCard.tsx';
import { IucnBadge } from '../common/IucnBadge.tsx';
import { TaxonomicSilhouette } from '../common/TaxonomicSilhouette.tsx';
import { SmartTaxonImage } from '../common/SmartTaxonImage.tsx';
import { DataSourceBadge } from '../common/DataSourceBadge.tsx';

interface ExploreSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedIucnFilter: string;
  setSelectedIucnFilter: (filter: string) => void;
  combinedAnimals: AnimalRecord[];
  filteredAnimals: AnimalRecord[];
  savedAnimalsMap: Record<string, AnimalRecord>;
  handleToggleFavorite: (animal: AnimalRecord) => void;
  comparisonIds: string[];
  handleToggleCompare: (animal: AnimalRecord) => void;
  handleSelectAnimal: (animal: AnimalRecord) => void;
  onMergeLiveAnimals: (liveResults: AnimalRecord[]) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export function ExploreSection({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedIucnFilter,
  setSelectedIucnFilter,
  combinedAnimals,
  filteredAnimals,
  savedAnimalsMap,
  handleToggleFavorite,
  comparisonIds,
  handleToggleCompare,
  handleSelectAnimal,
  onMergeLiveAnimals,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore
}: ExploreSectionProps) {
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastLiveCount, setLastLiveCount] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'LEDGER'>('GRID');

  // Global Biodiversity Streaming State
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingPage, setStreamingPage] = useState<number>(1);
  const [autoStreamOnScroll, setAutoStreamOnScroll] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamedCount, setStreamedCount] = useState<number>(0);

  // Reset streaming page when category changes
  useEffect(() => {
    setStreamingPage(1);
    setStreamError(null);
  }, [selectedCategory]);

  const handleLoadMoreStream = async () => {
    if (isStreaming) return;
    setIsStreaming(true);
    setStreamError(null);
    try {
      const nextPage = streamingPage + 1;
      const results = await fetchGlobalCladeTaxaPage(selectedCategory, nextPage, 24);

      // Deduplicate results against existing combinedAnimals by:
      // 1. canonical binomial
      // 2. externalIds.inatTaxonId
      // 3. externalIds.gbifKey
      const existingNames = new Set(
        combinedAnimals.map((a) =>
          a.identity?.scientificName?.includes('"')
            ? a.identity.scientificName.toLowerCase()
            : getCanonicalBinomial(a.identity?.scientificName)
        ).filter(Boolean)
      );
      const existingInatIds = new Set(
        combinedAnimals.map((a) => a.identity?.externalIds?.inatTaxonId).filter(Boolean)
      );
      const existingGbifKeys = new Set(
        combinedAnimals.map((a) => a.identity?.externalIds?.gbifKey).filter(Boolean)
      );

      const newUnique = results.filter((r) => {
        const bin = r.identity?.scientificName?.includes('"')
          ? r.identity.scientificName.toLowerCase()
          : getCanonicalBinomial(r.identity?.scientificName);
        const inat = r.identity?.externalIds?.inatTaxonId;
        const gbif = r.identity?.externalIds?.gbifKey;

        if (bin && existingNames.has(bin)) return false;
        if (inat && existingInatIds.has(inat)) return false;
        if (gbif && existingGbifKeys.has(gbif)) return false;
        return true;
      });

      if (newUnique.length > 0) {
        onMergeLiveAnimals(newUnique);
        setStreamedCount((prev) => prev + newUnique.length);
      }
      setStreamingPage(nextPage);
    } catch (err: any) {
      setStreamError(err?.message || 'Failed to stream from global biodiversity catalog');
    } finally {
      setIsStreaming(false);
    }
  };

  // Virtualization Scroll Container & Dynamic Columns
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState<number>(3);

  // Responsive column detection via ResizeObserver
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const updateColumns = (width: number) => {
      if (width < 640) setColumnCount(1);
      else if (width < 1024) setColumnCount(2);
      else setColumnCount(3);
    };

    updateColumns(el.clientWidth);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateColumns(entry.contentRect.width);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-stream on scroll listener
  useEffect(() => {
    if (!autoStreamOnScroll) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    let debounceTimer: NodeJS.Timeout | null = null;
    const onScroll = () => {
      if (isStreaming) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - (scrollTop + clientHeight) < 350) {
        if (!debounceTimer) {
          debounceTimer = setTimeout(() => {
            debounceTimer = null;
            handleLoadMoreStream();
          }, 350);
        }
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [autoStreamOnScroll, isStreaming, streamingPage, selectedCategory, combinedAnimals]);

  // Chunk items into rows for virtualized grid
  const gridRows = useMemo(() => {
    const rows: AnimalRecord[][] = [];
    for (let i = 0; i < filteredAnimals.length; i += columnCount) {
      rows.push(filteredAnimals.slice(i, i + columnCount));
    }
    return rows;
  }, [filteredAnimals, columnCount]);

  // Virtualizer for Grid View
  const gridVirtualizer = useVirtualizer({
    count: gridRows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 520, // Estimated pixel height of row of AnimalCards
    overscan: 5
  });

  // Virtualizer for Taxonomic Ledger View
  const ledgerVirtualizer = useVirtualizer({
    count: filteredAnimals.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 72, // Estimated pixel height of ledger row
    overscan: 8
  });

  const triggerLiveGlobalSearch = async (customQuery?: string) => {
    const q = (customQuery ?? searchQuery).trim();
    if (!q) return;
    setIsSearchingLive(true);
    setLiveError(null);
    try {
      const results = await searchLiveBiodiversityGlobal(q);
      const existingNames = new Set(
        combinedAnimals.map((a) =>
          a.identity?.scientificName?.includes('"')
            ? a.identity.scientificName.toLowerCase()
            : getCanonicalBinomial(a.identity?.scientificName)
        ).filter(Boolean)
      );
      const existingInatIds = new Set(
        combinedAnimals.map((a) => a.identity?.externalIds?.inatTaxonId).filter(Boolean)
      );
      const existingGbifKeys = new Set(
        combinedAnimals.map((a) => a.identity?.externalIds?.gbifKey).filter(Boolean)
      );

      const uniqueResults = results.filter((r) => {
        const bin = r.identity?.scientificName?.includes('"')
          ? r.identity.scientificName.toLowerCase()
          : getCanonicalBinomial(r.identity?.scientificName);
        const inat = r.identity?.externalIds?.inatTaxonId;
        const gbif = r.identity?.externalIds?.gbifKey;

        if (bin && existingNames.has(bin)) return false;
        if (inat && existingInatIds.has(inat)) return false;
        if (gbif && existingGbifKeys.has(gbif)) return false;
        return true;
      });

      onMergeLiveAnimals(uniqueResults);
      setLastLiveCount(uniqueResults.length);
    } catch (err: any) {
      setLiveError(err.message || 'Live biodiversity API request failed.');
    } finally {
      setIsSearchingLive(false);
    }
  };

  const discoveryPresets = [
    'Pangolin',
    'Mantis Shrimp',
    'Tardigrade',
    'Cassowary',
    'Nautilus',
    'Wolverine',
    'Leaf Sheep'
  ];

  return (
    <section
      role="region"
      aria-label="Biodiversity Exploration and Discovery"
      className="space-y-6"
    >
      {/* Search & Filter Header (Role: Search) */}
      <div
        role="search"
        aria-label="Filter and search animal taxa"
        className="bg-[#EBE6DC]/70 dark:bg-[#0D1210]/90 backdrop-blur-md border border-[#141816]/10 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="w-5 h-5 text-amber-600 dark:text-[#D4A359] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              id="taxa-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
                  triggerLiveGlobalSearch(searchQuery);
                }
              }}
              aria-label="Search animal species by common or scientific name"
              placeholder="Search reference taxa or press Enter for live global API... (⌘K or / to focus)"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/15 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A359] text-[#141816] dark:text-[#F2EFE9] placeholder-[#5A625E] dark:placeholder-[#949E99] font-sans transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerLiveGlobalSearch(searchQuery)}
              disabled={isSearchingLive || searchQuery.trim().length < 2}
              aria-label="Query live global biodiversity databases"
              className="px-4 py-3 rounded-xl bg-[#2E6F54] hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shrink-0 shadow-sm"
            >
              {isSearchingLive ? (
                <RefreshCw aria-hidden="true" className="w-4 h-4 animate-spin" />
              ) : (
                <Globe aria-hidden="true" className="w-4 h-4" />
              )}
              <span>{isSearchingLive ? 'Querying APIs...' : 'Query Live Global API'}</span>
            </button>

            {/* View Mode Toggle (Grid vs Ledger Table) */}
            <div className="flex items-center bg-[#EBE6DC] dark:bg-[#070A09] p-1 rounded-xl border border-[#141816]/10 dark:border-white/10">
              <button
                onClick={() => setViewMode('GRID')}
                aria-label="Switch to Card Grid View"
                aria-pressed={viewMode === 'GRID'}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'GRID'
                    ? 'bg-[#F5F2EB] dark:bg-[#121917] text-amber-700 dark:text-[#D4A359] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('LEDGER')}
                aria-label="Switch to High-Density Taxonomic Ledger Table View"
                aria-pressed={viewMode === 'LEDGER'}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'LEDGER'
                    ? 'bg-[#F5F2EB] dark:bg-[#121917] text-amber-700 dark:text-[#D4A359] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Live Discovery Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-[11px] text-[#5A625E] dark:text-[#949E99]">
            Archival Presets:
          </span>
          {discoveryPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setSearchQuery(preset);
                triggerLiveGlobalSearch(preset);
              }}
              aria-label={`Search for ${preset}`}
              className="px-2.5 py-1 rounded-md bg-[#F5F2EB] dark:bg-[#070A09] hover:bg-amber-500/20 hover:text-amber-700 dark:hover:text-[#D4A359] border border-[#141816]/10 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-amber-500 font-mono text-[11px] transition-colors text-[#141816] dark:text-[#F2EFE9]"
            >
              + {preset}
            </button>
          ))}
          {lastLiveCount !== null && !liveError && (
            <span
              role="status"
              aria-live="polite"
              className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px] ml-auto"
            >
              ✓ Hydrated {lastLiveCount} live species from iNaturalist
            </span>
          )}
          {liveError && (
            <span role="alert" className="text-red-500 font-mono text-[11px] ml-auto">
              ⚠ {liveError}
            </span>
          )}
        </div>

        {/* Horizontal Taxonomic Index Bar */}
        <div
          role="group"
          aria-label="Taxonomic Group Filter"
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 pt-1 border-t border-[#141816]/10 dark:border-white/10"
        >
          {ANIMAL_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count =
              cat.id === 'ALL'
                ? combinedAnimals.length
                : combinedAnimals.filter((a) => a.identity.categoryGroup === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={isActive}
                aria-label={`Filter by ${cat.label}, ${count} species available`}
                className={`px-3 py-2 text-xs sm:text-sm font-serif tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-all border-b-2 focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isActive
                    ? 'border-amber-600 dark:border-[#D4A359] text-amber-700 dark:text-[#D4A359] font-bold'
                    : 'border-transparent text-[#5A625E] dark:text-[#949E99] hover:text-[#141816] dark:hover:text-[#F2EFE9] font-medium'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono tracking-tighter ${
                    isActive
                      ? 'text-amber-800 dark:text-[#D4A359]'
                      : 'text-[#949E99] dark:text-slate-500'
                  }`}
                >
                  [{count}]
                </span>
              </button>
            );
          })}
        </div>

        {/* Conservation Filter Row & Result Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#141816]/10 dark:border-white/10">
          <div
            role="group"
            aria-label="IUCN Conservation Status Filter"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-[11px] font-mono uppercase text-[#5A625E] dark:text-[#949E99] mr-1">Conservation:</span>
            {[
              { id: 'ALL', label: 'All Statuses' },
              { id: 'THREATENED', label: 'Threatened (CR / EN / VU)' },
              { id: 'LC', label: 'Least Concern (LC)' },
              { id: 'EX', label: 'Extinct (EX / EW)' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedIucnFilter(f.id)}
                aria-pressed={selectedIucnFilter === f.id}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  selectedIucnFilter === f.id
                    ? 'bg-amber-500/15 text-amber-700 dark:text-[#D4A359] border border-amber-600/30 dark:border-[#D4A359]/40 font-semibold'
                    : 'text-[#5A625E] dark:text-[#949E99] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div
            role="status"
            aria-live="polite"
            className="text-xs font-mono text-slate-500 dark:text-slate-400"
          >
            Showing <strong className="text-amber-500">{filteredAnimals.length}</strong> verified taxa
          </div>
        </div>
      </div>

      {/* Virtualized Discovery Viewport */}
      {filteredAnimals.length === 0 ? (
        <div className="bg-[#EBE6DC]/60 dark:bg-[#0D1210]/90 border border-[#141816]/10 dark:border-white/10 rounded-2xl p-10 text-center space-y-4">
          <Compass className="w-10 h-10 text-amber-600 dark:text-[#D4A359] mx-auto" />
          <h3 className="text-xl font-serif font-bold text-[#141816] dark:text-[#F2EFE9]">No matching species found</h3>
          <p className="text-sm text-[#5A625E] dark:text-[#949E99] max-w-md mx-auto">
            Query the live iNaturalist & GBIF biodiversity backbone to fetch real wildlife photography and
            authoritative records for "{searchQuery}".
          </p>
          {searchQuery.trim().length >= 2 && (
            <button
              onClick={() => triggerLiveGlobalSearch(searchQuery)}
              className="px-5 py-2.5 rounded-xl bg-[#2E6F54] hover:bg-emerald-600 text-white font-semibold text-sm inline-flex items-center gap-2 shadow"
            >
              <Globe className="w-4 h-4" />
              <span>Fetch "{searchQuery}" from Live Global API</span>
            </button>
          )}
        </div>
      ) : viewMode === 'GRID' ? (
        /* ================= VIRTUALIZED CARD GRID ================= */
        <div
          ref={scrollContainerRef}
          role="feed"
          aria-label="Virtualized wildlife cards grid"
          className="h-[75vh] overflow-y-auto pr-2 relative focus:outline-none"
        >
          <div
            style={{
              height: `${gridVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {gridVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowAnimals = gridRows[virtualRow.index] || [];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={gridVirtualizer.measureElement}
                  className="absolute top-0 left-0 w-full pb-6"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  <div
                    className={`grid gap-6 ${
                      columnCount === 1
                        ? 'grid-cols-1'
                        : columnCount === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                    }`}
                  >
                    {rowAnimals.map((animal) => (
                      <AnimalCard
                        key={animal.id}
                        animal={animal}
                        isFavorite={Boolean(savedAnimalsMap[animal.id])}
                        onToggleFavorite={handleToggleFavorite}
                        isCompared={comparisonIds.includes(animal.id)}
                        onToggleCompare={handleToggleCompare}
                        onSelectAnimal={handleSelectAnimal}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite Scroll Load Trigger */}
          {hasMore && (
            <div className="py-6 text-center">
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2.5 rounded-xl bg-[#EBE6DC] dark:bg-[#0D1210] border border-[#141816]/10 dark:border-white/10 text-xs font-mono hover:bg-amber-500/20 hover:text-amber-700 dark:hover:text-[#D4A359] transition-colors"
              >
                {isLoadingMore ? 'Loading next keyset batch...' : 'Load More Species (Keyset Keyset)'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= VIRTUALIZED TAXONOMIC LEDGER ================= */
        <div
          ref={scrollContainerRef}
          role="table"
          aria-label="Virtualized taxonomic ledger table"
          className="h-[75vh] overflow-y-auto bg-[#EBE6DC]/40 dark:bg-[#0D1210]/80 border border-[#141816]/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Table Header */}
          <div
            role="row"
            className="sticky top-0 z-10 bg-[#EBE6DC] dark:bg-[#070A09] border-b border-[#141816]/10 dark:border-white/10 px-4 py-3 grid grid-cols-12 gap-3 text-[11px] font-mono text-[#5A625E] dark:text-[#949E99] uppercase tracking-wider font-semibold"
          >
            <div className="col-span-1" role="columnheader">Specimen</div>
            <div className="col-span-4" role="columnheader">Species & Nomenclature</div>
            <div className="col-span-3" role="columnheader">Phylogenetic Clade</div>
            <div className="col-span-2" role="columnheader">IUCN Status</div>
            <div className="col-span-2 text-right" role="columnheader">Actions</div>
          </div>

          {/* Table Body */}
          <div
            style={{
              height: `${ledgerVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {ledgerVirtualizer.getVirtualItems().map((virtualRow) => {
              const animal = filteredAnimals[virtualRow.index];
              if (!animal) return null;
              const isFav = Boolean(savedAnimalsMap[animal.id]);
              const isCmp = comparisonIds.includes(animal.id);

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={ledgerVirtualizer.measureElement}
                  role="row"
                  className="absolute top-0 left-0 w-full px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60 grid grid-cols-12 gap-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  {/* Thumbnail / Silhouette */}
                  <div className="col-span-1 flex items-center justify-center" role="cell">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700/40">
                      <SmartTaxonImage
                        scientificName={animal.identity.scientificName}
                        commonName={animal.identity.commonName}
                        inatTaxonId={animal.identity.externalIds?.inatTaxonId}
                        primaryUrl={animal.media?.url}
                        thumbnailUrl={animal.media?.thumbnailUrl}
                        licenseCode={animal.media?.licenseCode}
                        categoryGroup={animal.identity.categoryGroup}
                        alt={animal.identity.commonName}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Species & Nomenclature */}
                  <div className="col-span-4 min-w-0" role="cell">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {animal.identity.commonName}
                      </span>
                      <DataSourceBadge sourceType={animal.dataSource} />
                    </div>
                    <div className="font-mono italic text-xs text-slate-500 dark:text-slate-400 truncate">
                      {animal.identity.scientificName}
                    </div>
                  </div>

                  {/* Phylogenetic Clade */}
                  <div className="col-span-3 text-xs font-mono text-slate-600 dark:text-slate-400 truncate" role="cell">
                    <span className="text-amber-500 font-semibold">{animal.identity.categoryGroup}</span>
                    {animal.identity.lineage?.order && (
                      <span className="text-slate-500"> › {animal.identity.lineage.order}</span>
                    )}
                  </div>

                  {/* IUCN Status */}
                  <div className="col-span-2 flex items-center" role="cell">
                    <IucnBadge status={animal.biology.conservation?.iucnStatus} />
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5" role="cell">
                    <button
                      onClick={() => handleToggleFavorite(animal)}
                      aria-label={`${isFav ? 'Remove from' : 'Add to'} collection`}
                      className={`p-2 rounded-xl text-xs transition-colors ${
                        isFav
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-400'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleCompare(animal)}
                      aria-label={`${isCmp ? 'Remove from' : 'Add to'} comparison`}
                      className={`p-2 rounded-xl text-xs transition-colors ${
                        isCmp
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-400'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleSelectAnimal(animal)}
                      aria-label={`Inspect ${animal.identity.commonName} full profile`}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-slate-950 text-xs font-mono font-semibold flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= INFINITE GLOBAL BIODIVERSITY STREAM CONTROL DECK ================= */}
      <div className="rounded-3xl p-6 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-white">
              Infinite Global Biodiversity Stream
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
              2.1M+ Species Backbone
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Streaming live verified specimens from iNaturalist & GBIF for clade{' '}
            <span className="text-amber-500 font-semibold">{selectedCategory}</span>.
            {streamedCount > 0 && ` (${streamedCount} new species streamed in this session)`}
          </p>
          {streamError && (
            <p className="text-xs text-rose-500 font-mono mt-1">{streamError}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300 cursor-pointer select-none bg-white dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={autoStreamOnScroll}
              onChange={(e) => setAutoStreamOnScroll(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-400"
            />
            <span>Auto-stream on scroll</span>
          </label>

          <button
            onClick={handleLoadMoreStream}
            disabled={isStreaming}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all ${
              isStreaming
                ? 'bg-amber-500/50 text-slate-900 cursor-wait'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
            }`}
          >
            {isStreaming ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Streaming 24 Specimens...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load 24 More Species from Global Catalog</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
