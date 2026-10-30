import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_TAXA, DEFAULT_COMPARISON_IDS } from './data/initialTaxa';
import { AnimalRecord, DiscoveryHistoryEntry } from './types/taxonomy';
import { Header } from './components/common/Header';
import { ExploreSection } from './components/discovery/ExploreSection';
import { ComparisonMatrix } from './components/compare/ComparisonMatrix';
import { SpeciesExpeditionPage } from './components/profile/SpeciesExpeditionPage';
import { AntigravityHandoffWorkbench } from './components/workbench/AntigravityHandoffWorkbench';
import { DailyDiscoveryHero } from './components/engagement/DailyDiscoveryHero';
import { DailySpecimenMystery } from './components/engagement/DailySpecimenMystery';
import { AdaptiveQuizEngine } from './components/engagement/AdaptiveQuizEngine';
import { CollectionsWorkspace } from './components/engagement/CollectionsWorkspace';
import { DiscoveryMilestoneTracker } from './components/engagement/DiscoveryMilestoneTracker';
import { repository, getCanonicalBinomial } from './services/supabaseRepository';
import { useInfiniteTaxaScroll } from './hooks/useInfiniteTaxaScroll';

export default function App() {
  // Theme Engine (Dark / Light)
  const [theme, setTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('animalia_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('animalia_theme', theme);
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  // Platform Navigation State (Default to Explore)
  const [activeTab, setActiveTab] = useState<string>('EXPLORE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedIucnFilter, setSelectedIucnFilter] = useState<string>('ALL');

  // Keyset Cursor-Based Infinite Pagination Hook
  const {
    taxa: paginatedTaxa,
    hasMore,
    isLoadingMore,
    loadMore,
    mergeLiveResults,
    updateTaxon
  } = useInfiniteTaxaScroll({
    categoryGroup: selectedCategory,
    iucnStatus: selectedIucnFilter,
    searchQuery,
    pageSize: 24
  });

  // Specimen Inspector Modal State
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalRecord | null>(null);
  const [profileTab, setProfileTab] = useState<string>('OVERVIEW');

  // Daily Specimen Mystery Modal State
  const [isDailyMysteryOpen, setIsDailyMysteryOpen] = useState<boolean>(false);

  // Comparison & Collection State
  const [comparisonIds, setComparisonIds] = useState<string[]>(DEFAULT_COMPARISON_IDS);
  const [savedAnimalsMap, setSavedAnimalsMap] = useState<Record<string, AnimalRecord>>({});
  const [discoveryHistory, setDiscoveryHistory] = useState<DiscoveryHistoryEntry[]>([]);

  // Seed repository on mount
  useEffect(() => {
    repository.seedFromBundle(INITIAL_TAXA);
    repository.getDiscoveryHistory().then((hist) => {
      if (hist && hist.length > 0) setDiscoveryHistory(hist);
    });
  }, []);

  // Comprehensive taxon lookup pool (guaranteed zero duplicates)
  const allKnownAnimals = useMemo(() => {
    const map = new Map<string, AnimalRecord>();
    const seenBinomials = new Set<string>();

    const addTaxon = (a: AnimalRecord) => {
      const bin = a.identity?.scientificName?.includes('"')
        ? a.identity.scientificName.toLowerCase()
        : getCanonicalBinomial(a.identity?.scientificName);

      if (bin && seenBinomials.has(bin)) {
        return;
      }
      if (bin) seenBinomials.add(bin);
      map.set(a.id, a);
    };

    INITIAL_TAXA.forEach(addTaxon);
    paginatedTaxa.forEach(addTaxon);
    return Array.from(map.values());
  }, [paginatedTaxa]);

  const handleToggleFavorite = useCallback((animal: AnimalRecord) => {
    setSavedAnimalsMap((prev) => {
      const next = { ...prev };
      if (next[animal.id]) delete next[animal.id];
      else next[animal.id] = animal;
      return next;
    });
  }, []);

  const handleToggleCompare = useCallback((animal: AnimalRecord) => {
    setComparisonIds((prev) => {
      if (prev.includes(animal.id)) return prev.filter((id) => id !== animal.id);
      if (prev.length >= 4) return [...prev.slice(1), animal.id];
      return [...prev, animal.id];
    });
  }, []);

  const handleSelectAnimal = useCallback((animal: AnimalRecord) => {
    setSelectedAnimal(animal);
    window.location.hash = `#/species/${animal.id}`;
    const entry: DiscoveryHistoryEntry = {
      taxonId: animal.id,
      commonName: animal.identity.commonName,
      scientificName: animal.identity.scientificName,
      inspectedAt: new Date().toISOString()
    };
    setDiscoveryHistory((prev) => [
      entry,
      ...prev.filter((h) => h.taxonId !== animal.id)
    ]);
    repository.recordDiscoveryHistory(entry);
  }, []);

  const handleCloseExpedition = useCallback(() => {
    setSelectedAnimal(null);
    if (window.location.hash.startsWith('#/species/')) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Hash-based deep link and browser Back/Forward listener
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/species/')) {
        const id = hash.replace('#/species/', '').trim();
        const found = allKnownAnimals.find((a) => a.id === id);
        if (found && (!selectedAnimal || selectedAnimal.id !== found.id)) {
          setSelectedAnimal(found);
        }
      } else if (!hash && selectedAnimal) {
        setSelectedAnimal(null);
      }
    };

    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, [allKnownAnimals, selectedAnimal]);

  const handleMergeLiveAnimals = useCallback((liveResults: AnimalRecord[]) => {
    mergeLiveResults(liveResults);
    repository.seedFromBundle(liveResults);
  }, [mergeLiveResults]);

  const handleUpdateAnimal = useCallback((updated: AnimalRecord) => {
    setSelectedAnimal(updated);
    updateTaxon(updated);
    repository.upsertTaxon(updated);
  }, [updateTaxon]);

  const comparedAnimalsList = useMemo(
    () => comparisonIds.map((id) => allKnownAnimals.find((a) => a.id === id)).filter(Boolean) as AnimalRecord[],
    [comparisonIds, allKnownAnimals]
  );
  const savedAnimalsList = Object.values(savedAnimalsMap);

  return (
    <div className="min-h-screen bg-[#F5F2EB] dark:bg-[#070A09] text-[#141816] dark:text-[#F2EFE9] font-sans transition-colors duration-300 flex flex-col relative archival-grain">
      {/* Platform Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        comparedCount={comparedAnimalsList.length}
        savedCount={savedAnimalsList.length}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenDailyMystery={() => setIsDailyMysteryOpen(true)}
      />

      {/* Main Experience Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* EXPLORE TAB */}
        {activeTab === 'EXPLORE' && (
          <ExploreSection
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedIucnFilter={selectedIucnFilter}
            setSelectedIucnFilter={setSelectedIucnFilter}
            combinedAnimals={allKnownAnimals}
            filteredAnimals={paginatedTaxa}
            savedAnimalsMap={savedAnimalsMap}
            handleToggleFavorite={handleToggleFavorite}
            comparisonIds={comparisonIds}
            handleToggleCompare={handleToggleCompare}
            handleSelectAnimal={handleSelectAnimal}
            onMergeLiveAnimals={handleMergeLiveAnimals}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
          />
        )}

        {/* PHASE 4: DISCOVERY & QUIZZES TAB */}
        {activeTab === 'DISCOVERY_QUIZZES' && (
          <div className="space-y-10">
            {/* Daily Deterministic Spotlight */}
            <DailyDiscoveryHero
              animals={allKnownAnimals}
              onSelectAnimal={handleSelectAnimal}
              isFavorite={Boolean(allKnownAnimals[0] && savedAnimalsMap[allKnownAnimals[0].id])}
              onToggleFavorite={handleToggleFavorite}
              isCompared={Boolean(allKnownAnimals[0] && comparisonIds.includes(allKnownAnimals[0].id))}
              onToggleCompare={handleToggleCompare}
              onOpenDailyMystery={() => setIsDailyMysteryOpen(true)}
            />

            {/* Adaptive Biodiversity Quiz Engine */}
            <AdaptiveQuizEngine
              animals={allKnownAnimals}
              onSelectAnimal={handleSelectAnimal}
            />

            {/* Educational Milestones & Exploration Tracker */}
            <DiscoveryMilestoneTracker
              discoveryHistory={discoveryHistory}
              allAnimals={allKnownAnimals}
              onSelectAnimal={handleSelectAnimal}
            />
          </div>
        )}

        {/* PHASE 4: THEMATIC COLLECTIONS WORKSPACE */}
        {activeTab === 'COLLECTIONS' && (
          <CollectionsWorkspace
            allAnimals={allKnownAnimals}
            onSelectAnimal={handleSelectAnimal}
            savedAnimalsMap={savedAnimalsMap}
            onToggleFavorite={handleToggleFavorite}
            comparisonIds={comparisonIds}
            onToggleCompare={handleToggleCompare}
          />
        )}

        {/* MULTI-SPECIES COMPARISON MATRIX */}
        {activeTab === 'COMPARE' && (
          <ComparisonMatrix
            comparedAnimals={comparedAnimalsList}
            onRemoveAnimal={handleToggleCompare}
            onSetPreset={setComparisonIds}
            onSelectAnimal={handleSelectAnimal}
            onNavigateToExplore={() => setActiveTab('EXPLORE')}
          />
        )}

        {/* ANTIGRAVITY HANDOFF WORKBENCH */}
        {activeTab === 'ANTIGRAVITY' && (
          <AntigravityHandoffWorkbench
            animals={allKnownAnimals}
            savedAnimals={savedAnimalsList}
            comparisonIds={comparisonIds}
            discoveryHistory={discoveryHistory}
          />
        )}
      </main>

      {/* Interactive Species Expedition Page */}
      {selectedAnimal && (
        <SpeciesExpeditionPage
          animal={selectedAnimal}
          onClose={handleCloseExpedition}
          isFavorite={Boolean(savedAnimalsMap[selectedAnimal.id])}
          onToggleFavorite={handleToggleFavorite}
          isCompared={comparisonIds.includes(selectedAnimal.id)}
          onToggleCompare={handleToggleCompare}
          allAnimals={allKnownAnimals}
          onSelectAnimal={handleSelectAnimal}
          onUpdateAnimal={handleUpdateAnimal}
          theme={theme}
          toggleTheme={toggleTheme}
          onNavigateToCompare={() => setActiveTab('COMPARE')}
        />
      )}

      {/* ANIMALIA Daily Bioacoustic & Taxonomic Mystery Modal */}
      <DailySpecimenMystery
        isOpen={isDailyMysteryOpen}
        onClose={() => setIsDailyMysteryOpen(false)}
        allAnimals={allKnownAnimals}
        onSelectAnimal={handleSelectAnimal}
      />
    </div>
  );
}
